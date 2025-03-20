const db = require('../config/db');

/**
 * Supplier Model
 * Handles database operations for suppliers
 */
const SupplierModel = {
  /**
   * Get all suppliers
   * @returns {Promise<Array>} Array of supplier objects
   */
  async getAllSuppliers() {
    try {
      const result = await db.query(
        'SELECT * FROM suppliers ORDER BY name ASC'
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting all suppliers:', error);
      throw error;
    }
  },

  /**
   * Get supplier by ID
   * @param {string} id - Supplier ID
   * @returns {Promise<Object>} Supplier object
   */
  async getSupplierById(id) {
    try {
      const result = await db.query(
        'SELECT * FROM suppliers WHERE id = $1',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error getting supplier by ID:', error);
      throw error;
    }
  },

  /**
   * Create a new supplier
   * @param {Object} supplierData - Supplier data
   * @returns {Promise<Object>} Created supplier object
   */
  async createSupplier(supplierData) {
    try {
      const { 
        name, 
        email, 
        phone, 
        address, 
        city, 
        state, 
        postal_code, 
        country, 
        payment_terms 
      } = supplierData;
      
      const result = await db.query(
        `INSERT INTO suppliers 
        (name, email, phone, address, city, state, postal_code, country, payment_terms) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        RETURNING *`,
        [
          name, 
          email, 
          phone, 
          address, 
          city, 
          state, 
          postal_code, 
          country || 'India', 
          payment_terms || 30
        ]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }
  },

  /**
   * Update a supplier
   * @param {string} id - Supplier ID
   * @param {Object} supplierData - Supplier data to update
   * @returns {Promise<Object>} Updated supplier object
   */
  async updateSupplier(id, supplierData) {
    try {
      const { 
        name, 
        email, 
        phone, 
        address, 
        city, 
        state, 
        postal_code, 
        country, 
        payment_terms 
      } = supplierData;
      
      const result = await db.query(
        `UPDATE suppliers 
        SET name = $1, email = $2, phone = $3, address = $4, 
        city = $5, state = $6, postal_code = $7, country = $8, payment_terms = $9 
        WHERE id = $10 
        RETURNING *`,
        [
          name, 
          email, 
          phone, 
          address, 
          city, 
          state, 
          postal_code, 
          country || 'India', 
          payment_terms || 30, 
          id
        ]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw error;
    }
  },

  /**
   * Delete a supplier
   * @param {string} id - Supplier ID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async deleteSupplier(id) {
    try {
      // Check if supplier has any purchases
      const purchaseCheck = await db.query(
        'SELECT COUNT(*) FROM purchases WHERE supplier_id = $1',
        [id]
      );
      
      if (parseInt(purchaseCheck.rows[0].count) > 0) {
        throw new Error('Cannot delete supplier with existing purchases');
      }
      
      const result = await db.query(
        'DELETE FROM suppliers WHERE id = $1 RETURNING id',
        [id]
      );
      
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  },

  /**
   * Search suppliers by name, email, or phone
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Array of matching supplier objects
   */
  async searchSuppliers(searchTerm) {
    try {
      const result = await db.query(
        `SELECT * FROM suppliers 
        WHERE name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1 
        ORDER BY name ASC`,
        [`%${searchTerm}%`]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error searching suppliers:', error);
      throw error;
    }
  },

  /**
   * Get suppliers with pending payments
   * @returns {Promise<Array>} Array of supplier objects with pending payments
   */
  async getSuppliersWithPendingPayments() {
    try {
      const result = await db.query(
        `SELECT s.*, 
        COUNT(p.id) as pending_purchase_count, 
        SUM(p.total_amount) as total_pending_amount 
        FROM suppliers s
        JOIN purchases p ON s.id = p.supplier_id
        WHERE p.payment_status IN ('Pending', 'Partial')
        GROUP BY s.id
        ORDER BY total_pending_amount DESC`
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error getting suppliers with pending payments:', error);
      throw error;
    }
  }
};

module.exports = SupplierModel; 