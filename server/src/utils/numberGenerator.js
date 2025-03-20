/**
 * Generate a unique invoice number
 * Format: INV-YYYYMMDD-XXXX (where XXXX is a sequential number)
 * @param {Object} db - Database connection
 * @returns {Promise<string>} - Generated invoice number
 */
async function generateInvoiceNumber(db) {
  const today = new Date();
  const dateStr = today.getFullYear().toString() +
    (today.getMonth() + 1).toString().padStart(2, '0') +
    today.getDate().toString().padStart(2, '0');
  
  const prefix = `INV-${dateStr}-`;
  
  try {
    // Find the latest invoice number with the same date prefix
    const result = await db.query(
      'SELECT invoice_number FROM invoices WHERE invoice_number LIKE $1 ORDER BY invoice_number DESC LIMIT 1',
      [`${prefix}%`]
    );
    
    let sequentialNumber = 1;
    
    if (result.rows.length > 0) {
      // Extract the sequential number from the latest invoice number
      const latestInvoiceNumber = result.rows[0].invoice_number;
      const latestSequentialNumber = parseInt(latestInvoiceNumber.split('-')[2], 10);
      
      if (!isNaN(latestSequentialNumber)) {
        sequentialNumber = latestSequentialNumber + 1;
      }
    }
    
    // Format the sequential number with leading zeros
    const formattedSequentialNumber = sequentialNumber.toString().padStart(4, '0');
    
    return `${prefix}${formattedSequentialNumber}`;
  } catch (error) {
    console.error('Error generating invoice number:', error);
    // Fallback to a timestamp-based number if there's an error
    return `${prefix}${Date.now().toString().slice(-4)}`;
  }
}

/**
 * Generate a unique purchase number
 * Format: PUR-YYYYMMDD-XXXX (where XXXX is a sequential number)
 * @param {Object} db - Database connection
 * @returns {Promise<string>} - Generated purchase number
 */
async function generatePurchaseNumber(db) {
  const today = new Date();
  const dateStr = today.getFullYear().toString() +
    (today.getMonth() + 1).toString().padStart(2, '0') +
    today.getDate().toString().padStart(2, '0');
  
  const prefix = `PUR-${dateStr}-`;
  
  try {
    // Find the latest purchase number with the same date prefix
    const result = await db.query(
      'SELECT purchase_number FROM purchases WHERE purchase_number LIKE $1 ORDER BY purchase_number DESC LIMIT 1',
      [`${prefix}%`]
    );
    
    let sequentialNumber = 1;
    
    if (result.rows.length > 0) {
      // Extract the sequential number from the latest purchase number
      const latestPurchaseNumber = result.rows[0].purchase_number;
      const latestSequentialNumber = parseInt(latestPurchaseNumber.split('-')[2], 10);
      
      if (!isNaN(latestSequentialNumber)) {
        sequentialNumber = latestSequentialNumber + 1;
      }
    }
    
    // Format the sequential number with leading zeros
    const formattedSequentialNumber = sequentialNumber.toString().padStart(4, '0');
    
    return `${prefix}${formattedSequentialNumber}`;
  } catch (error) {
    console.error('Error generating purchase number:', error);
    // Fallback to a timestamp-based number if there's an error
    return `${prefix}${Date.now().toString().slice(-4)}`;
  }
}

module.exports = {
  generateInvoiceNumber,
  generatePurchaseNumber
}; 