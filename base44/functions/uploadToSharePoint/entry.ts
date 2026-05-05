import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CONNECTOR_ID = "69f08e6060f2243cb70a95b4";
// ProcessEngineering site > Shared Documents > Hub > Instructies > APP video's
const DRIVE_ID = "b!GXYkUdJgSEWtjvc55y8BpegEdUyAk3ZOs0v9NCiwitVlnP9RkxrtToxklc16InGC";
const FOLDER_PATH = "Hub/Instructies/APP video's";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';
    let file;
    if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      file = formData.get('file');
      if (!file) {
        for (const [, val] of formData.entries()) {
          if (val instanceof File) { file = val; break; }
        }
      }
    } else {
      return Response.json({ error: 'Verwacht multipart/form-data' }, { status: 400 });
    }
    if (!file) {
      return Response.json({ error: 'Geen bestand ontvangen' }, { status: 400 });
    }

    const fileName = file.name || `video_${Date.now()}.mp4`;
    const fileBuffer = await file.arrayBuffer();

    // Upload naar Base44 voor snelle playback (geen auth nodig)
    const base44Result = await base44.asServiceRole.integrations.Core.UploadFile({ file });
    const responseUrl = base44Result.file_url;

    // Stuur direct de URL terug — SharePoint sync loopt op de achtergrond verder
    const sharepointSync = async () => {
      try {
        const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);
        const sessionRes = await fetch(
          `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root:/${FOLDER_PATH}/${encodeURIComponent(fileName)}:/createUploadSession`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ item: { "@microsoft.graph.conflictBehavior": "rename" } })
          }
        );
        const sessionData = await sessionRes.json();
        if (sessionData.uploadUrl) {
          await fetch(sessionData.uploadUrl, {
            method: 'PUT',
            headers: {
              'Content-Range': `bytes 0-${fileBuffer.byteLength - 1}/${fileBuffer.byteLength}`,
              'Content-Length': fileBuffer.byteLength.toString(),
            },
            body: fileBuffer,
          });
        }
      } catch (_) {
        // SharePoint sync is optioneel, fouten negeren
      }
    };

    // Start SharePoint sync zonder te wachten
    sharepointSync();

    return Response.json({ file_url: responseUrl, file_name: fileName });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});