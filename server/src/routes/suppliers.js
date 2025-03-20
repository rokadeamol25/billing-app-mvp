const express = require('express');
const SupplierController = require('../controllers/supplierController');

const router = express.Router();

/**
 * @route   GET /api/suppliers
 * @desc    Get all suppliers
 * @access  Public
 */
router.get('/', SupplierController.getAllSuppliers);

/**
 * @route   GET /api/suppliers/search
 * @desc    Search suppliers
 * @access  Public
 */
router.get('/search', SupplierController.searchSuppliers);

/**
 * @route   GET /api/suppliers/pending-payments
 * @desc    Get suppliers with pending payments
 * @access  Public
 */
router.get('/pending-payments', SupplierController.getSuppliersWithPendingPayments);

/**
 * @route   GET /api/suppliers/:id
 * @desc    Get supplier by ID
 * @access  Public
 */
router.get('/:id', SupplierController.getSupplierById);

/**
 * @route   POST /api/suppliers
 * @desc    Create a new supplier
 * @access  Public
 */
router.post('/', SupplierController.createSupplier);

/**
 * @route   PUT /api/suppliers/:id
 * @desc    Update a supplier
 * @access  Public
 */
router.put('/:id', SupplierController.updateSupplier);

/**
 * @route   DELETE /api/suppliers/:id
 * @desc    Delete a supplier
 * @access  Public
 */
router.delete('/:id', SupplierController.deleteSupplier);

module.exports = router; 