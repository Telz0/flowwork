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
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    // Support both: direct call and entity automation payload
    const entity_name = body.entity_name || body.event?.entity_name || body.function_args?.entity_name;
    const entity_id = body.entity_id || body.event?.entity_id;
    let data = body.data;
    
    if (!entity_name || !entity_id) {
      return Response.json({ error: 'Missing entity_name or entity_id' }, { status: 400 });
    }
    if (!data) {
      // Fetch the entity data ourselves if not provided (e.g. when payload_too_large)
      data = await base44.asServiceRole.entities[entity_name].get(entity_id);
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
    let sourceLanguage = 'nl';
    let textToTranslate = {};
    
    fields.forEach(field => {
      const value = data?.[field] || data?.[`${field}_nl`];
      if (value && typeof value === 'string') {
        if (!sourceLanguage || sourceLanguage === 'nl') {
          sourceLanguage = detectLanguage(value);
        }
        textToTranslate[field] = value;
      }
    });

    if (Object.keys(textToTranslate).length === 0) {
      return Response.json({ success: true, message: 'No text to translate' });
    }

    // Return immediately - translation happens async in background
    setTimeout(async () => {
      try {
        // Prepare text for translation
        const textStr = Object.entries(textToTranslate)
          .map(([k, v]) => `[${k}]: ${v}`)
          .join('\n\n');

        // Use LLM to translate
        const translationPrompt = `You are a professional translator. Detect the language of the following text and translate it to Dutch, French, and English.

SOURCE TEXT (detected language: ${sourceLanguage}):
${textStr}

Return a JSON object with this exact structure:
{
  "detected_language": "nl|fr|en",
  "translations": {
    "field_name": {
      "nl": "Dutch translation",
      "fr": "French translation", 
      "en": "English translation"
    }
  }
}

IMPORTANT:
- If source is Dutch: translate to French and English (keep Dutch as-is)
- If source is French: translate to Dutch and English (keep French as-is)
- If source is English: translate to Dutch and French (keep English as-is)
- Keep technical terms consistent
- Maintain tone and context
- Return ONLY valid JSON, no markdown or explanation`;

        const llmResponse = await base44.integrations.Core.InvokeLLM({
          prompt: translationPrompt,
          response_json_schema: {
            type: 'object',
            properties: {
              detected_language: { type: 'string' },
              translations: { type: 'object' }
            }
          }
        });

        // Prepare update data
        const updateData = {};
        Object.entries(llmResponse.translations || {}).forEach(([field, translations]) => {
          ['nl', 'fr', 'en'].forEach(lang => {
            updateData[`${field}_${lang}`] = translations[lang];
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