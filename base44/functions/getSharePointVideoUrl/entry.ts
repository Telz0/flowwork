import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CONNECTOR_ID = "69f08e6060f2243cb70a95b4";

// Probeer altijd de admin-users connector te gebruiken via hun bekende user IDs
// door impersonation via asServiceRole
async function getAccessToken(base44) {
  // Eerst proberen: de huidige gebruiker
  try {
    const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);
    if (conn?.accessToken) return conn.accessToken;
  } catch { /* geen connector voor deze user */ }

  // Fallback: service-role connector ophalen (shared connector van de builder)
  try {
    const conn = await base44.asServiceRole.connectors.getConnection("share_point");
    if (conn?.accessToken) return conn.accessToken;
  } catch { /* geen shared connector */ }

  return null;
}

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

    // Extraheer bestandsnaam uit de URL
    let fileName = '';
    try {
      const url = new URL(video_url);
      const parts = decodeURIComponent(url.pathname).split('/');
      fileName = parts[parts.length - 1];
    } catch {
      return Response.json({ error: 'Ongeldige video_url' }, { status: 400 });
    }

    const accessToken = await getAccessToken(base44);
    if (!accessToken) {
      return Response.json({ error: 'Geen SharePoint verbinding beschikbaar. Verbind uw account via Beheer.' }, { status: 403 });
    }

    // Site + Drive ophalen
    const siteRes = await fetch(
      `https://graph.microsoft.com/v1.0/sites/abvandbynd.sharepoint.com:/`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const site = await siteRes.json();
    if (!site.id) return Response.json({ error: 'Site niet gevonden', detail: site }, { status: 500 });

    const driveRes = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${site.id}/drive`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const drive = await driveRes.json();
    if (!drive.id) return Response.json({ error: 'Drive niet gevonden', detail: drive }, { status: 500 });

    const FOLDER_PATH = "APP INSTRUCTION VIDEO'S";
    const graphUrl = `https://graph.microsoft.com/v1.0/drives/${drive.id}/root:/${FOLDER_PATH}/${encodeURIComponent(fileName)}`;
    const itemRes = await fetch(graphUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    const item = await itemRes.json();

    const tempUrl = item['@microsoft.graph.downloadUrl'];
    if (!tempUrl) {
      return Response.json({ error: 'Bestand niet gevonden', file: fileName }, { status: 404 });
    }

    return Response.json({ download_url: tempUrl });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});