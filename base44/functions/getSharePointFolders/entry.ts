import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CONNECTOR_ID = "69f08e6060f2243cb70a95b4";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);

    // Get root site info
    const rootRes = await fetch('https://graph.microsoft.com/v1.0/sites/root', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const rootData = await rootRes.json();
    const siteId = rootData.id;

    if (!siteId) {
      return Response.json({ error: 'Kan SharePoint site niet ophalen', details: rootData }, { status: 500 });
    }

    // Get default document library drive
    const drivesRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/drives`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const drivesData = await drivesRes.json();
    const drive = drivesData.value?.find(d => d.driveType === 'documentLibrary') || drivesData.value?.[0];

    if (!drive) {
      return Response.json({ error: 'Geen document library gevonden' }, { status: 500 });
    }

    // Get root folders
    const foldersRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${drive.id}/root/children`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const foldersData = await foldersRes.json();

    const folders = (foldersData.value || [])
      .filter(item => item.folder)
      .map(item => ({ id: item.id, name: item.name, path: item.name }));

    return Response.json({ folders, driveId: drive.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});