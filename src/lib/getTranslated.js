/**
 * Get the translated value for a field based on language
 * @param {Object} item - The entity object
 * @param {string} fieldName - The base field name (e.g., 'title', 'name', 'description')
 * @param {string} language - The language code ('nl', 'fr', 'en')
 * @returns {string} The translated value or fallback to Dutch or original field
 */
const isHtml = (str) => str && /<[a-z][\s\S]*>/i.test(str);

/**
 * Get the translated value for a field based on language.
 * If the original is HTML but the translation is plain text, wrap it in a <p> tag
 * so it still renders correctly via dangerouslySetInnerHTML.
 */
export const getTranslated = (item, fieldName, language = 'nl') => {
  if (!item) return '';
  
  const langField = `${fieldName}_${language}`;
  const nlField = `${fieldName}_nl`;
  const originalField = item[fieldName];

  const normalize = (val) => {
    if (!val) return val;
    // If original is HTML but translation is plain text, wrap in <p> so HTML rendering works
    if (isHtml(originalField) && !isHtml(val)) {
      return `<p>${val}</p>`;
    }
    return val;
  };

  if (item[langField]) return normalize(item[langField]);
  if (item[nlField]) return normalize(item[nlField]);
  if (originalField) return originalField;
  
  return '';
};