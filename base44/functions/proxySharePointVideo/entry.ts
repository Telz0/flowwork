import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CONNECTOR_ID = "69f08e6060f2243cb70a95b4";

// Admin user IDs die SharePoint verbonden hebben
const ADMIN_USER_IDS = [
  '69f08744cf810ff9c68b76fd', // trochgilian@gmail.com
  '69f0923dcc6b2c73b1547119', // gilian@abnd.com
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { video_url } = body;
    if (!video_url) {
      return Response.json({ error: 'Geen video_url ontvangen' }, { status: 400 });
    }

    // Extraheer bestandsnaam
    const urlObj = new URL(video_url);
    const parts = decodeURIComponent(urlObj.pathname).split('/');
    const fileName = parts[parts.length - 1];

    // Haal accessToken op: probeer huidige user, dan admin fallback
    let accessToken = null;

    // Probeer huidige user
    try {
      const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);
      if (conn?.accessToken) accessToken = conn.accessToken;
    } catch { /* geen connector voor deze user */ }

    // Probeer admin users als fallback via service role + impersonation workaround:
    // Voer calls uit namens admin door hun connector op te halen via admin SDK calls
    if (!accessToken) {
      for (const adminId of ADMIN_USER_IDS) {
        try {
          // Gebruik de service role SDK om de admin's user record op te halen
          // en dan via die context de connector op te halen
          const adminBase44 = base44.asServiceRole;
          const conn = await adminBase44.connectors.getCurrentAppUserConnection(CONNECTOR_ID, adminId);
          if (conn?.accessToken) {
            accessToken = conn.accessToken;
            break;
          }
        } catch { /* probeer volgende */ }
      }
    }

    if (!accessToken) {
      return Response.json({ 
        error: 'Geen SharePoint verbinding. Vraag uw beheerder om de SharePoint-koppeling te vernieuwen via het Beheer-scherm.' 
      }, { status: 403 });
    }

    // Haal @microsoft.graph.downloadUrl op via Graph API
    const siteRes = await fetch(
      `https://graph.microsoft.com/v1.0/sites/abvandbynd.sharepoint.com:/`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const site = await siteRes.json();
    if (!site.id) return Response.json({ error: 'SharePoint site niet gevonden' }, { status: 500 });

    const driveRes = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${site.id}/drive`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const drive = await driveRes.json();
    if (!drive.id) return Response.json({ error: 'Drive niet gevonden' }, { status: 500 });

    const FOLDER_PATH = "APP INSTRUCTION VIDEO'S";
    const itemRes = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${drive.id}/root:/${FOLDER_PATH}/${encodeURIComponent(fileName)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const item = await itemRes.json();
    const downloadUrl = item['@microsoft.graph.downloadUrl'];
    if (!downloadUrl) {
      return Response.json({ error: 'Bestand niet gevonden: ' + fileName }, { status: 404 });
    }

    return Response.json({ download_url: downloadUrl });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});