/**
 * Format a number as currency with ₹ symbol
 * @param {number|string} value - The value to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : (typeof value === 'number' ? value : 0);
  return isNaN(numValue) ? '₹0.00' : '₹' + numValue.toFixed(2);
};

/**
 * Format a date string to a readable format
 * @param {string} dateString - The date string to format
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

/**
 * Format a percentage value
 * @param {number} value - The percentage value to format
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value) => {
  if (value === null || value === undefined) return '0%';
  
  return `${parseFloat(value).toFixed(2)}%`;
};

/**
 * Format a number with commas
 * @param {number} value - The number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (value) => {
  if (value === null || value === undefined) return '0';
  
  return new Intl.NumberFormat('en-IN').format(value);
}; 