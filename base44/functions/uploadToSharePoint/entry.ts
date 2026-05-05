import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CONNECTOR_ID = "69f08e6060f2243cb70a95b4";
const SITE_URL = "abvandbynd.sharepoint.com";
const FOLDER_PATH = "APP INSTRUCTION VIDEO'S";
const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks

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

    // Haal de bestandsgrootte op via HEAD request
    const headRes = await fetch(file_url, { method: 'HEAD' });
    const contentLength = parseInt(headRes.headers.get('content-length') || '0');

    // Maak een upload sessie aan in SharePoint
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

    const uploadUrl = sessionData.uploadUrl;

    // Download het bestand als stream en upload in chunks naar SharePoint
    const fileRes = await fetch(file_url);
    if (!fileRes.ok || !fileRes.body) {
      return Response.json({ error: 'Kon bestand niet downloaden' }, { status: 500 });
    }

    const reader = fileRes.body.getReader();
    let offset = 0;
    let buffer = new Uint8Array(0);
    let finalUrl = null;

    while (true) {
      const { done, value } = await reader.read();

      if (value) {
        // Voeg chunk toe aan buffer
        const newBuffer = new Uint8Array(buffer.length + value.length);
        newBuffer.set(buffer);
        newBuffer.set(value, buffer.length);
        buffer = newBuffer;
      }

      // Upload zodra buffer groot genoeg is, of als het de laatste chunk is
      while (buffer.length >= CHUNK_SIZE || (done && buffer.length > 0)) {
        const chunkSize = done ? buffer.length : Math.min(CHUNK_SIZE, buffer.length);
        const chunk = buffer.slice(0, chunkSize);
        buffer = buffer.slice(chunkSize);

        const totalSize = contentLength || (offset + chunk.length + (done ? 0 : 1));
        const isLast = done && buffer.length === 0;
        const end = offset + chunk.length - 1;
        const total = isLast ? (offset + chunk.length) : '*';

        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Range': `bytes ${offset}-${end}/${total}`,
            'Content-Length': chunk.length.toString(),
          },
          body: chunk,
        });

        if (uploadRes.status === 200 || uploadRes.status === 201) {
          const data = await uploadRes.json();
          finalUrl = data.webUrl;
        } else if (uploadRes.status !== 202) {
          const errData = await uploadRes.json().catch(() => ({}));
          return Response.json({ error: 'Upload chunk mislukt', status: uploadRes.status, detail: errData }, { status: 500 });
        }

        offset += chunk.length;

        if (buffer.length < CHUNK_SIZE && !done) break;
      }

      if (done) break;
    }

    if (!finalUrl) {
      return Response.json({ error: 'Upload voltooid maar geen URL ontvangen' }, { status: 500 });
    }

    return Response.json({ file_url: finalUrl, file_name: fileName });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});