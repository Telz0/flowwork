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
    const { video_url, debug_list_root } = body;

    const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);
    const { accessToken } = conn;

    // DEBUG: lijst de root van de drive
    if (debug_list_root) {
      const siteRes = await fetch(
        `https://graph.microsoft.com/v1.0/sites/abvandbynd.sharepoint.com:/`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const site = await siteRes.json();
      const driveRes = await fetch(
        `https://graph.microsoft.com/v1.0/sites/${site.id}/drive/root/children`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const items = await driveRes.json();
      return Response.json({ site_id: site.id, root_items: items.value?.map(i => ({ name: i.name, id: i.id, type: i.folder ? 'folder' : 'file' })) });
    }

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

    if (!item['@microsoft.graph.downloadUrl']) {
      return Response.json({ error: 'Bestand niet gevonden', folder_path: FOLDER_PATH, file: fileName, detail: item }, { status: 500 });
    }

    return Response.json({ download_url: item['@microsoft.graph.downloadUrl'] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});