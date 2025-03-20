const DashboardModel = require('../models/dashboardModel');

/**
 * Dashboard Controller
 * Handles HTTP requests related to dashboard data
 */
const DashboardController = {
  /**
   * Get dashboard summary
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getDashboardSummary(req, res, next) {
    try {
      // Get dashboard summary data
      const summary = await DashboardModel.getDashboardSummary();
      
      // Get recent sales
      const recentInvoices = await DashboardModel.getRecentSales(5);
      
      // Get recent purchases
      const recentPurchases = await DashboardModel.getRecentPurchases(5);
      
      // Get low stock products
      const lowStockProducts = await DashboardModel.getLowStockProducts(5);
      
      // Get top selling products
      const topSellingProducts = await DashboardModel.getTopSellingProducts(5);
      
      // Combine all data
      const dashboardData = {
        ...summary,
        recentInvoices,
        recentPurchases,
        lowStockProducts,
        topSellingProducts,
        // Add total counts for dashboard cards
        totalSales: summary.sales?.currentMonth?.revenue || 0,
        totalPurchases: summary.purchases?.currentMonth?.expenses || 0,
        totalCustomers: summary.customers?.total || 0,
        totalProducts: summary.inventory?.productCount || 0
      };
      
      res.json(dashboardData);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get recent sales
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getRecentSales(req, res, next) {
    try {
      const { limit } = req.query;
      const sales = await DashboardModel.getRecentSales(limit ? parseInt(limit) : 5);
      res.json(sales);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get recent purchases
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getRecentPurchases(req, res, next) {
    try {
      const { limit } = req.query;
      const purchases = await DashboardModel.getRecentPurchases(limit ? parseInt(limit) : 5);
      res.json(purchases);
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
      const { limit } = req.query;
      const products = await DashboardModel.getLowStockProducts(limit ? parseInt(limit) : 5);
      res.json(products);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get sales trend
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getSalesTrend(req, res, next) {
    try {
      const { days } = req.query;
      const trend = await DashboardModel.getSalesTrend(days ? parseInt(days) : 7);
      res.json(trend);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get top selling products
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getTopSellingProducts(req, res, next) {
    try {
      const { limit } = req.query;
      const products = await DashboardModel.getTopSellingProducts(limit ? parseInt(limit) : 5);
      res.json(products);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get payment method distribution
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getPaymentMethodDistribution(req, res, next) {
    try {
      const distribution = await DashboardModel.getPaymentMethodDistribution();
      res.json(distribution);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = DashboardController; 