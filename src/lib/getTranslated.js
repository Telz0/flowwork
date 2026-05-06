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
 * Falls back to the original field if the translation contains raw HTML tags as text
 * (which means the LLM translation stripped the HTML formatting).
 */
export const getTranslated = (item, fieldName, language = 'nl') => {
  if (!item) return '';
  
  const langField = `${fieldName}_${language}`;
  const nlField = `${fieldName}_nl`;
  const originalField = item[fieldName];

  const pick = (val) => {
    // If the original is HTML but this value is also HTML (properly), use it.
    // If the original is HTML but this value is plain text (LLM stripped tags), fall back to original.
    if (isHtml(originalField) && !isHtml(val)) return originalField;
    return val;
  };

  if (item[langField]) return pick(item[langField]);
  if (item[nlField]) return pick(item[nlField]);
  if (originalField) return originalField;
  
  return '';
};