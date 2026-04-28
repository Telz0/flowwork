import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Detect language using simple heuristics
const detectLanguage = (text) => {
  if (!text) return 'nl';
  
  const nlWords = ['de', 'het', 'een', 'en', 'dat', 'van', 'in', 'is', 'te', 'voor', 'met', 'op', 'naar', 'hij', 'ze', 'wat', 'hoe', 'wie', 'waar', 'wanneer', 'waarom'];
  const frWords = ['le', 'la', 'les', 'de', 'un', 'une', 'et', 'que', 'qui', 'est', 'dans', 'pour', 'avec', 'par', 'ce', 'en', 'il', 'elle', 'se', 'du', 'des'];
  const enWords = ['the', 'a', 'and', 'of', 'to', 'in', 'is', 'for', 'that', 'with', 'be', 'have', 'on', 'at', 'by', 'this', 'or', 'from', 'as', 'it'];
  
  const words = text.toLowerCase().split(/\s+/).slice(0, 20);
  let nlCount = 0, frCount = 0, enCount = 0;
  
  words.forEach(word => {
    word = word.replace(/[^a-z]/g, '');
    if (nlWords.includes(word)) nlCount++;
    if (frWords.includes(word)) frCount++;
    if (enWords.includes(word)) enCount++;
  });
  
  if (frCount > nlCount && frCount > enCount) return 'fr';
  if (enCount > nlCount && enCount > frCount) return 'en';
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

    // Fields to translate per entity type
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
        // Check if already has translation fields filled
        const hasTranslations = fields.some(f => entity[`${f}_nl`] || entity[`${f}_fr`] || entity[`${f}_en`]);

        if (hasTranslations) {
          skipped++;
          continue;
        }

        // Detect source language and gather text to translate
        let sourceLanguage = 'nl';
        let textToTranslate = {};
        
        fields.forEach(field => {
          const value = entity[field];
          if (value && typeof value === 'string') {
            if (!sourceLanguage || sourceLanguage === 'nl') {
              sourceLanguage = detectLanguage(value);
            }
            textToTranslate[field] = value;
          }
        });

        if (Object.keys(textToTranslate).length === 0) {
          skipped++;
          continue;
        }

        // Prepare text for translation
        const textStr = Object.entries(textToTranslate)
          .map(([k, v]) => `[${k}]: ${v}`)
          .join('\n\n');

        // Use LLM to translate
        const translationPrompt = `Translate the following text to Dutch, French, and English. Return a JSON object mapping field names to their translations in all three languages.

SOURCE TEXT (language: ${sourceLanguage}):
${textStr}

Return ONLY this JSON structure (no markdown, no explanation):
{
  "name": {
    "nl": "Dutch name",
    "fr": "French name",
    "en": "English name"
  },
  "title": {
    "nl": "Dutch title",
    "fr": "French title",
    "en": "English title"
  },
  "description": {
    "nl": "Dutch description",
    "fr": "French description",
    "en": "English description"
  },
  "tips": {
    "nl": "Dutch tips",
    "fr": "French tips",
    "en": "English tips"
  }
}

RULES:
- Only include fields that were in SOURCE TEXT
- If source is Dutch: provide nl as-is, translate to fr and en
- If source is French: provide fr as-is, translate to nl and en
- If source is English: provide en as-is, translate to nl and fr
- Keep all translations at the same technical level
- Return ONLY the JSON object`;

        const llmResponse = await base44.integrations.Core.InvokeLLM({
          prompt: translationPrompt,
          response_json_schema: {
            type: 'object',
            properties: {
              name: { type: 'object' },
              title: { type: 'object' },
              description: { type: 'object' },
              tips: { type: 'object' }
            }
          }
        });

        // Prepare update data - flatten to field_lang format
        const updateData = {};
        Object.entries(llmResponse).forEach(([field, langObj]) => {
          if (langObj && typeof langObj === 'object') {
            ['nl', 'fr', 'en'].forEach(lang => {
              if (langObj[lang]) {
                updateData[`${field}_${lang}`] = langObj[lang];
              }
            });
          }
        });

        // Update entity with translations
        await base44.asServiceRole.entities[entity_type].update(entity.id, updateData);

        updated++;
        
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 1000));
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