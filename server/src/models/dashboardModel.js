const db = require('../config/db');
const moment = require('moment');

/**
 * Dashboard Model
 * Handles database operations for dashboard data
 */
const DashboardModel = {
  /**
   * Get dashboard summary data
   * @returns {Promise<Object>} Dashboard summary data
   */
  async getDashboardSummary() {
    try {
      // Get today's date and start of current month
      const today = moment().format('YYYY-MM-DD');
      const startOfMonth = moment().startOf('month').format('YYYY-MM-DD');
      const startOfLastMonth = moment().subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
      const endOfLastMonth = moment().subtract(1, 'month').endOf('month').format('YYYY-MM-DD');
      
      // Get sales summary
      const salesSummaryResult = await db.query(
        `SELECT 
          COUNT(*) as total_invoices,
          SUM(total_amount) as total_revenue
        FROM invoices
        WHERE invoice_date >= $1
        AND payment_status != 'Cancelled'`,
        [startOfMonth]
      );
      
      // Get today's sales
      const todaySalesResult = await db.query(
        `SELECT 
          COUNT(*) as invoice_count,
          SUM(total_amount) as total_amount
        FROM invoices
        WHERE DATE(invoice_date) = $1
        AND payment_status != 'Cancelled'`,
        [today]
      );
      
      // Get last month's sales for comparison
      const lastMonthSalesResult = await db.query(
        `SELECT 
          COUNT(*) as total_invoices,
          SUM(total_amount) as total_revenue
        FROM invoices
        WHERE invoice_date BETWEEN $1 AND $2
        AND payment_status != 'Cancelled'`,
        [startOfLastMonth, endOfLastMonth]
      );
      
      // Get purchase summary
      const purchaseSummaryResult = await db.query(
        `SELECT 
          COUNT(*) as total_purchases,
          SUM(total_amount) as total_expenses
        FROM purchases
        WHERE purchase_date >= $1
        AND payment_status != 'Cancelled'`,
        [startOfMonth]
      );
      
      // Get inventory summary
      const inventorySummaryResult = await db.query(
        `SELECT 
          COUNT(*) as total_products,
          SUM(stock_quantity) as total_items_in_stock,
          SUM(stock_quantity * cost_price) as total_inventory_value,
          COUNT(CASE WHEN stock_quantity <= low_stock_threshold THEN 1 END) as low_stock_count
        FROM products
        WHERE is_active = true`
      );
      
      // Get accounts receivable summary
      const receivableSummaryResult = await db.query(
        `SELECT 
          COUNT(*) as total_unpaid_invoices,
          SUM(total_amount) as total_receivable_amount
        FROM invoices
        WHERE payment_status IN ('Pending', 'Partial')`
      );
      
      // Get accounts payable summary
      const payableSummaryResult = await db.query(
        `SELECT 
          COUNT(*) as total_unpaid_purchases,
          SUM(total_amount) as total_payable_amount
        FROM purchases
        WHERE payment_status IN ('Pending', 'Partial')`
      );
      
      // Calculate month-over-month growth
      const currentMonthRevenue = parseFloat(salesSummaryResult.rows[0].total_revenue || 0);
      const lastMonthRevenue = parseFloat(lastMonthSalesResult.rows[0].total_revenue || 0);
      const revenueGrowth = lastMonthRevenue > 0 
        ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0;
      
      return {
        sales: {
          currentMonth: {
            invoiceCount: parseInt(salesSummaryResult.rows[0].total_invoices || 0),
            revenue: currentMonthRevenue
          },
          today: {
            invoiceCount: parseInt(todaySalesResult.rows[0].invoice_count || 0),
            revenue: parseFloat(todaySalesResult.rows[0].total_amount || 0)
          },
          lastMonth: {
            invoiceCount: parseInt(lastMonthSalesResult.rows[0].total_invoices || 0),
            revenue: lastMonthRevenue
          },
          growth: revenueGrowth
        },
        purchases: {
          currentMonth: {
            purchaseCount: parseInt(purchaseSummaryResult.rows[0].total_purchases || 0),
            expenses: parseFloat(purchaseSummaryResult.rows[0].total_expenses || 0)
          }
        },
        inventory: {
          productCount: parseInt(inventorySummaryResult.rows[0].total_products || 0),
          totalStock: parseInt(inventorySummaryResult.rows[0].total_items_in_stock || 0),
          inventoryValue: parseFloat(inventorySummaryResult.rows[0].total_inventory_value || 0),
          lowStockCount: parseInt(inventorySummaryResult.rows[0].low_stock_count || 0)
        },
        financials: {
          receivables: {
            invoiceCount: parseInt(receivableSummaryResult.rows[0].total_unpaid_invoices || 0),
            amount: parseFloat(receivableSummaryResult.rows[0].total_receivable_amount || 0)
          },
          payables: {
            purchaseCount: parseInt(payableSummaryResult.rows[0].total_unpaid_purchases || 0),
            amount: parseFloat(payableSummaryResult.rows[0].total_payable_amount || 0)
          }
        }
      };
    } catch (error) {
      console.error('Error getting dashboard summary:', error);
      throw error;
    }
  },

  /**
   * Get recent sales data
   * @param {number} limit - Number of records to return
   * @returns {Promise<Array>} Recent sales data
   */
  async getRecentSales(limit = 5) {
    try {
      const result = await db.query(
        `SELECT i.*, c.name as customer_name 
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        ORDER BY i.invoice_date DESC
        LIMIT $1`,
        [limit]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting recent sales:', error);
      throw error;
    }
  },

  /**
   * Get recent purchases data
   * @param {number} limit - Number of records to return
   * @returns {Promise<Array>} Recent purchases data
   */
  async getRecentPurchases(limit = 5) {
    try {
      const result = await db.query(
        `SELECT p.*, s.name as supplier_name 
        FROM purchases p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        ORDER BY p.purchase_date DESC
        LIMIT $1`,
        [limit]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting recent purchases:', error);
      throw error;
    }
  },

  /**
   * Get low stock products
   * @param {number} limit - Number of records to return
   * @returns {Promise<Array>} Low stock products data
   */
  async getLowStockProducts(limit = 5) {
    try {
      const result = await db.query(
        `SELECT p.*, c.name as category_name,
        (p.low_stock_threshold - p.stock_quantity) as shortage
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.stock_quantity <= p.low_stock_threshold
        AND p.is_active = true
        ORDER BY shortage DESC
        LIMIT $1`,
        [limit]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting low stock products:', error);
      throw error;
    }
  },

  /**
   * Get sales trend data
   * @param {number} days - Number of days to include
   * @returns {Promise<Array>} Sales trend data
   */
  async getSalesTrend(days = 7) {
    try {
      const startDate = moment().subtract(days - 1, 'days').format('YYYY-MM-DD');
      
      const result = await db.query(
        `SELECT 
          DATE(invoice_date) as date,
          COUNT(*) as invoice_count,
          SUM(total_amount) as total_amount
        FROM invoices
        WHERE invoice_date >= $1
        AND payment_status != 'Cancelled'
        GROUP BY DATE(invoice_date)
        ORDER BY date ASC`,
        [startDate]
      );
      
      // Fill in missing dates with zero values
      const salesByDay = {};
      
      // Initialize all days with zero values
      for (let i = 0; i < days; i++) {
        const date = moment().subtract(days - 1 - i, 'days').format('YYYY-MM-DD');
        salesByDay[date] = {
          date,
          invoice_count: 0,
          total_amount: 0
        };
      }
      
      // Fill in actual values
      result.rows.forEach(row => {
        const date = moment(row.date).format('YYYY-MM-DD');
        salesByDay[date] = {
          date,
          invoice_count: parseInt(row.invoice_count),
          total_amount: parseFloat(row.total_amount)
        };
      });
      
      return Object.values(salesByDay);
    } catch (error) {
      console.error('Error getting sales trend:', error);
      throw error;
    }
  },

  /**
   * Get top selling products
   * @param {number} limit - Number of records to return
   * @returns {Promise<Array>} Top selling products data
   */
  async getTopSellingProducts(limit = 5) {
    try {
      const result = await db.query(
        `SELECT 
          p.id,
          p.name,
          p.sku,
          c.name as category_name,
          SUM(ii.quantity) as total_quantity,
          SUM(ii.total_price) as total_revenue
        FROM invoice_items ii
        JOIN products p ON ii.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        JOIN invoices i ON ii.invoice_id = i.id
        WHERE i.invoice_date >= $1
        AND i.payment_status != 'Cancelled'
        GROUP BY p.id, p.name, p.sku, c.name
        ORDER BY total_revenue DESC
        LIMIT $2`,
        [moment().subtract(30, 'days').format('YYYY-MM-DD'), limit]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting top selling products:', error);
      throw error;
    }
  },

  /**
   * Get payment method distribution
   * @returns {Promise<Array>} Payment method distribution data
   */
  async getPaymentMethodDistribution() {
    try {
      const result = await db.query(
        `SELECT 
          payment_method,
          COUNT(*) as invoice_count,
          SUM(total_amount) as total_amount
        FROM invoices
        WHERE invoice_date >= $1
        AND payment_status != 'Cancelled'
        GROUP BY payment_method
        ORDER BY total_amount DESC`,
        [moment().subtract(30, 'days').format('YYYY-MM-DD')]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting payment method distribution:', error);
      throw error;
    }
  }
};

module.exports = DashboardModel; 