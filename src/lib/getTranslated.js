/**
 * Get the translated value for a field based on language
 * @param {Object} item - The entity object
 * @param {string} fieldName - The base field name (e.g., 'title', 'name', 'description')
 * @param {string} language - The language code ('nl', 'fr', 'en')
 * @returns {string} The translated value or fallback to Dutch or original field
 */
export const getTranslated = (item, fieldName, language = 'nl') => {
  if (!item) return '';
  
  // Priority 1: Check if language-specific fields exist with data
  const langField = `${fieldName}_${language}`;
  const nlField = `${fieldName}_nl`;
  const frField = `${fieldName}_fr`;
  const enField = `${fieldName}_en`;
  
  // If ANY language-specific field has data, use that system
  if (item[langField] || item[nlField] || item[frField] || item[enField]) {
    if (item[langField]) return item[langField];
    if (item[nlField]) return item[nlField]; // fallback to Dutch
    return '';
  }
  
  // Priority 2: Fallback to generic field (backward compatibility for old data)
  if (item[fieldName]) return item[fieldName];
  
  return '';
};