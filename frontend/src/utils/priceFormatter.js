/**
 * Formats a number or string representing a price using the Indian numbering system (en-IN).
 * Keeps decimals if the number is not an integer, formatting it to 2 decimal places.
 * 
 * @param {number|string} price - The price value to format
 * @returns {string} The formatted price string (without the currency symbol)
 */
export const formatPrice = (price) => {
  if (price === undefined || price === null || price === '') return '0';
  const num = Number(price);
  if (isNaN(num)) return String(price);

  if (Number.isInteger(num)) {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(num);
  }
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
};
