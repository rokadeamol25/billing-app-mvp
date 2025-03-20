const CustomerModel = require('../models/customerModel');

/**
 * Customer Controller
 * Handles HTTP requests related to customers
 */
const CustomerController = {
  /**
   * Get all customers
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAllCustomers(req, res, next) {
    try {
      const customers = await CustomerModel.getAllCustomers();
      res.json(customers);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get customer by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getCustomerById(req, res, next) {
    try {
      const { id } = req.params;
      const customer = await CustomerModel.getCustomerById(id);
      
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      res.json(customer);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create a new customer
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createCustomer(req, res, next) {
    try {
      const customerData = req.body;
      
      // Validate required fields
      if (!customerData.name) {
        return res.status(400).json({ message: 'Customer name is required' });
      }
      
      const customer = await CustomerModel.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update a customer
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateCustomer(req, res, next) {
    try {
      const { id } = req.params;
      const customerData = req.body;
      
      // Validate required fields
      if (!customerData.name) {
        return res.status(400).json({ message: 'Customer name is required' });
      }
      
      const customer = await CustomerModel.updateCustomer(id, customerData);
      
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      res.json(customer);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a customer
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteCustomer(req, res, next) {
    try {
      const { id } = req.params;
      
      try {
        const deleted = await CustomerModel.deleteCustomer(id);
        
        if (!deleted) {
          return res.status(404).json({ message: 'Customer not found' });
        }
        
        res.json({ message: 'Customer deleted successfully' });
      } catch (error) {
        if (error.message.includes('Cannot delete customer with existing invoices')) {
          return res.status(400).json({ message: error.message });
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  },

  /**
   * Search customers
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async searchCustomers(req, res, next) {
    try {
      const { q } = req.query;
      
      if (!q) {
        return res.status(400).json({ message: 'Search term is required' });
      }
      
      const customers = await CustomerModel.searchCustomers(q);
      res.json(customers);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = CustomerController; 