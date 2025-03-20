const express = require('express');
const CustomerController = require('../controllers/customerController');

const router = express.Router();

/**
 * @route   GET /api/customers
 * @desc    Get all customers
 * @access  Public
 */
router.get('/', CustomerController.getAllCustomers);

/**
 * @route   GET /api/customers/search
 * @desc    Search customers
 * @access  Public
 */
router.get('/search', CustomerController.searchCustomers);

/**
 * @route   GET /api/customers/:id
 * @desc    Get customer by ID
 * @access  Public
 */
router.get('/:id', CustomerController.getCustomerById);

/**
 * @route   POST /api/customers
 * @desc    Create a new customer
 * @access  Public
 */
router.post('/', CustomerController.createCustomer);

/**
 * @route   PUT /api/customers/:id
 * @desc    Update a customer
 * @access  Public
 */
router.put('/:id', CustomerController.updateCustomer);

/**
 * @route   DELETE /api/customers/:id
 * @desc    Delete a customer
 * @access  Public
 */
router.delete('/:id', CustomerController.deleteCustomer);

module.exports = router; 