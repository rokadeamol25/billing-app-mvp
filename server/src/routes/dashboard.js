const express = require('express');
const DashboardController = require('../controllers/dashboardController');

const router = express.Router();

/**
 * @route   GET /api/dashboard/summary
 * @desc    Get dashboard summary
 * @access  Public
 */
router.get('/summary', DashboardController.getDashboardSummary);

/**
 * @route   GET /api/dashboard/recent-sales
 * @desc    Get recent sales
 * @access  Public
 */
router.get('/recent-sales', DashboardController.getRecentSales);

/**
 * @route   GET /api/dashboard/recent-purchases
 * @desc    Get recent purchases
 * @access  Public
 */
router.get('/recent-purchases', DashboardController.getRecentPurchases);

/**
 * @route   GET /api/dashboard/low-stock
 * @desc    Get low stock products
 * @access  Public
 */
router.get('/low-stock', DashboardController.getLowStockProducts);

/**
 * @route   GET /api/dashboard/sales-trend
 * @desc    Get sales trend
 * @access  Public
 */
router.get('/sales-trend', DashboardController.getSalesTrend);

/**
 * @route   GET /api/dashboard/top-products
 * @desc    Get top selling products
 * @access  Public
 */
router.get('/top-products', DashboardController.getTopSellingProducts);

/**
 * @route   GET /api/dashboard/payment-methods
 * @desc    Get payment method distribution
 * @access  Public
 */
router.get('/payment-methods', DashboardController.getPaymentMethodDistribution);

module.exports = router; 