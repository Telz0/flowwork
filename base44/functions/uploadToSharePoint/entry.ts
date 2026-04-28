import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CONNECTOR_ID = "69f08e6060f2243cb70a95b4";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let file, folder;
    try {
      const formData = await req.formData();
      file = formData.get('file');
      folder = formData.get('folder') || 'Werkinstructies';
    } catch {
      return Response.json({ error: 'Ongeldige form data' }, { status: 400 });
    }

    if (!file) {
      return Response.json({ error: 'Geen bestand ontvangen' }, { status: 400 });
    }

    const { accessToken, connectionConfig } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);
    const sitePath = connectionConfig?.subdomain ?? "";

    // Get tenant from Graph API
    const rootRes = await fetch('https://graph.microsoft.com/v1.0/sites/root', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const rootData = await rootRes.json();
    const hostname = rootData.siteCollection?.hostname;
    if (!hostname) {
      return Response.json({ error: 'Kan SharePoint tenant niet ophalen', details: rootData }, { status: 500 });
    }

    const fileName = file.name || `video_${Date.now()}.mp4`;
    const fileBuffer = await file.arrayBuffer();

    // Upload via SharePoint REST API
    const uploadUrl = `https://${hostname}/${sitePath}/_api/web/GetFolderByServerRelativeUrl('${folder}')/Files/add(url='${encodeURIComponent(fileName)}',overwrite=true)`;

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json;odata=verbose',
        'Content-Length': fileBuffer.byteLength.toString(),
      },
      body: fileBuffer,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      return Response.json({ error: 'Upload mislukt', details: errText }, { status: 500 });
    }

    const result = await uploadRes.json();
    const serverRelativeUrl = result?.d?.ServerRelativeUrl;
    const fileUrl = `https://${hostname}${serverRelativeUrl}`;

    return Response.json({ file_url: fileUrl, file_name: fileName });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});