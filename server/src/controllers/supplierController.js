const SupplierModel = require('../models/supplierModel');

/**
 * Supplier Controller
 * Handles HTTP requests related to suppliers
 */
const SupplierController = {
  /**
   * Get all suppliers
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAllSuppliers(req, res, next) {
    try {
      const suppliers = await SupplierModel.getAllSuppliers();
      res.json(suppliers);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get supplier by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getSupplierById(req, res, next) {
    try {
      const { id } = req.params;
      const supplier = await SupplierModel.getSupplierById(id);
      
      if (!supplier) {
        return res.status(404).json({ message: 'Supplier not found' });
      }
      
      res.json(supplier);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create a new supplier
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createSupplier(req, res, next) {
    try {
      const supplierData = req.body;
      
      // Validate required fields
      if (!supplierData.name) {
        return res.status(400).json({ message: 'Supplier name is required' });
      }
      
      const supplier = await SupplierModel.createSupplier(supplierData);
      res.status(201).json(supplier);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update a supplier
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateSupplier(req, res, next) {
    try {
      const { id } = req.params;
      const supplierData = req.body;
      
      // Validate required fields
      if (!supplierData.name) {
        return res.status(400).json({ message: 'Supplier name is required' });
      }
      
      const supplier = await SupplierModel.updateSupplier(id, supplierData);
      
      if (!supplier) {
        return res.status(404).json({ message: 'Supplier not found' });
      }
      
      res.json(supplier);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a supplier
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteSupplier(req, res, next) {
    try {
      const { id } = req.params;
      
      try {
        const deleted = await SupplierModel.deleteSupplier(id);
        
        if (!deleted) {
          return res.status(404).json({ message: 'Supplier not found' });
        }
        
        res.json({ message: 'Supplier deleted successfully' });
      } catch (error) {
        if (error.message.includes('Cannot delete supplier with existing purchases')) {
          return res.status(400).json({ message: error.message });
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  },

  /**
   * Search suppliers
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async searchSuppliers(req, res, next) {
    try {
      const { q } = req.query;
      
      if (!q) {
        return res.status(400).json({ message: 'Search term is required' });
      }
      
      const suppliers = await SupplierModel.searchSuppliers(q);
      res.json(suppliers);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get suppliers with pending payments
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getSuppliersWithPendingPayments(req, res, next) {
    try {
      const suppliers = await SupplierModel.getSuppliersWithPendingPayments();
      res.json(suppliers);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = SupplierController; 