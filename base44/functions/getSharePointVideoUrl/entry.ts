import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CONNECTOR_ID = "69f08e6060f2243cb70a95b4";

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
    let fileName = '';
    try {
      const url = new URL(video_url);
      const parts = decodeURIComponent(url.pathname).split('/');
      fileName = parts[parts.length - 1];
    } catch {
      return Response.json({ error: 'Ongeldige video_url' }, { status: 400 });
    }

    // Probeer connector van huidige gebruiker, anders van een admin
    let accessToken = null;
    try {
      const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);
      accessToken = conn.accessToken;
    } catch {
      // Huidige gebruiker heeft geen connector — gebruik admin's connector
      // Zoek een admin met een actieve connectie
      const adminIds = [
        '69f08744cf810ff9c68b76fd', // trochgilian@gmail.com
        '69f0923dcc6b2c73b1547119', // gilian@abnd.com
      ];
      for (const adminId of adminIds) {
        try {
          const adminConn = await base44.asServiceRole.connectors.getAppUserConnectionByUserId(CONNECTOR_ID, adminId);
          accessToken = adminConn.accessToken;
          break;
        } catch {
          // probeer volgende
        }
      }
    }

    if (!accessToken) {
      return Response.json({ error: 'Geen SharePoint verbinding beschikbaar' }, { status: 403 });
    }

    // Site + Drive ophalen
    const siteRes = await fetch(
      `https://graph.microsoft.com/v1.0/sites/abvandbynd.sharepoint.com:/`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const site = await siteRes.json();
    if (!site.id) return Response.json({ error: 'Site niet gevonden' }, { status: 500 });

    const driveRes = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${site.id}/drive`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const drive = await driveRes.json();
    if (!drive.id) return Response.json({ error: 'Drive niet gevonden' }, { status: 500 });

    const FOLDER_PATH = "APP INSTRUCTION VIDEO'S";
    const graphUrl = `https://graph.microsoft.com/v1.0/drives/${drive.id}/root:/${FOLDER_PATH}/${encodeURIComponent(fileName)}`;
    const itemRes = await fetch(graphUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    const item = await itemRes.json();

    const tempUrl = item['@microsoft.graph.downloadUrl'];
    if (!tempUrl) {
      return Response.json({ error: 'Bestand niet gevonden', file: fileName }, { status: 404 });
    }

    // Haal de content URL op via een GET request met redirect follow
    // Dit geeft ons de echte CDN URL zonder tempauth
    const probeRes = await fetch(tempUrl, {
      method: 'GET',
      redirect: 'manual',
      headers: { Range: 'bytes=0-0' }
    });

    // Als we een redirect krijgen, gebruik die URL
    if (probeRes.status === 301 || probeRes.status === 302 || probeRes.status === 307 || probeRes.status === 308) {
      const location = probeRes.headers.get('location');
      if (location) {
        return Response.json({ download_url: location });
      }
    }

    // Anders: tempauth URL teruggeven (werkt op desktop, soms niet op Android)
    return Response.json({ download_url: tempUrl });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});