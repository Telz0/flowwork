import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const detectLanguage = (text) => {
  if (!text) return 'nl';
  const nlWords = ['de', 'het', 'een', 'en', 'dat', 'van', 'in', 'is', 'te', 'voor', 'met', 'op'];
  const frWords = ['le', 'la', 'les', 'de', 'un', 'une', 'et', 'que', 'qui', 'est', 'dans', 'pour'];
  const enWords = ['the', 'a', 'and', 'of', 'to', 'in', 'is', 'for', 'that', 'with', 'be', 'have'];
  const words = text.toLowerCase().split(/\s+/).slice(0, 20);
  let nl = 0, fr = 0, en = 0;
  words.forEach(w => {
    w = w.replace(/[^a-z]/g, '');
    if (nlWords.includes(w)) nl++;
    if (frWords.includes(w)) fr++;
    if (enWords.includes(w)) en++;
  });
  if (fr > nl && fr > en) return 'fr';
  if (en > nl && en > fr) return 'en';
  return 'nl';
};

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

    const fieldsToTranslate = {
      Category: ['name', 'description'],
      Product: ['name', 'description'],
      ProductionStep: ['title', 'description', 'tips']
    };

    const fields = fieldsToTranslate[entity_type];
    if (!fields) {
      return Response.json({ error: `Unknown entity type: ${entity_type}` }, { status: 400 });
    }

    const entities = await base44.asServiceRole.entities[entity_type].list('created_date', 1000);
    let updated = 0;
    let skipped = 0;

    for (const entity of entities) {
      try {
        // Bepaal welke velden + talen echt ontbreken
        let textToTranslate = {};
        let sourceLanguage = 'nl';

        fields.forEach(field => {
          const sourceValue = entity[field] || entity[`${field}_nl`];
          if (!sourceValue || typeof sourceValue !== 'string') return;

          const missingLangs = ['nl', 'fr', 'en'].filter(lang => !entity[`${field}_${lang}`]);
          if (missingLangs.length === 0) return; // Alle 3 talen al aanwezig → overslaan

          sourceLanguage = detectLanguage(sourceValue);
          textToTranslate[field] = { value: sourceValue, missingLangs };
        });

        if (Object.keys(textToTranslate).length === 0) {
          skipped++;
          continue; // Niets te vertalen voor dit record
        }

        const textStr = Object.entries(textToTranslate)
          .map(([k, { value, missingLangs }]) => `[${k}] (vertaal naar: ${missingLangs.join(', ')}): ${value}`)
          .join('\n\n');

        const llmResponse = await base44.integrations.Core.InvokeLLM({
          prompt: `Je bent een professionele vertaler. Vertaal de volgende tekst ALLEEN naar de aangegeven talen.

BRONTEKST (taal: ${sourceLanguage}):
${textStr}

Geef een JSON object terug met deze structuur:
{
  "translations": {
    "veldnaam": { "nl": "...", "fr": "...", "en": "..." }
  }
}

BELANGRIJK:
- Vul alleen de talen in die na "vertaal naar:" staan
- Geef ALLEEN geldige JSON terug, geen uitleg`,
          response_json_schema: {
            type: 'object',
            properties: {
              translations: { type: 'object' }
            }
          }
        });

        const updateData = {};
        Object.entries(llmResponse.translations || {}).forEach(([field, translations]) => {
          const missingLangs = textToTranslate[field]?.missingLangs || [];
          missingLangs.forEach(lang => {
            if (translations[lang]) updateData[`${field}_${lang}`] = translations[lang];
          });
        });

        if (Object.keys(updateData).length > 0) {
          await base44.asServiceRole.entities[entity_type].update(entity.id, updateData);
          updated++;
        } else {
          skipped++;
        }

        // Kleine vertraging om rate limiting te vermijden
        await new Promise(r => setTimeout(r, 500));
      } catch (error) {
        console.error(`Error translating ${entity.id}:`, error.message);
        skipped++;
      }
    }

    return Response.json({ success: true, entity_type, updated, skipped, total: entities.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});