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

    // Get all sites the user has access to
    const sitesRes = await fetch('https://graph.microsoft.com/v1.0/sites?search=*', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const sitesData = await sitesRes.json();
    const sites = sitesData.value || [];

    // Try each site to find drives with folders
    let allFolders = [];
    let usedDriveId = null;

    for (const site of sites) {
      const drivesRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${site.id}/drives`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const drivesData = await drivesRes.json();
      const drives = drivesData.value || [];

      for (const drive of drives) {
        const foldersRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${drive.id}/root/children`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const foldersData = await foldersRes.json();
        const folders = (foldersData.value || []).filter(item => item.folder);

        if (folders.length > 0) {
          allFolders = folders.map(item => ({ id: item.id, name: item.name, path: item.name, driveId: drive.id, siteId: site.id }));
          usedDriveId = drive.id;
          break;
        }
      }
      if (allFolders.length > 0) break;
    }

    // Fallback: try root site
    if (allFolders.length === 0) {
      const rootRes = await fetch('https://graph.microsoft.com/v1.0/sites/root/drives', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const rootDrives = await rootRes.json();
      const drive = (rootDrives.value || [])[0];
      if (drive) {
        const foldersRes = await fetch(`https://graph.microsoft.com/v1.0/drives/${drive.id}/root/children`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const foldersData = await foldersRes.json();
        allFolders = (foldersData.value || [])
          .filter(item => item.folder)
          .map(item => ({ id: item.id, name: item.name, path: item.name, driveId: drive.id }));
        usedDriveId = drive.id;
      }
    }

    return Response.json({ folders: allFolders, driveId: usedDriveId, sitesFound: sites.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});