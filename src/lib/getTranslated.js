/**
 * Get the translated value for a field based on language
 * @param {Object} item - The entity object
 * @param {string} fieldName - The base field name (e.g., 'title', 'name', 'description')
 * @param {string} language - The language code ('nl', 'fr', 'en')
 * @returns {string} The translated value or fallback to Dutch or original field
 */
/**
 * Get the translated value for a field based on language.
 * Falls back to Dutch, then to the original field.
 */
export const getTranslated = (item, fieldName, language = 'nl') => {
  if (!item) return '';
  
  const langField = `${fieldName}_${language}`;
  const nlField = `${fieldName}_nl`;
  const originalField = item[fieldName];

  if (item[langField]) return item[langField];
  if (item[nlField]) return item[nlField];
  if (originalField) return originalField;
  
  return '';
};