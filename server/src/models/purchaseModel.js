const db = require('../config/db');
const { generatePurchaseNumber } = require('../utils/numberGenerator');

/**
 * Purchase Model
 * Handles database operations for purchases
 */
const PurchaseModel = {
  /**
   * Delete a purchase and its related records
   * @param {string} id - Purchase ID
   * @returns {Promise<boolean>} True if deletion was successful
   */
  async deletePurchase(id) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get purchase details for reverting stock
      const purchaseResult = await client.query(
        'SELECT * FROM purchases WHERE id = $1',
        [id]
      );
      
      const purchase = purchaseResult.rows[0];
      if (!purchase) {
        throw new Error('Purchase not found');
      }
      
      // Get purchase items
      const itemsResult = await client.query(
        'SELECT * FROM purchase_items WHERE purchase_id = $1',
        [id]
      );
      
      // Revert stock quantities
      for (const item of itemsResult.rows) {
        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );
        
       
      }
      
      // Delete related records
      await client.query('DELETE FROM purchase_items WHERE purchase_id = $1', [id]);
    //  await client.query('DELETE FROM payments WHERE reference_id = $1 AND reference_type = \'purchase\'', [id]);
      await client.query('DELETE FROM purchases WHERE id = $1', [id]);
      
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error deleting purchase:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Get all purchases with basic information
   * @returns {Promise<Array>} Array of purchase objects
   */
  async getAllPurchases() {
    try {
      const result = await db.query(
        `SELECT p.*, s.name as supplier_name 
        FROM purchases p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        ORDER BY p.purchase_date DESC`
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting all purchases:', error);
      throw error;
    }
  },

  /**
   * Get purchase by ID with all details
   * @param {string} id - Purchase ID
   * @returns {Promise<Object>} Purchase object with items
   */
  async getPurchaseById(id) {
    try {
      // Get purchase details
      const purchaseResult = await db.query(
        `SELECT p.*, s.name as supplier_name, s.email as supplier_email, 
        s.phone as supplier_phone, s.address as supplier_address,
        s.city as supplier_city, s.state as supplier_state, 
        s.postal_code as supplier_postal_code, s.country as supplier_country,
        s.payment_terms as supplier_payment_terms
        FROM purchases p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.id = $1`,
        [id]
      );
      
      const purchase = purchaseResult.rows[0];
      
      if (!purchase) {
        return null;
      }
      
      // Get purchase items
      const itemsResult = await db.query(
        `SELECT pi.*, p.name as product_name, p.sku as product_sku, 
        p.description as product_description
        FROM purchase_items pi
        LEFT JOIN products p ON pi.product_id = p.id
        WHERE pi.purchase_id = $1
        ORDER BY pi.id ASC`,
        [id]
      );
      
      purchase.items = itemsResult.rows;
      
      return purchase;
    } catch (error) {
      console.error('Error getting purchase by ID:', error);
      throw error;
    }
  },

  /**
   * Create a new purchase with items
   * @param {Object} purchaseData - Purchase data
   * @param {Array} items - Array of purchase items
   * @returns {Promise<Object>} Created purchase object with items
   */
  async createPurchase(purchaseData, items) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Generate purchase number
      const purchaseNumber = await generatePurchaseNumber(db);
      
      const { 
        supplier_id, 
        purchase_date, 
        due_date, 
        subtotal, 
        tax_percentage, 
        tax_amount, 
        total_amount, 
        payment_status, 
        notes 
      } = purchaseData;
      
      // Insert purchase
      const purchaseResult = await client.query(
        `INSERT INTO purchases 
        (purchase_number, supplier_id, purchase_date, due_date, subtotal, 
        tax_percentage, tax_amount, total_amount, payment_status, notes) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING *`,
        [
          purchaseNumber,
          supplier_id,
          purchase_date || new Date(),
          due_date,
          subtotal,
          tax_percentage || 0,
          tax_amount || 0,
          total_amount,
          payment_status || 'Pending',
          notes
        ]
      );
      
      const purchase = purchaseResult.rows[0];
      
      // Insert purchase items and update stock
      const insertedItems = [];
      
      for (const item of items) {
        // Insert purchase item
        const itemResult = await client.query(
          `INSERT INTO purchase_items 
          (purchase_id, product_id, product_name, batch_number, expiry_date, quantity, unit_price, total_price, hsn_sac_code, gst_rate) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
          RETURNING *`,
          [
            purchase.id,
            item.product_id,
            item.product_name || '',
            item.batch_number || null,
            item.expiry_date || null,
            item.quantity,
            item.unit_price,
            item.total_price,
            item.hsn_sac_code || '',
            item.gst_rate || 0
          ]
        );
        
        insertedItems.push(itemResult.rows[0]);
        
        // Update product stock
        await client.query(
          `UPDATE products 
          SET stock_quantity = stock_quantity + $1
          WHERE id = $2`,
          [item.quantity, item.product_id]
        );
        
       
        
        // If batch number is provided, add to product batches
        if (item.batch_number && item.expiry_date) {
          await client.query(
            `INSERT INTO product_batches 
            (product_id, batch_number, expiry_date, quantity) 
            VALUES ($1, $2, $3, $4)`,
            [
              item.product_id,
              item.batch_number,
              item.expiry_date,
              item.quantity
            ]
          );
        }
      }
      
      // If payment status is Paid, record the payment
      if (payment_status === 'Paid') {
        await client.query(
          `INSERT INTO payments 
          (payment_type, reference_id, reference_type, amount, payment_method, payment_date, notes) 
          VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            'outgoing',
            purchase.id,
            'purchase',
            total_amount,
            'Bank Transfer', // Default payment method for purchases
            new Date(),
            `Payment for Purchase #${purchaseNumber}`
          ]
        );
      }
      
      await client.query('COMMIT');
      
      purchase.items = insertedItems;
      
      return purchase;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating purchase:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Update purchase payment status
   * @param {string} id - Purchase ID
   * @param {string} paymentStatus - New payment status
   * @returns {Promise<Object>} Updated purchase object
   */
  async updatePaymentStatus(id, paymentStatus) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get purchase details
      const purchaseResult = await client.query(
        'SELECT * FROM purchases WHERE id = $1',
        [id]
      );
      
      const purchase = purchaseResult.rows[0];
      
      if (!purchase) {
        throw new Error('Purchase not found');
      }
      
      // Update purchase payment status
      const updatedPurchaseResult = await client.query(
        `UPDATE purchases 
        SET payment_status = $1
        WHERE id = $2 
        RETURNING *`,
        [paymentStatus, id]
      );
      
      // If changing to Paid and wasn't Paid before, record the payment
      if (paymentStatus === 'Paid' && purchase.payment_status !== 'Paid') {
        await client.query(
          `INSERT INTO payments 
          (payment_type, reference_id, reference_type, amount, payment_method, payment_date, notes) 
          VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            'outgoing',
            id,
            'purchase',
            purchase.total_amount,
            'Bank Transfer', // Default payment method for purchases
            new Date(),
            `Payment for Purchase #${purchase.purchase_number}`
          ]
        );
      }
      
      await client.query('COMMIT');
      
      return updatedPurchaseResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating purchase payment status:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Get purchases by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Array of purchase objects
   */
  async getPurchasesByDateRange(startDate, endDate) {
    try {
      const result = await db.query(
        `SELECT p.*, s.name as supplier_name 
        FROM purchases p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.purchase_date BETWEEN $1 AND $2
        ORDER BY p.purchase_date DESC`,
        [startDate, endDate]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting purchases by date range:', error);
      throw error;
    }
  },

  /**
   * Get unpaid purchases
   * @returns {Promise<Array>} Array of unpaid purchase objects
   */
  async getUnpaidPurchases() {
    try {
      const result = await db.query(
        `SELECT p.*, s.name as supplier_name 
        FROM purchases p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.payment_status IN ('Pending', 'Partial')
        ORDER BY p.purchase_date ASC`
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting unpaid purchases:', error);
      throw error;
    }
  },

  /**
   * Get purchases by supplier
   * @param {string} supplierId - Supplier ID
   * @returns {Promise<Array>} Array of purchase objects
   */
  async getPurchasesBySupplier(supplierId) {
    try {
      const result = await db.query(
        `SELECT p.*, s.name as supplier_name 
        FROM purchases p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.supplier_id = $1
        ORDER BY p.purchase_date DESC`,
        [supplierId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting purchases by supplier:', error);
      throw error;
    }
  },

  /**
   * Get purchase statistics
   * @param {string} period - Period ('daily', 'weekly', 'monthly')
   * @returns {Promise<Object>} Purchase statistics
   */
  async getPurchaseStatistics(period) {
    try {
      let groupBy, dateFormat;
      
      switch (period) {
        case 'daily':
          groupBy = 'DATE(purchase_date)';
          dateFormat = 'YYYY-MM-DD';
          break;
        case 'weekly':
          groupBy = 'DATE_TRUNC(\'week\', purchase_date)';
          dateFormat = 'YYYY-"W"WW';
          break;
        case 'monthly':
        default:
          groupBy = 'DATE_TRUNC(\'month\', purchase_date)';
          dateFormat = 'YYYY-MM';
          break;
      }
      
      const result = await db.query(
        `SELECT 
          ${groupBy} as period,
          COUNT(*) as purchase_count,
          SUM(total_amount) as total_expense,
          SUM(tax_amount) as total_tax
        FROM purchases
        WHERE payment_status != 'Cancelled'
        GROUP BY ${groupBy}
        ORDER BY ${groupBy} DESC
        LIMIT 12`
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error getting purchase statistics:', error);
      throw error;
    }
  }
};

module.exports = PurchaseModel;