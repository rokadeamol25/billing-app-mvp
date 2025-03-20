/**
 * Format a date string or Date object to a human-readable format
 * @param {string|Date} date - The date to format
 * @returns {string} The formatted date string
 */
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short',
    year: 'numeric'
  }).format(d);
};

/**
 * Format a number as currency with Indian Rupee symbol
 * @param {number} amount - The amount to format
 * @returns {string} The formatted currency string
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0.00';
  }
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numAmount);
};

/**
 * Format a number with commas for thousands
 * @param {number} number - The number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (number) => {
  if (number === null || number === undefined) return '0';
  
  // Convert to number if string
  const num = typeof number === 'string' ? parseFloat(number) : number;
  
  // Format with Indian number system (lakhs, crores)
  return new Intl.NumberFormat('en-IN').format(num);
};

/**
 * Format a percentage value
 * @param {number|string} value - The value to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} - The formatted percentage
 */
export const formatPercentage = (value, decimals = 2) => {
  if (value === null || value === undefined || value === '') {
    return '0%';
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : (typeof value === 'number' ? value : 0);
  
  if (isNaN(numValue)) {
    return '0%';
  }
  
  return `${numValue.toFixed(decimals)}%`;
};