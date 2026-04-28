export const translations = {
  nl: {
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
  },
  fr: {
    categories: 'Catégories',
    products: 'Produits',
    steps: 'Étapes',
    backToCategories: 'Retour aux catégories',
    backToProducts: 'Retour aux produits',
    backToSteps: 'Retour aux étapes',
    noProducts: 'Aucun produit trouvé',
    noSteps: 'Pas d\'étapes pour le moment',
    step: 'Étape',
    of: 'sur',
    video: 'Vidéo',
    tips: 'Conseils',
    qcChecks: 'Points de contrôle QC',
    qcSummary: 'Résumé QC',
    previousStep: 'Étape précédente',
    nextStep: 'Étape suivante',
    duration: 'Durée',
    noVideoAvailable: 'Aucune vidéo disponible',
    addStep: 'Ajouter une étape',
    editStep: 'Modifier l\'étape',
    save: 'Enregistrer',
    delete: 'Supprimer',
    cancel: 'Annuler',
    language: 'Langue',
    search: 'Rechercher...',
  },
  en: {
    categories: 'Categories',
    products: 'Products',
    steps: 'Steps',
    backToCategories: 'Back to categories',
    backToProducts: 'Back to products',
    backToSteps: 'Back to steps',
    noProducts: 'No products found',
    noSteps: 'No steps yet',
    step: 'Step',
    of: 'of',
    video: 'Video',
    tips: 'Tips',
    qcChecks: 'QC Check Points',
    qcSummary: 'QC Summary',
    previousStep: 'Previous step',
    nextStep: 'Next step',
    duration: 'Duration',
    noVideoAvailable: 'No video available',
    addStep: 'Add step',
    editStep: 'Edit step',
    save: 'Save',
    delete: 'Delete',
    cancel: 'Cancel',
    language: 'Language',
    search: 'Search...',
  },
};

export const t = (key, language) => {
  // Return Dutch translation first if available, fallback to key
  const translation = translations[language]?.[key];
  if (translation) return translation;
  
  // Fallback to Dutch if translation missing
  return translations.nl[key] || key;
};

export const autoTranslate = async (text, targetLanguage) => {
  try {
    const { base44 } = await import('@/api/base44Client');
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Translate the following text from Dutch to ${targetLanguage === 'en' ? 'English' : 'French'}. Return ONLY the translation, nothing else:\n\n"${text}"`,
      model: 'gemini_3_flash'
    });
    return response;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
};