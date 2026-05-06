import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CONNECTOR_ID = "69f08e6060f2243cb70a95b4";
const SITE_URL = "abvandbynd.sharepoint.com";

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

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);

    // Haal site ID en drive op
    const [siteRes, ] = await Promise.all([
      fetch(`https://graph.microsoft.com/v1.0/sites/${SITE_URL}:/`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
    ]);
    const siteData = await siteRes.json();
    if (!siteData.id) {
      return Response.json({ error: 'Site niet gevonden' }, { status: 500 });
    }

    const driveRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteData.id}/drive`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const drive = await driveRes.json();
    if (!drive.id) {
      return Response.json({ error: 'Drive niet gevonden' }, { status: 500 });
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

    const FOLDER_PATH = "APP INSTRUCTION VIDEO'S";

    // Zoek het bestand via Graph in de bekende map
    const graphUrl = `https://graph.microsoft.com/v1.0/drives/${drive.id}/root:/${FOLDER_PATH}/${encodeURIComponent(fileName)}`;
    const itemRes = await fetch(graphUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    const item = await itemRes.json();

    if (!item['@microsoft.graph.downloadUrl']) {
      return Response.json({ error: 'Geen download URL beschikbaar', detail: item }, { status: 500 });
    }

    return Response.json({ download_url: item['@microsoft.graph.downloadUrl'] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});