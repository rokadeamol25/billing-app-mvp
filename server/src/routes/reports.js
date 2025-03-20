const express = require('express');
const ReportController = require('../controllers/reportController');

const router = express.Router();

/**
 * @route   GET /api/reports/sales
 * @desc    Get sales report
 * @access  Public
 */
router.get('/sales', ReportController.getSalesReport);
router.get('/sales/export', ReportController.exportSalesReport);

/**
 * @route   GET /api/reports/purchases
 * @desc    Get purchases report
 * @access  Public
 */
router.get('/purchases', ReportController.getPurchaseReport);
router.get('/purchases/export', ReportController.exportPurchaseReport);

/**
 * @route   GET /api/reports/profit-loss
 * @desc    Get profit and loss report
 * @access  Public
 */
router.get('/profit-loss', ReportController.getProfitLossReport);
router.get('/profit-loss/export', ReportController.exportProfitLossReport);

/**
 * @route   GET /api/reports/inventory
 * @desc    Get inventory report
 * @access  Public
 */
router.get('/inventory', ReportController.getInventoryReport);
router.get('/inventory/export', ReportController.exportInventoryReport);

/**
 * @route   GET /api/reports/tax
 * @desc    Get tax report
 * @access  Public
 */
router.get('/tax', ReportController.getTaxReport);
router.get('/tax/export', ReportController.exportTaxReport);

/**
 * @route   GET /api/reports/receivables
 * @desc    Get accounts receivable report
 * @access  Public
 */
router.get('/receivables', ReportController.getAccountsReceivableReport);
router.get('/receivables/export', ReportController.exportAccountsReceivableReport);

/**
 * @route   GET /api/reports/payables
 * @desc    Get accounts payable report
 * @access  Public
 */
router.get('/payables', ReportController.getAccountsPayableReport);
router.get('/payables/export', ReportController.exportAccountsPayableReport);

module.exports = router; 