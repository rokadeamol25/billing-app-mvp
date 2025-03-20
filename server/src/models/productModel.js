const db = require('../config/db');

/**
 * Product Model
 * Handles database operations for products
 */
const ProductModel = {
  /**
   * Get all products
   * @returns {Promise<Array>} Array of product objects
   */
  async getAllProducts() {
    try {
      const result = await db.query(
        `SELECT p.*, c.name as category_name 
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        ORDER BY p.name ASC`
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting all products:', error);
      throw error;
    }
  },

  /**
   * Get product by ID
   * @param {string} id - Product ID
   * @returns {Promise<Object>} Product object
   */
  async getProductById(id) {
    try {
      const result = await db.query(
        `SELECT p.*, c.name as category_name 
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = $1`,
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error getting product by ID:', error);
      throw error;
    }
  },

  /**
   * Get product by SKU
   * @param {string} sku - Product SKU
   * @returns {Promise<Object>} Product object
   */
  async getProductBySku(sku) {
    try {
      const result = await db.query(
        `SELECT p.*, c.name as category_name 
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.sku = $1`,
        [sku]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error getting product by SKU:', error);
      throw error;
    }
  },

  /**
   * Create a new product
   * @param {Object} productData - Product data
   * @returns {Promise<Object>} Created product object
   */
  async createProduct(productData) {
    try {
      const { 
        sku, 
        name, 
        description, 
        category_id, 
        cost_price, 
        selling_price, 
        stock_quantity, 
        low_stock_threshold,
        is_active,
        hsn_sac_code,
        gst_rate
      } = productData;
      
      const result = await db.query(
        `INSERT INTO products 
        (sku, name, description, category_id, cost_price, selling_price, 
        stock_quantity, low_stock_threshold, is_active, hsn_sac_code, gst_rate) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
        RETURNING *`,
        [
          sku, 
          name, 
          description, 
          category_id, 
          cost_price, 
          selling_price, 
          stock_quantity || 0, 
          low_stock_threshold || 10,
          is_active !== undefined ? is_active : true,
          hsn_sac_code || '',
          gst_rate || 0
        ]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  /**
   * Update a product
   * @param {string} id - Product ID
   * @param {Object} productData - Product data to update
   * @returns {Promise<Object>} Updated product object
   */
  async updateProduct(id, productData) {
    try {
      const { 
        sku, 
        name, 
        description, 
        category_id, 
        cost_price, 
        selling_price, 
        stock_quantity, 
        low_stock_threshold,
        is_active,
        hsn_sac_code,
        gst_rate
      } = productData;
      
      const result = await db.query(
        `UPDATE products 
        SET sku = $1, name = $2, description = $3, category_id = $4, 
        cost_price = $5, selling_price = $6, stock_quantity = $7, 
        low_stock_threshold = $8, is_active = $9, hsn_sac_code = $10, gst_rate = $11
        WHERE id = $12 
        RETURNING *`,
        [
          sku, 
          name, 
          description, 
          category_id, 
          cost_price, 
          selling_price, 
          stock_quantity, 
          low_stock_threshold,
          is_active,
          hsn_sac_code || '',
          gst_rate || 0,
          id
        ]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  /**
   * Update product stock quantity
   * @param {string} id - Product ID
   * @param {number} quantity - Quantity to add (positive) or subtract (negative)
   * @returns {Promise<Object>} Updated product object
   */
  async updateStock(id, quantity) {
    try {
      const result = await db.query(
        `UPDATE products 
        SET stock_quantity = stock_quantity + $1
        WHERE id = $2 
        RETURNING *`,
        [quantity, id]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating product stock:', error);
      throw error;
    }
  },

  /**
   * Delete a product
   * @param {string} id - Product ID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async deleteProduct(id) {
    try {
      // Check if product is used in any invoice or purchase
      const invoiceCheck = await db.query(
        'SELECT COUNT(*) FROM invoice_items WHERE product_id = $1',
        [id]
      );
      
      const purchaseCheck = await db.query(
        'SELECT COUNT(*) FROM purchase_items WHERE product_id = $1',
        [id]
      );
      
      if (parseInt(invoiceCheck.rows[0].count) > 0 || parseInt(purchaseCheck.rows[0].count) > 0) {
        throw new Error('Cannot delete product that is used in invoices or purchases');
      }
      
      const result = await db.query(
        'DELETE FROM products WHERE id = $1 RETURNING id',
        [id]
      );
      
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  /**
   * Search products by name or SKU
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Array of matching product objects
   */
  async searchProducts(searchTerm) {
    try {
      const result = await db.query(
        `SELECT p.*, c.name as category_name 
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.name ILIKE $1 OR p.sku ILIKE $1 
        ORDER BY p.name ASC`,
        [`%${searchTerm}%`]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  },

  /**
   * Get low stock products
   * @returns {Promise<Array>} Array of low stock product objects
   */
  async getLowStockProducts() {
    try {
      const result = await db.query(
        `SELECT p.*, c.name as category_name 
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.stock_quantity <= p.low_stock_threshold
        ORDER BY p.stock_quantity ASC`
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error getting low stock products:', error);
      throw error;
    }
  },

  /**
   * Get all product batches for a product
   * @param {string} productId - Product ID
   * @returns {Promise<Array>} Array of batch objects
   */
  async getProductBatches(productId) {
    try {
      const result = await db.query(
        `SELECT * FROM product_batches
        WHERE product_id = $1
        ORDER BY expiry_date ASC`,
        [productId]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error getting product batches:', error);
      throw error;
    }
  },

  /**
   * Add a new product batch
   * @param {Object} batchData - Batch data
   * @returns {Promise<Object>} Created batch object
   */
  async addProductBatch(batchData) {
    try {
      const { product_id, batch_number, expiry_date, quantity } = batchData;
      
      const result = await db.query(
        `INSERT INTO product_batches 
        (product_id, batch_number, expiry_date, quantity) 
        VALUES ($1, $2, $3, $4) 
        RETURNING *`,
        [product_id, batch_number, expiry_date, quantity]
      );
      
      // Update the product stock quantity
      await this.updateStock(product_id, quantity);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error adding product batch:', error);
      throw error;
    }
  },

  /**
   * Get all categories
   * @returns {Promise<Array>} Array of category objects
   */
  async getAllCategories() {
    try {
      const result = await db.query(
        'SELECT * FROM categories ORDER BY name ASC'
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting all categories:', error);
      throw error;
    }
  },

  /**
   * Create a new category
   * @param {Object} categoryData - Category data
   * @returns {Promise<Object>} Created category object
   */
  async createCategory(categoryData) {
    try {
      const { name, description } = categoryData;
      const result = await db.query(
        `INSERT INTO categories (name, description) 
        VALUES ($1, $2) 
        RETURNING *`,
        [name, description]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },

  /**
   * Update a category
   * @param {string} id - Category ID
   * @param {Object} categoryData - Category data
   * @returns {Promise<Object>} Updated category object
   */
  async updateCategory(id, categoryData) {
    try {
      const { name, description } = categoryData;
      const result = await db.query(
        `UPDATE categories 
        SET name = $1, description = $2, updated_at = NOW() 
        WHERE id = $3 
        RETURNING *`,
        [name, description, id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },

  /**
   * Delete a category
   * @param {string} id - Category ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async deleteCategory(id) {
    try {
      // First check if any products are using this category
      const productsCheck = await db.query(
        `SELECT COUNT(*) FROM products WHERE category_id = $1`,
        [id]
      );
      
      if (parseInt(productsCheck.rows[0].count) > 0) {
        throw new Error('Cannot delete category that is in use by products');
      }
      
      const result = await db.query(
        `DELETE FROM categories WHERE id = $1 RETURNING id`,
        [id]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }
};

module.exports = ProductModel; 

