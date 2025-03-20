const db = require('../config/db');

/**
 * Customer Model
 * Handles database operations for customers
 */
const CustomerModel = {
  /**
   * Get all customers
   * @returns {Promise<Array>} Array of customer objects
   */
  async getAllCustomers() {
    try {
      const result = await db.query(
        'SELECT * FROM customers ORDER BY name ASC'
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting all customers:', error);
      throw error;
    }
  },

  /**
   * Get customer by ID
   * @param {string} id - Customer ID
   * @returns {Promise<Object>} Customer object
   */
  async getCustomerById(id) {
    try {
      const result = await db.query(
        'SELECT * FROM customers WHERE id = $1',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error getting customer by ID:', error);
      throw error;
    }
  },

  /**
   * Create a new customer
   * @param {Object} customerData - Customer data
   * @returns {Promise<Object>} Created customer object
   */
  async createCustomer(customerData) {
    try {
      const { name, email, phone, address, city, state, postal_code, country } = customerData;
      
      const result = await db.query(
        `INSERT INTO customers 
        (name, email, phone, address, city, state, postal_code, country) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING *`,
        [name, email, phone, address, city, state, postal_code, country || 'India']
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  },

  /**
   * Update a customer
   * @param {string} id - Customer ID
   * @param {Object} customerData - Customer data to update
   * @returns {Promise<Object>} Updated customer object
   */
  async updateCustomer(id, customerData) {
    try {
      const { name, email, phone, address, city, state, postal_code, country } = customerData;
      
      const result = await db.query(
        `UPDATE customers 
        SET name = $1, email = $2, phone = $3, address = $4, 
        city = $5, state = $6, postal_code = $7, country = $8 
        WHERE id = $9 
        RETURNING *`,
        [name, email, phone, address, city, state, postal_code, country || 'India', id]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  },

  /**
   * Delete a customer
   * @param {string} id - Customer ID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async deleteCustomer(id) {
    try {
      // Check if customer has any invoices
      const invoiceCheck = await db.query(
        'SELECT COUNT(*) FROM invoices WHERE customer_id = $1',
        [id]
      );
      
      if (parseInt(invoiceCheck.rows[0].count) > 0) {
        throw new Error('Cannot delete customer with existing invoices');
      }
      
      const result = await db.query(
        'DELETE FROM customers WHERE id = $1 RETURNING id',
        [id]
      );
      
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  },

  /**
   * Search customers by name, email, or phone
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Array of matching customer objects
   */
  async searchCustomers(searchTerm) {
    try {
      const result = await db.query(
        `SELECT * FROM customers 
        WHERE name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1 
        ORDER BY name ASC`,
        [`%${searchTerm}%`]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  }
};

module.exports = CustomerModel; 