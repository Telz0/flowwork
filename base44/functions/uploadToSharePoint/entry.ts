import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CONNECTOR_ID = "69f08e6060f2243cb70a95b4";
const SITE_URL = "abvandbynd.sharepoint.com";
const FOLDER_PATH = "APP INSTRUCTION VIDEO'S";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { file_url, file_name } = body;

    if (!file_url) {
      return Response.json({ error: 'Geen file_url ontvangen' }, { status: 400 });
    }

    const fileName = file_name || `video_${Date.now()}.mp4`;

    // Download het bestand van de tijdelijke URL
    const fileRes = await fetch(file_url);
    if (!fileRes.ok) {
      return Response.json({ error: 'Kon bestand niet downloaden van tijdelijke URL' }, { status: 500 });
    }
    const fileBuffer = await fileRes.arrayBuffer();

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);

    // Haal de site ID op
    const siteRes = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${SITE_URL}:/`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const siteData = await siteRes.json();
    if (!siteData.id) {
      return Response.json({ error: 'Site niet gevonden', detail: siteData }, { status: 500 });
    }

    // Haal de standaard document library op
    const driveRes = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${siteData.id}/drive`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const drive = await driveRes.json();
    if (!drive.id) {
      return Response.json({ error: 'Drive niet gevonden', detail: drive }, { status: 500 });
    }

    // Maak een upload sessie aan
    const sessionRes = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${drive.id}/root:/${FOLDER_PATH}/${encodeURIComponent(fileName)}:/createUploadSession`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: { "@microsoft.graph.conflictBehavior": "rename" } })
      }
    );
    const sessionData = await sessionRes.json();
    if (!sessionData.uploadUrl) {
      return Response.json({ error: 'Kon geen upload sessie aanmaken', detail: sessionData }, { status: 500 });
    }

    // Upload het bestand in één keer
    const uploadRes = await fetch(sessionData.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Range': `bytes 0-${fileBuffer.byteLength - 1}/${fileBuffer.byteLength}`,
        'Content-Length': fileBuffer.byteLength.toString(),
      },
      body: fileBuffer,
    });
    const uploadData = await uploadRes.json();

    const fileUrl = uploadData.webUrl;
    if (!fileUrl) {
      return Response.json({ error: 'Upload geslaagd maar geen URL ontvangen', detail: uploadData }, { status: 500 });
    }

    return Response.json({ file_url: fileUrl, file_name: fileName });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});