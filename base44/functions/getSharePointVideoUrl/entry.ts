import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CONNECTOR_ID = "69f08e6060f2243cb70a95b4";
// Publieke share-link van de "APP INSTRUCTION VIDEO'S" map (Anyone-link)
const FOLDER_SHARE_URL = "https://abvandbynd.sharepoint.com/:f:/g/IgBV9EWBCCTQQraIbH759eV0AfRrUlNWDJQFuuUFrNvHc1w?e=rPll2p";

// Encodeer share URL naar Graph sharing token
function encodeSharingUrl(url) {
  const base64 = btoa(url).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `u!${base64}`;
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

    // Extraheer bestandsnaam uit de opgeslagen SharePoint URL
    let fileName = '';
    try {
      const url = new URL(video_url);
      const parts = decodeURIComponent(url.pathname).split('/');
      fileName = parts[parts.length - 1];
    } catch {
      return Response.json({ error: 'Ongeldige video_url' }, { status: 400 });
    }

    // Probeer eerst via publieke share-link (geen authenticatie nodig)
    // De map staat op "Anyone - doesn't require sign-in"
    const sharingToken = encodeSharingUrl(FOLDER_SHARE_URL);
    const publicRes = await fetch(
      `https://graph.microsoft.com/v1.0/shares/${sharingToken}/driveItem:/children/${encodeURIComponent(fileName)}`,
      { headers: { Accept: 'application/json' } }
    );

    if (publicRes.ok) {
      const item = await publicRes.json();
      if (item['@microsoft.graph.downloadUrl']) {
        return Response.json({ download_url: item['@microsoft.graph.downloadUrl'] });
      }
    }

    // Fallback: probeer via de user-connector (voor wie verbonden is)
    let accessToken = null;
    try {
      const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);
      accessToken = conn.accessToken;
    } catch {
      // Geen verbinding beschikbaar
    }

    if (!accessToken) {
      return Response.json({ error: 'Video niet beschikbaar. Verbind je SharePoint account in Beheer.' }, { status: 403 });
    }

    const siteRes = await fetch(`https://graph.microsoft.com/v1.0/sites/abvandbynd.sharepoint.com:/`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const siteData = await siteRes.json();
    if (!siteData.id) return Response.json({ error: 'Site niet gevonden' }, { status: 500 });

    const driveRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteData.id}/drive`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const drive = await driveRes.json();
    if (!drive.id) return Response.json({ error: 'Drive niet gevonden' }, { status: 500 });

    const FOLDER_PATH = "APP INSTRUCTION VIDEO'S";
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