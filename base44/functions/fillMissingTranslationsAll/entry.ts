import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { entity_type } = await req.json();
    
    if (!entity_type) {
      return Response.json({ error: 'Missing entity_type (Category, Product, or ProductionStep)' }, { status: 400 });
    }

    const entities = await base44.asServiceRole.entities[entity_type].list('created_date', 1000);
    let updated = 0;
    let skipped = 0;

    for (const entity of entities) {
      try {
        // Check if already has translation fields filled
        const hasTranslations = 
          entity.name_nl || entity.name_fr || entity.name_en ||
          entity.title_nl || entity.title_fr || entity.title_en ||
          entity.description_nl || entity.description_fr || entity.description_en;

        if (hasTranslations) {
          skipped++;
          continue;
        }

        // Trigger translation via autoTranslateEntity function
        await base44.functions.invoke('autoTranslateEntity', {
          entity_name: entity_type,
          entity_id: entity.id,
          data: entity,
          old_data: null
        });

        updated++;
        
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));
      } catch (error) {
        console.error(`Error translating ${entity.id}:`, error.message);
        skipped++;
      }
    }

    return Response.json({ 
      success: true,
      entity_type,
      updated,
      skipped,
      total: entities.length
    });

  } catch (error) {
    console.error('Fill translations error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});