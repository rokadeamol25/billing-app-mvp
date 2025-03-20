const db = require('../config/db');
const { generateInvoiceNumber } = require('../utils/numberGenerator');
const ProductModel = require('./productModel');

/**
 * Invoice Model
 * Handles database operations for invoices
 */
const InvoiceModel = {
  /**
   * Get all invoices with basic information
   * @returns {Promise<Array>} Array of invoice objects
   */
  async getAllInvoices() {
    try {
      const result = await db.query(
        `SELECT i.*, c.name as customer_name 
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        ORDER BY i.invoice_date DESC`
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting all invoices:', error);
      throw error;
    }
  },

  /**
   * Get invoice by ID with all details
   * @param {string} id - Invoice ID
   * @returns {Promise<Object>} Invoice object with items
   */
  async getInvoiceById(id) {
    try {
      // Get invoice details
      const invoiceResult = await db.query(
        `SELECT i.*, c.name as customer_name, c.email as customer_email, 
        c.phone as customer_phone, c.address as customer_address,
        c.city as customer_city, c.state as customer_state, 
        c.postal_code as customer_postal_code, c.country as customer_country
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        WHERE i.id = $1`,
        [id]
      );
      
      const invoice = invoiceResult.rows[0];
      
      if (!invoice) {
        return null;
      }
      
      // Get invoice items
      const itemsResult = await db.query(
        `SELECT ii.*, p.name as product_name, p.sku as product_sku, 
        p.description as product_description
        FROM invoice_items ii
        LEFT JOIN products p ON ii.product_id = p.id
        WHERE ii.invoice_id = $1
        ORDER BY ii.id ASC`,
        [id]
      );
      
      invoice.items = itemsResult.rows;
      
      return invoice;
    } catch (error) {
      console.error('Error getting invoice by ID:', error);
      throw error;
    }
  },

  /**
   * Create a new invoice with items
   * @param {Object} invoiceData - Invoice data
   * @param {Array} items - Array of invoice items
   * @returns {Promise<Object>} Created invoice object with items
   */
  async createInvoice(invoiceData, items) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Generate invoice number
      const invoiceNumber = await generateInvoiceNumber(db);
      
      const { 
        customer_id, 
        invoice_date, 
        due_date, 
        subtotal, 
        discount_type, 
        discount_value, 
        tax_percentage, 
        tax_amount, 
        shipping_cost, 
        total_amount, 
        payment_method, 
        payment_status, 
        notes 
      } = invoiceData;
      
      // Insert invoice
      const invoiceResult = await client.query(
        `INSERT INTO invoices 
        (invoice_number, customer_id, invoice_date, due_date, subtotal, 
        discount_type, discount_value, tax_percentage, tax_amount, 
        shipping_cost, total_amount, payment_method, payment_status, notes) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
        RETURNING *`,
        [
          invoiceNumber,
          customer_id,
          invoice_date || new Date(),
          due_date,
          subtotal,
          discount_type,
          discount_value || 0,
          tax_percentage || 0,
          tax_amount || 0,
          shipping_cost || 0,
          total_amount,
          payment_method,
          payment_status || 'Pending',
          notes
        ]
      );
      
      const invoice = invoiceResult.rows[0];
      
      // Insert invoice items and update stock
      const insertedItems = [];
      
      for (const item of items) {
        // Insert invoice item
        const itemResult = await client.query(
          `INSERT INTO invoice_items 
          (invoice_id, product_id, product_name, quantity, unit_price, discount_percentage, 
          tax_percentage, total_price, hsn_sac_code, gst_rate) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
          RETURNING *`,
          [
            invoice.id,
            item.product_id,
            item.product_name,
            item.quantity,
            item.unit_price,
            item.discount_percentage || 0,
            item.tax_percentage || 0,
            item.total_price,
            item.hsn_sac_code || '',
            item.gst_rate || 0
          ]
        );
        
        insertedItems.push(itemResult.rows[0]);
        
        // Update product stock
        await client.query(
          `UPDATE products 
          SET stock_quantity = stock_quantity - $1
          WHERE id = $2`,
          [item.quantity, item.product_id]
        );
        
       
      }
      
      // If payment status is Paid, record the payment
      if (payment_status === 'Paid') {
        await client.query(
          `INSERT INTO payments 
          (payment_type, reference_id, reference_type, amount, payment_method, payment_date, notes) 
          VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            'incoming',
            invoice.id,
            'invoice',
            total_amount,
            payment_method,
            new Date(),
            `Payment for Invoice #${invoiceNumber}`
          ]
        );
      }
      
      await client.query('COMMIT');
      
      invoice.items = insertedItems;
      
      return invoice;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating invoice:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Update invoice payment status
   * @param {string} id - Invoice ID
   * @param {string} status - New payment status
   * @returns {Promise<Object>} Updated invoice object
   */
  async updatePaymentStatus(id, status) {
    // Validate status
    const validStatuses = ['Paid', 'Pending', 'Partial', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid payment status. Must be one of: ${validStatuses.join(', ')}`);
    }

    try {
      const result = await db.query(
        `UPDATE invoices 
        SET payment_status = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 
        RETURNING *`,
        [status, id]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating invoice payment status:', error);
      throw error;
    }
  },

  /**
   * Process a sales return
   * @param {string} invoiceId - Invoice ID
   * @param {Array} returnItems - Array of items to return
   * @param {string} reason - Return reason
   * @returns {Promise<Object>} Created return object
   */
  async processSalesReturn(invoiceId, returnItems, reason) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get invoice details
      const invoiceResult = await client.query(
        'SELECT * FROM invoices WHERE id = $1',
        [invoiceId]
      );
      
      const invoice = invoiceResult.rows[0];
      
      if (!invoice) {
        throw new Error('Invoice not found');
      }
      
      // Calculate total return amount
      let totalReturnAmount = 0;
      
      for (const item of returnItems) {
        totalReturnAmount += item.quantity * item.unit_price;
      }
      
      // Create sales return record
      const returnResult = await client.query(
        `INSERT INTO sales_returns 
        (invoice_id, return_date, total_amount, reason, status) 
        VALUES ($1, $2, $3, $4, $5) 
        RETURNING *`,
        [
          invoiceId,
          new Date(),
          totalReturnAmount,
          reason,
          'Processed'
        ]
      );
      
      const salesReturn = returnResult.rows[0];
      
      // Process each return item
      for (const item of returnItems) {
        // Insert return item
        await client.query(
          `INSERT INTO sales_return_items 
          (return_id, invoice_item_id, product_id, quantity, unit_price, total_price) 
          VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            salesReturn.id,
            item.invoice_item_id,
            item.product_id,
            item.quantity,
            item.unit_price,
            item.quantity * item.unit_price
          ]
        );
        
        // Update product stock
        await client.query(
          `UPDATE products 
          SET stock_quantity = stock_quantity + $1
          WHERE id = $2`,
          [item.quantity, item.product_id]
        );
        
      
      }
      
      await client.query('COMMIT');
      
      return salesReturn;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error processing sales return:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Get invoices by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Array of invoice objects
   */
  async getInvoicesByDateRange(startDate, endDate) {
    try {
      const result = await db.query(
        `SELECT i.*, c.name as customer_name 
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        WHERE i.invoice_date BETWEEN $1 AND $2
        ORDER BY i.invoice_date DESC`,
        [startDate, endDate]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting invoices by date range:', error);
      throw error;
    }
  },

  /**
   * Get unpaid invoices
   * @returns {Promise<Array>} Array of unpaid invoice objects
   */
  async getUnpaidInvoices() {
    try {
      const result = await db.query(
        `SELECT i.*, c.name as customer_name 
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        WHERE i.payment_status IN ('Pending', 'Partial')
        ORDER BY i.invoice_date ASC`
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting unpaid invoices:', error);
      throw error;
    }
  },

  /**
   * Get sales statistics
   * @param {string} period - Period ('daily', 'weekly', 'monthly')
   * @returns {Promise<Object>} Sales statistics
   */
  async getSalesStatistics(period) {
    try {
      let groupBy, dateFormat;
      
      switch (period) {
        case 'daily':
          groupBy = 'DATE(invoice_date)';
          dateFormat = 'YYYY-MM-DD';
          break;
        case 'weekly':
          groupBy = 'DATE_TRUNC(\'week\', invoice_date)';
          dateFormat = 'YYYY-"W"WW';
          break;
        case 'monthly':
        default:
          groupBy = 'DATE_TRUNC(\'month\', invoice_date)';
          dateFormat = 'YYYY-MM';
          break;
      }
      
      const result = await db.query(
        `SELECT 
          ${groupBy} as period,
          COUNT(*) as invoice_count,
          SUM(total_amount) as total_revenue,
          SUM(tax_amount) as total_tax
        FROM invoices
        WHERE payment_status != 'Cancelled'
        GROUP BY ${groupBy}
        ORDER BY ${groupBy} DESC
        LIMIT 12`
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error getting sales statistics:', error);
      throw error;
    }
  },

  /**
   * Get invoice with payment information
   * @param {string} id - Invoice ID
   * @returns {Promise<Object>} Invoice object with payment details
   */
  async getInvoiceWithPayments(id) {
    try {
      // Get invoice details
      const invoiceResult = await db.query(
        `SELECT i.*, c.name as customer_name, c.email as customer_email, 
        c.phone as customer_phone, c.address as customer_address,
        c.city as customer_city, c.state as customer_state, 
        c.postal_code as customer_postal_code, c.country as customer_country
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        WHERE i.id = $1`,
        [id]
      );
      
      const invoice = invoiceResult.rows[0];
      
      if (!invoice) {
        return null;
      }
      
      // Get invoice items
      const itemsResult = await db.query(
        `SELECT ii.*, p.name as product_name, p.sku as product_sku, 
        p.description as product_description
        FROM invoice_items ii
        LEFT JOIN products p ON ii.product_id = p.id
        WHERE ii.invoice_id = $1
        ORDER BY ii.id ASC`,
        [id]
      );
      
      invoice.items = itemsResult.rows;
      
      // Get payment information
      const paymentsResult = await db.query(
        `SELECT * FROM payments
        WHERE invoice_id = $1
        ORDER BY payment_date DESC`,
        [id]
      );
      
      invoice.payments = paymentsResult.rows;
      
      // Calculate total paid amount
      const totalPaidResult = await db.query(
        `SELECT COALESCE(SUM(amount), 0) as total_paid
        FROM payments
        WHERE invoice_id = $1`,
        [id]
      );
      
      invoice.amount_paid = parseFloat(totalPaidResult.rows[0].total_paid);
      invoice.balance_due = invoice.total_amount - invoice.amount_paid;
      
      // Determine actual payment status based on payments
      if (invoice.amount_paid <= 0) {
        invoice.payment_status = 'Unpaid';
      } else if (invoice.amount_paid < invoice.total_amount) {
        invoice.payment_status = 'Partially Paid';
      } else {
        invoice.payment_status = 'Paid';
      }
      
      return invoice;
    } catch (error) {
      console.error('Error getting invoice with payments:', error);
      throw error;
    }
  },

  /**
   * Record a payment for an invoice
   * @param {string} invoiceId - Invoice ID
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Payment object and updated invoice status
   */
  async recordPayment(invoiceId, paymentData) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get invoice details
      const invoiceResult = await client.query(
        'SELECT * FROM invoices WHERE id = $1',
        [invoiceId]
      );
      
      const invoice = invoiceResult.rows[0];
      
      if (!invoice) {
        throw new Error('Invoice not found');
      }
      
      const { amount, payment_method, reference_number, notes, payment_date } = paymentData;
      
      // Insert payment record
      const paymentResult = await client.query(
        `INSERT INTO payments 
        (invoice_id, amount, payment_method, reference_number, notes, payment_date) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING *`,
        [
          invoiceId,
          amount,
          payment_method,
          reference_number || null,
          notes || null,
          payment_date || new Date()
        ]
      );
      
      const payment = paymentResult.rows[0];
      
      // Calculate total paid amount
      const totalPaidResult = await client.query(
        `SELECT COALESCE(SUM(amount), 0) as total_paid
        FROM payments
        WHERE invoice_id = $1`,
        [invoiceId]
      );
      
      const totalPaid = parseFloat(totalPaidResult.rows[0].total_paid);
      
      // Determine new payment status
      let newStatus = 'Unpaid';
      if (totalPaid >= invoice.total_amount) {
        newStatus = 'Paid';
      } else if (totalPaid > 0) {
        newStatus = 'Partially Paid';
      }
      
      // Update invoice payment status
      const updatedInvoiceResult = await client.query(
        `UPDATE invoices 
        SET payment_status = $1
        WHERE id = $2 
        RETURNING *`,
        [newStatus, invoiceId]
      );
      
      await client.query('COMMIT');
      
      return {
        payment,
        invoice_status: newStatus,
        total_paid: totalPaid,
        balance_due: invoice.total_amount - totalPaid
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error recording payment:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Get payment history for an invoice
  getPaymentHistory: async (invoiceId) => {
    const result = await db.query(
      `SELECT p.*, 
              i.total_amount,
              i.status as invoice_status
       FROM payments p
       JOIN invoices i ON p.invoice_id = i.invoice_id
       WHERE p.invoice_id = $1
       ORDER BY p.payment_date DESC`,
      [invoiceId]
    );
    
    return result.rows;
  },

  /**
   * Update invoice payment status
   * @param {string} id - Invoice ID
   * @param {string} status - New payment status
   * @returns {Promise<Object>} Updated invoice object
   */
  async updateInvoiceStatus(id, status) {
    try {
      const result = await db.query(
        `UPDATE invoices 
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 
        RETURNING *`,
        [status, id]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating invoice status:', error);
      throw error;
    }
  },

  /**
   * Delete an invoice and all related records
   * @param {string} id - Invoice ID
   * @returns {Promise<Object>} Deleted invoice object
   */
  async deleteInvoice(id) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get invoice details first
      const invoiceResult = await client.query(
        'SELECT * FROM invoices WHERE id = $1',
        [id]
      );
      
      const invoice = invoiceResult.rows[0];
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Get invoice items before deletion to restore product quantities
      const itemsResult = await client.query(
        'SELECT * FROM invoice_items WHERE invoice_id = $1',
        [id]
      );

      // Restore product quantities
      for (const item of itemsResult.rows) {
        await client.query(
          `UPDATE products 
          SET stock_quantity = stock_quantity + $1
          WHERE id = $2`,
          [item.quantity, item.product_id]
        );       
      }

      // Delete related records in order
      await client.query('DELETE FROM payments WHERE reference_id = $1 AND reference_type = \'invoice\'', [id]);
      await client.query('DELETE FROM invoice_items WHERE invoice_id = $1', [id]);
      
      // Finally delete the invoice
      const result = await client.query(
        'DELETE FROM invoices WHERE id = $1 RETURNING *',
        [id]
      );

      await client.query('COMMIT');
      return result.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error deleting invoice:', error);
      throw error;
    } finally {
      client.release();
    }
  }
};



module.exports = InvoiceModel;

