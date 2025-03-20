const express = require('express');
const ProductController = require('../controllers/productController');

const router = express.Router();

/**
 * @route   GET /api/products
 * @desc    Get all products
 * @access  Public
 */
router.get('/', ProductController.getAllProducts);

/**
 * @route   GET /api/products/search
 * @desc    Search products
 * @access  Public
 */
router.get('/search', ProductController.searchProducts);

/**
 * @route   GET /api/products/low-stock
 * @desc    Get low stock products
 * @access  Public
 */
router.get('/low-stock', ProductController.getLowStockProducts);

/**
 * @route   GET /api/products/categories
 * @desc    Get all categories
 * @access  Public
 */
router.get('/categories', ProductController.getAllCategories);

/**
 * @route   POST /api/products/categories
 * @desc    Create a new category
 * @access  Public
 */
router.post('/categories', ProductController.createCategory);

/**
 * @route   PUT /api/products/categories/:id
 * @desc    Update a category
 * @access  Public
 */
router.put('/categories/:id', ProductController.updateCategory);

/**
 * @route   DELETE /api/products/categories/:id
 * @desc    Delete a category
 * @access  Public
 */
router.delete('/categories/:id', ProductController.deleteCategory);

/**
 * @route   GET /api/products/sku/:sku
 * @desc    Get product by SKU
 * @access  Public
 */
router.get('/sku/:sku', ProductController.getProductBySku);

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
router.get('/:id', ProductController.getProductById);

/**
 * @route   GET /api/products/:id/batches
 * @desc    Get product batches
 * @access  Public
 */
router.get('/:id/batches', ProductController.getProductBatches);

/**
 * @route   POST /api/products/:id/batches
 * @desc    Add product batch
 * @access  Public
 */
router.post('/:id/batches', ProductController.addProductBatch);

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Public
 */
router.post('/', ProductController.createProduct);

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product
 * @access  Public
 */
router.put('/:id', ProductController.updateProduct);

/**
 * @route   PATCH /api/products/:id/stock
 * @desc    Update product stock
 * @access  Public
 */
router.patch('/:id/stock', ProductController.updateStock);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product
 * @access  Public
 */
router.delete('/:id', ProductController.deleteProduct);

module.exports = router; 