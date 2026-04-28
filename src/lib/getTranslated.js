/**
 * Get the translated value for a field based on language
 * @param {Object} item - The entity object
 * @param {string} fieldName - The base field name (e.g., 'title', 'name', 'description')
 * @param {string} language - The language code ('nl', 'fr', 'en')
 * @returns {string} The translated value or fallback to Dutch or original field
 */
export const getTranslated = (item, fieldName, language = 'nl') => {
  if (!item) return '';
  
  // Try language-specific field first
  const langField = `${fieldName}_${language}`;
  if (item[langField]) return item[langField];
  
  // Fallback to Dutch
  const nlField = `${fieldName}_nl`;
  if (item[nlField]) return item[nlField];
  
  // Fallback to generic field (for backward compatibility)
  if (item[fieldName]) return item[fieldName];
  
  return '';
};