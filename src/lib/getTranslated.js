/**
 * Get the translated value for a field based on language
 * @param {Object} item - The entity object
 * @param {string} fieldName - The base field name (e.g., 'title', 'name', 'description')
 * @param {string} language - The language code ('nl', 'fr', 'en')
 * @returns {string} The translated value or fallback to Dutch or original field
 */
export const getTranslated = (item, fieldName, language = 'nl') => {
  if (!item) return '';
  
  const langField = `${fieldName}_${language}`;
  const nlField = `${fieldName}_nl`;
  
  // Priority 1: requested language
  if (item[langField]) return item[langField];
  
  // Priority 2: Dutch fallback
  if (item[nlField]) return item[nlField];
  
  // Priority 3: legacy field (translation not yet done)
  if (item[fieldName]) return item[fieldName];
  
  return '';
};