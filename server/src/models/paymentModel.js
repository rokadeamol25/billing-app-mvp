const db = require('../config/db');

/**
 * Payment Model
 * Handles database operations for payments
 */
const PaymentModel = {
  /**
   * Create a new payment
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Created payment object
   */
  async createPayment(paymentData) {
    const {
      invoice_id,
      amount,
      payment_method,
      notes,
      payment_date
    } = paymentData;
    
    const result = await db.query(
      `INSERT INTO payments 
      (payment_type, reference_id, reference_type, amount, payment_method, notes, payment_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        'incoming',
        invoice_id,
        'invoice',
        amount,
        payment_method,
        notes,
        payment_date || new Date()
      ]
    );
    
    return result.rows[0];
  },
  
  /**
   * Get all payments for an invoice
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<Array>} Array of payment objects
   */
  async getPaymentsByInvoiceId(invoiceId) {
    const result = await db.query(
      `SELECT * FROM payments 
      WHERE reference_id = $1 AND reference_type = 'invoice'
      ORDER BY payment_date DESC`,
      [invoiceId]
    );
    
    return result.rows;
  },
  
  /**
   * Get total amount paid for an invoice
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<number>} Total amount paid
   */
  async getTotalPaidForInvoice(invoiceId) {
    const result = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total_paid 
      FROM payments 
      WHERE reference_id = $1 AND reference_type = 'invoice'`,
      [invoiceId]
    );
    
    return parseFloat(result.rows[0].total_paid);
  },

  /**
   * Get a payment by ID
   * @param {string} paymentId - Payment ID
   * @returns {Promise<Object>} Payment object
   */
  async getPaymentById(paymentId) {
    try {
      const result = await db.query(
        `SELECT * FROM payments WHERE id = $1`,
        [paymentId]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error getting payment by ID:', error);
      throw error;
    }
  },

  /**
   * Delete a payment
   * @param {string} paymentId - Payment ID
   * @returns {Promise<Object>} Deleted payment object
   */
  async deletePayment(paymentId) {
    try {
      const result = await db.query(
        `DELETE FROM payments WHERE id = $1 RETURNING *`,
        [paymentId]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }
  }
};

module.exports = PaymentModel; 