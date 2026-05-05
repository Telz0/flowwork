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
    const { file_url, file_name, file_size } = body;

    if (!file_url) {
      return Response.json({ error: 'Geen file_url ontvangen' }, { status: 400 });
    }

    const fileName = file_name || `video_${Date.now()}.mp4`;

    // Haal de bestandsgrootte op via HEAD (of gebruik meegegeven grootte)
    let totalSize = file_size || 0;
    if (!totalSize) {
      const authHeader = req.headers.get('Authorization') || '';
      const headRes = await fetch(file_url, {
        method: 'HEAD',
        headers: file_url.includes('base44.app') ? { Authorization: authHeader } : {}
      });
      totalSize = parseInt(headRes.headers.get('content-length') || '0');
    }

    if (!totalSize) {
      return Response.json({ error: 'Bestandsgrootte onbekend. Geef file_size mee.' }, { status: 400 });
    }

    // Haal SharePoint toegang op
    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);

    // Site ID ophalen
    const siteRes = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${SITE_URL}:/`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const siteData = await siteRes.json();
    if (!siteData.id) {
      return Response.json({ error: 'Site niet gevonden', detail: siteData }, { status: 500 });
    }

    // Drive ophalen
    const driveRes = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${siteData.id}/drive`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const drive = await driveRes.json();
    if (!drive.id) {
      return Response.json({ error: 'Drive niet gevonden', detail: drive }, { status: 500 });
    }

    // Als het bestand klein genoeg is (< 4MB), upload direct
    if (totalSize < 4 * 1024 * 1024) {
      const authHeader = req.headers.get('Authorization') || '';
      const fileRes = await fetch(file_url, {
        headers: file_url.includes('base44.app') ? { Authorization: authHeader } : {}
      });
      const fileBuffer = await fileRes.arrayBuffer();

      const simpleRes = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${drive.id}/root:/${FOLDER_PATH}/${encodeURIComponent(fileName)}:/content`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/octet-stream',
          },
          body: fileBuffer,
        }
      );
      const simpleData = await simpleRes.json();
      if (!simpleData.webUrl) {
        return Response.json({ error: 'Kleine upload mislukt', detail: simpleData }, { status: 500 });
      }
      return Response.json({ file_url: simpleData.webUrl, file_name: fileName });
    }

    // Upload sessie aanmaken voor grote bestanden
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

    // Download en upload in chunks via Range requests
    const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB
    let offset = 0;
    let finalUrl = null;
    const authHeader = req.headers.get('Authorization') || '';

    while (offset < totalSize) {
      const end = Math.min(offset + CHUNK_SIZE - 1, totalSize - 1);
      const chunkRes = await fetch(file_url, {
        headers: {
          'Range': `bytes=${offset}-${end}`,
          ...(file_url.includes('base44.app') ? { Authorization: authHeader } : {})
        }
      });

      if (!chunkRes.ok) {
        return Response.json({ error: `Kon chunk niet downloaden: HTTP ${chunkRes.status}` }, { status: 500 });
      }

      const chunkBuffer = await chunkRes.arrayBuffer();
      const actualSize = chunkBuffer.byteLength;
      const actualEnd = offset + actualSize - 1;

      const uploadRes = await fetch(sessionData.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Range': `bytes ${offset}-${actualEnd}/${totalSize}`,
          'Content-Length': actualSize.toString(),
        },
        body: chunkBuffer,
      });

      if (uploadRes.status === 200 || uploadRes.status === 201) {
        const data = await uploadRes.json();
        finalUrl = data.webUrl;
      } else if (uploadRes.status === 202) {
        // Chunk geaccepteerd, ga door
      } else {
        const errData = await uploadRes.json().catch(() => ({}));
        return Response.json({ error: 'Upload chunk mislukt', status: uploadRes.status, detail: errData }, { status: 500 });
      }

      offset += actualSize;
    }

    if (!finalUrl) {
      return Response.json({ error: 'Upload voltooid maar geen URL ontvangen' }, { status: 500 });
    }

    return Response.json({ file_url: finalUrl, file_name: fileName });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});