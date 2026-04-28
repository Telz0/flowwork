import { base44 } from '@/api/base44Client';

const allKeys = [
  'categories', 'products', 'steps', 'backToCategories', 'backToProducts', 'backToSteps',
  'noProducts', 'noSteps', 'step', 'of', 'video', 'tips', 'qcChecks', 'qcSummary',
  'previousStep', 'nextStep', 'duration', 'noVideoAvailable', 'addStep', 'editStep',
  'save', 'delete', 'cancel', 'language', 'search'
];

const dutchTranslations = {
  categories: 'Categorieën',
  products: 'Producten',
  steps: 'Stappen',
  backToCategories: 'Terug naar categorieën',
  backToProducts: 'Terug naar producten',
  backToSteps: 'Terug naar stappen',
  noProducts: 'Geen producten gevonden',
  noSteps: 'Nog geen stappen',
  step: 'Stap',
  of: 'van',
  video: 'Video',
  tips: 'Tips',
  qcChecks: 'QC Controlepunten',
  qcSummary: 'QC Samenvatting',
  previousStep: 'Vorige stap',
  nextStep: 'Volgende stap',
  duration: 'Duur',
  noVideoAvailable: 'Geen video beschikbaar',
  addStep: 'Stap toevoegen',
  editStep: 'Stap bewerken',
  save: 'Opslaan',
  delete: 'Verwijderen',
  cancel: 'Annuleren',
  language: 'Taal',
  search: 'Zoeken...',
};

export const translateMissingKeys = async (currentTranslations, language) => {
  const languageNames = { en: 'English', fr: 'French' };
  const missing = allKeys.filter(key => !currentTranslations[language]?.[key]);
  
  if (missing.length === 0) return currentTranslations;

  const dutchTexts = missing.map(key => dutchTranslations[key]).join('\n');
  
  try {
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Translate the following Dutch phrases to ${languageNames[language]}. Return ONLY the translations in the same order, one per line, exactly as they appear:\n\n${dutchTexts}`,
      model: 'gemini_3_flash'
    });

    const translations = response.split('\n').map(t => t.trim()).filter(t => t);
    const result = { ...currentTranslations };
    
    missing.forEach((key, idx) => {
      if (translations[idx]) {
        result[language] = { ...result[language], [key]: translations[idx] };
      }
    });

    return result;
  } catch (error) {
    console.error('Auto-translation failed:', error);
    return currentTranslations;
  }
};