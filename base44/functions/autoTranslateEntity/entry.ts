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

    const body = await req.json();
    // Support both: direct call and entity automation payload
    const entity_name = body.entity_name || body.event?.entity_name || body.function_args?.entity_name;
    const entity_id = body.entity_id || body.event?.entity_id;
    let data = body.data;
    
    if (!entity_name || !entity_id) {
      return Response.json({ error: 'Missing entity_name or entity_id' }, { status: 400 });
    }
    if (!data) {
      const records = await base44.asServiceRole.entities[entity_name].filter({ id: entity_id });
      data = records?.[0];
      if (!data) return Response.json({ error: 'Could not fetch entity data' }, { status: 400 });
    }

    // Fields to translate (per entity type)
    const fieldsToTranslate = {
      Category: ['name', 'description'],
      Product: ['name', 'description'],
      ProductionStep: ['title', 'description', 'tips']
    };

    const fields = fieldsToTranslate[entity_name] || [];
    if (fields.length === 0) {
      return Response.json({ error: `Unknown entity type: ${entity_name}` }, { status: 400 });
    }

    // Detect source language and gather text to translate
    // Only translate fields that: have a source value AND have at least one missing translation
    let sourceLanguage = 'nl';
    let textToTranslate = {};
    const old_data = body.old_data || null;
    
    fields.forEach(field => {
      const value = data?.[field] || data?.[`${field}_nl`];
      if (!value || typeof value !== 'string') return;

      // Skip if nothing changed compared to old_data
      if (old_data) {
        const oldValue = old_data?.[field] || old_data?.[`${field}_nl`];
        if (oldValue === value) {
          // Check if all translations already exist - if so, skip
          const allTranslationsExist = ['nl', 'fr', 'en'].every(lang => data?.[`${field}_${lang}`]);
          if (allTranslationsExist) return;
        }
      }

      // Only translate if at least one language is missing
      const missingLangs = ['nl', 'fr', 'en'].filter(lang => !data?.[`${field}_${lang}`]);
      if (missingLangs.length === 0) return;

      if (sourceLanguage === 'nl') {
        sourceLanguage = detectLanguage(value);
      }
      textToTranslate[field] = { value, missingLangs };
    });

    if (Object.keys(textToTranslate).length === 0) {
      return Response.json({ success: true, message: 'No translations needed' });
    }

    // Return immediately - translation happens async in background
    setTimeout(async () => {
      try {
        // Small delay to ensure entity is fully written
        await new Promise(resolve => setTimeout(resolve, 200));
        // Prepare text for translation — only missing languages per field
        const textStr = Object.entries(textToTranslate)
          .map(([k, { value, missingLangs }]) => `[${k}] (translate to: ${missingLangs.join(', ')}): ${value}`)
          .join('\n\n');

        const missingLangsSummary = [...new Set(Object.values(textToTranslate).flatMap(t => t.missingLangs))];

        // Use LLM to translate only missing languages
        const translationPrompt = `You are a professional translator. Translate the following text ONLY into the specified target languages.

SOURCE TEXT (source language: ${sourceLanguage}):
${textStr}

Return a JSON object with this exact structure:
{
  "translations": {
    "field_name": {
      "nl": "Dutch translation",
      "fr": "French translation", 
      "en": "English translation"
    }
  }
}

IMPORTANT:
- Only provide translations for the languages listed after "translate to:" for each field
- Keep technical terms consistent
- Maintain tone and context
- Return ONLY valid JSON, no markdown or explanation`;

        const llmResponse = await base44.integrations.Core.InvokeLLM({
          prompt: translationPrompt,
          model: 'gpt_5_mini',
          response_json_schema: {
            type: 'object',
            properties: {
              translations: { type: 'object' }
            }
          }
        });

        // Prepare update data — only update missing translation fields
        const updateData = {};
        fields.forEach(field => {
          if (data[field] != null) updateData[field] = data[field];
        });
        Object.entries(llmResponse.translations || {}).forEach(([field, translations]) => {
          const missingLangs = textToTranslate[field]?.missingLangs || [];
          missingLangs.forEach(lang => {
            if (translations[lang]) updateData[`${field}_${lang}`] = translations[lang];
          });
        });

        // Update entity with translations
        await base44.asServiceRole.entities[entity_name].update(entity_id, updateData);
      } catch (err) {
        console.error('Background translation error:', err);
      }
    }, 100);

    return Response.json({ success: true, message: 'Entity created, translations pending' });

  } catch (error) {
    console.error('Translation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});