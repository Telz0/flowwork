/**
 * Get the translated value for a field based on language
 * @param {Object} item - The entity object
 * @param {string} fieldName - The base field name (e.g., 'title', 'name', 'description')
 * @param {string} language - The language code ('nl', 'fr', 'en')
 * @returns {string} The translated value or fallback to Dutch or original field
 */
const isHtml = (str) => str && /<[a-z][\s\S]*>/i.test(str);

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
  const originalField = item[fieldName];

  // Priority 1: requested language — but if original has HTML and this doesn't, fall through
  if (item[langField]) {
    if (!isHtml(item[langField]) && isHtml(originalField)) {
      // Translation lost HTML formatting — use original instead
      return originalField;
    }
    return item[langField];
  }
  
  // Priority 2: Dutch fallback
  if (item[nlField]) {
    if (!isHtml(item[nlField]) && isHtml(originalField)) {
      return originalField;
    }
    return item[nlField];
  }
  
  // Priority 3: legacy field (translation not yet done)
  if (originalField) return originalField;
  
  return '';
};