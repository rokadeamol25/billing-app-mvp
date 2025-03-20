const express = require('express');
const PurchaseController = require('../controllers/purchaseController');

const router = express.Router();

/**
 * @route   GET /api/purchases
 * @desc    Get all purchases
 * @access  Public
 */
router.get('/', PurchaseController.getAllPurchases);

/**
 * @route   GET /api/purchases/unpaid
 * @desc    Get unpaid purchases
 * @access  Public
 */
router.get('/unpaid', PurchaseController.getUnpaidPurchases);

/**
 * @route   GET /api/purchases/date-range
 * @desc    Get purchases by date range
 * @access  Public
 */
router.get('/date-range', PurchaseController.getPurchasesByDateRange);

/**
 * @route   GET /api/purchases/statistics
 * @desc    Get purchase statistics
 * @access  Public
 */
router.get('/statistics', PurchaseController.getPurchaseStatistics);

/**
 * @route   GET /api/purchases/supplier/:supplier_id
 * @desc    Get purchases by supplier
 * @access  Public
 */
router.get('/supplier/:supplier_id', PurchaseController.getPurchasesBySupplier);

/**
 * @route   GET /api/purchases/:id
 * @desc    Get purchase by ID
 * @access  Public
 */
router.get('/:id', PurchaseController.getPurchaseById);

/**
 * @route   POST /api/purchases
 * @desc    Create a new purchase
 * @access  Public
 */
router.post('/', PurchaseController.createPurchase);

/**
 * @route   PATCH /api/purchases/:id/payment
 * @desc    Update purchase payment status
 * @access  Public
 */
router.patch('/:id/payment', PurchaseController.updatePaymentStatus);

module.exports = router; 