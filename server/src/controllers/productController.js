const ProductModel = require('../models/productModel');

/**
 * Product Controller
 * Handles HTTP requests related to products
 */
const ProductController = {
  /**
   * Get all products
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAllProducts(req, res, next) {
    try {
      const products = await ProductModel.getAllProducts();
      res.json(products);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get product by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getProductById(req, res, next) {
    try {
      const { id } = req.params;
      const product = await ProductModel.getProductById(id);
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      res.json(product);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get product by SKU
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getProductBySku(req, res, next) {
    try {
      const { sku } = req.params;
      const product = await ProductModel.getProductBySku(sku);
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      res.json(product);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create a new product
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createProduct(req, res, next) {
    try {
      const productData = req.body;
      
      // Validate required fields with detailed error messages
      if (!productData.name) {
        return res.status(400).json({ message: 'Product name is required' });
      }
      
      if (!productData.sku) {
        return res.status(400).json({ message: 'Product SKU is required' });
      }
      
      if (!productData.cost_price) {
        return res.status(400).json({ message: 'Cost price is required' });
      }
      
      if (!productData.selling_price) {
        return res.status(400).json({ message: 'Selling price is required' });
      }
      
      // Validate category_id is a valid UUID if provided
      if (productData.category_id) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(productData.category_id)) {
          return res.status(400).json({ message: 'Invalid category ID format' });
        }
      }
      
      const product = await ProductModel.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error.code === '23505') { // Unique violation (duplicate SKU)
        return res.status(400).json({ message: 'A product with this SKU already exists' });
      }
      
      if (error.code === '22P02') { // Invalid input syntax for UUID
        return res.status(400).json({ message: 'Invalid UUID format for category ID' });
      }
      
      if (error.code === '23503') { // Foreign key violation
        return res.status(400).json({ message: 'The specified category does not exist' });
      }
      
      console.error('Error creating product:', error);
      next(error);
    }
  },

  /**
   * Update a product
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const productData = req.body;
      
      // Validate required fields
      if (!productData.name || !productData.sku || !productData.cost_price || !productData.selling_price) {
        return res.status(400).json({ 
          message: 'Product name, SKU, cost price, and selling price are required' 
        });
      }
      
      const product = await ProductModel.updateProduct(id, productData);
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      res.json(product);
    } catch (error) {
      if (error.code === '23505') { // Unique violation (duplicate SKU)
        return res.status(400).json({ message: 'A product with this SKU already exists' });
      }
      next(error);
    }
  },

  /**
   * Update product stock
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateStock(req, res, next) {
    try {
      const { id } = req.params;
      const { quantity } = req.body;
      
      if (quantity === undefined || isNaN(quantity)) {
        return res.status(400).json({ message: 'Valid quantity is required' });
      }
      
      const product = await ProductModel.updateStock(id, parseInt(quantity));
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      res.json(product);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a product
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      
      try {
        const deleted = await ProductModel.deleteProduct(id);
        
        if (!deleted) {
          return res.status(404).json({ message: 'Product not found' });
        }
        
        res.json({ message: 'Product deleted successfully' });
      } catch (error) {
        if (error.message.includes('Cannot delete product that is used in invoices or purchases')) {
          return res.status(400).json({ message: error.message });
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  },

  /**
   * Search products
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async searchProducts(req, res, next) {
    try {
      const { q } = req.query;
      
      if (!q) {
        return res.status(400).json({ message: 'Search term is required' });
      }
      
      const products = await ProductModel.searchProducts(q);
      res.json(products);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get low stock products
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getLowStockProducts(req, res, next) {
    try {
      const products = await ProductModel.getLowStockProducts();
      res.json(products);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get product batches
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getProductBatches(req, res, next) {
    try {
      const { id } = req.params;
      const batches = await ProductModel.getProductBatches(id);
      res.json(batches);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Add product batch
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async addProductBatch(req, res, next) {
    try {
      const { id } = req.params;
      const batchData = req.body;
      
      // Validate required fields
      if (!batchData.batch_number || !batchData.quantity) {
        return res.status(400).json({ 
          message: 'Batch number and quantity are required' 
        });
      }
      
      // Set product ID from URL parameter
      batchData.product_id = id;
      
      const batch = await ProductModel.addProductBatch(batchData);
      res.status(201).json(batch);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all categories
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAllCategories(req, res, next) {
    try {
      const categories = await ProductModel.getAllCategories();
      res.json(categories);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create a new category
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createCategory(req, res, next) {
    try {
      const categoryData = req.body;
      
      // Validate required fields
      if (!categoryData.name) {
        return res.status(400).json({ message: 'Category name is required' });
      }
      
      const category = await ProductModel.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update a category
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const categoryData = req.body;
      
      // Validate required fields
      if (!categoryData.name) {
        return res.status(400).json({ message: 'Category name is required' });
      }
      
      const category = await ProductModel.updateCategory(id, categoryData);
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      res.json(category);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a category
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;
      const result = await ProductModel.deleteCategory(id);
      
      if (!result) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = ProductController; 