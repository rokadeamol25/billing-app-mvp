const PurchaseModel = require('../models/purchaseModel');
const SupplierModel = require('../models/supplierModel');

/**
 * Purchase Controller
 * Handles HTTP requests related to purchases
 */
const PurchaseController = {
  /**
   * Get all purchases
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAllPurchases(req, res, next) {
    try {
      const purchases = await PurchaseModel.getAllPurchases();
      res.json(purchases);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get purchase by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getPurchaseById(req, res, next) {
    try {
      const { id } = req.params;
      const purchase = await PurchaseModel.getPurchaseById(id);
      
      if (!purchase) {
        return res.status(404).json({ message: 'Purchase not found' });
      }
      
      res.json(purchase);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create a new purchase
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createPurchase(req, res, next) {
    try {
      const { purchaseData, items } = req.body;
      
      // Validate required fields
      if (!purchaseData.supplier_id || !items || !items.length) {
        return res.status(400).json({ 
          message: 'Supplier ID and at least one item are required' 
        });
      }
      
      // Validate items
      for (const item of items) {
        if (!item.product_id || !item.quantity || !item.unit_price || !item.total_price) {
          return res.status(400).json({ 
            message: 'Each item must have product_id, quantity, unit_price, and total_price' 
          });
        }
      }
      
      // Check if supplier exists
      const supplier = await SupplierModel.getSupplierById(purchaseData.supplier_id);
      if (!supplier) {
        return res.status(404).json({ message: 'Supplier not found' });
      }
      
      // Set due date based on supplier payment terms if not provided
      if (!purchaseData.due_date && supplier.payment_terms) {
        const purchaseDate = purchaseData.purchase_date ? new Date(purchaseData.purchase_date) : new Date();
        const dueDate = new Date(purchaseDate);
        dueDate.setDate(dueDate.getDate() + supplier.payment_terms);
        purchaseData.due_date = dueDate;
      }
      
      const purchase = await PurchaseModel.createPurchase(purchaseData, items);
      res.status(201).json(purchase);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update purchase payment status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updatePaymentStatus(req, res, next) {
    try {
      console.log('req.body---',req.body);
      const { id } = req.params;
      const { payment_status } = req.body;
      
      if (!payment_status) {
        return res.status(400).json({ message: 'Payment status is required' });
      }
      
      if (!['Paid', 'Pending', 'Partial', 'Cancelled'].includes(payment_status)) {
        return res.status(400).json({ 
          message: 'Payment status must be one of: Paid, Pending, Partial, Cancelled' 
        });
      }
      
      const purchase = await PurchaseModel.updatePaymentStatus(id, payment_status);
      
      if (!purchase) {
        return res.status(404).json({ message: 'Purchase not found' });
      }
      
      res.json(purchase);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get purchases by date range
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getPurchasesByDateRange(req, res, next) {
    try {
      const { start_date, end_date } = req.query;
      
      if (!start_date || !end_date) {
        return res.status(400).json({ message: 'Start date and end date are required' });
      }
      
      const purchases = await PurchaseModel.getPurchasesByDateRange(new Date(start_date), new Date(end_date));
      res.json(purchases);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get unpaid purchases
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getUnpaidPurchases(req, res, next) {
    try {
      const purchases = await PurchaseModel.getUnpaidPurchases();
      res.json(purchases);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get purchases by supplier
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getPurchasesBySupplier(req, res, next) {
    try {
      const { supplier_id } = req.params;
      
      // Check if supplier exists
      const supplier = await SupplierModel.getSupplierById(supplier_id);
      if (!supplier) {
        return res.status(404).json({ message: 'Supplier not found' });
      }
      
      const purchases = await PurchaseModel.getPurchasesBySupplier(supplier_id);
      res.json(purchases);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a purchase and its related records
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deletePurchase(req, res, next) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ message: 'Purchase ID is required' });
      }
      
      await PurchaseModel.deletePurchase(id);
      
      res.json({
        success: true,
        message: 'Purchase deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get purchase statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getPurchaseStatistics(req, res, next) {
    try {
      const { period } = req.query;
      
      if (!period || !['daily', 'weekly', 'monthly'].includes(period)) {
        return res.status(400).json({ 
          message: 'Valid period is required (daily, weekly, or monthly)' 
        });
      }
      
      const statistics = await PurchaseModel.getPurchaseStatistics(period);
      res.json(statistics);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = PurchaseController; 

  