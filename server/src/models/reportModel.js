const db = require('../config/db');
const moment = require('moment');

/**
 * Report Model
 * Handles database operations for generating reports
 */
const ReportModel = {
  /**
   * Get sales report by date range based on received payments
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} customerId - Optional customer ID filter
   * @param {string} productId - Optional product ID filter
   * @returns {Promise<Object>} Sales report data
   */
  async getSalesReport(startDate, endDate, customerId = null, productId = null) {
    try {
      // Get invoices with payment information
      const invoicesQuery = `
        SELECT 
          i.id,
          i.invoice_number,
          i.invoice_date as date,
          i.total_amount,
          i.payment_status,
          c.name as customer_name,
          COALESCE(SUM(CASE WHEN p.payment_type = 'incoming' THEN p.amount ELSE 0 END), 0) as amount_paid
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        LEFT JOIN payments p ON p.reference_id = i.id AND p.reference_type = 'invoice'
        WHERE i.invoice_date BETWEEN $1 AND $2
        ${customerId ? 'AND i.customer_id = $3' : ''}
        GROUP BY i.id, i.invoice_number, i.invoice_date, i.total_amount, i.payment_status, c.name
        ORDER BY i.invoice_date DESC`;

      const params = [
        moment(startDate).format('YYYY-MM-DD'),
        moment(endDate).format('YYYY-MM-DD')
      ];
      if (customerId) params.push(customerId);

      const invoicesResult = await db.query(invoicesQuery, params);
      
      // Process invoices and calculate totals
      const invoices = invoicesResult.rows.map(row => ({
        id: row.id,
        invoice_number: row.invoice_number,
        date: row.date,
        customer_name: row.customer_name,
        total_amount: parseFloat(row.total_amount),
        amount_paid: parseFloat(row.amount_paid),
        amount_outstanding: parseFloat(row.total_amount) - parseFloat(row.amount_paid),
        payment_status: row.payment_status
      }));

      // Calculate summary
      const summary = {
        total_invoiced: Number(invoices.reduce((sum, inv) => sum + inv.total_amount, 0).toFixed(2)),
        total_received: Number(invoices.reduce((sum, inv) => sum + inv.amount_paid, 0).toFixed(2)),
        total_outstanding: Number(invoices.reduce((sum, inv) => sum + inv.amount_outstanding, 0).toFixed(2)),
        total_invoices: invoices.length
      };

      // Get sales by day
      const salesByDayQuery = `
        SELECT 
          DATE(i.invoice_date) as date,
          COUNT(*) as count,
          SUM(i.total_amount) as total_amount
        FROM invoices i
        WHERE i.invoice_date BETWEEN $1 AND $2
        ${customerId ? 'AND i.customer_id = $3' : ''}
        GROUP BY DATE(i.invoice_date)
        ORDER BY date`;

      const salesByDayResult = await db.query(salesByDayQuery, params);

      // Get top products
      const topProductsQuery = `
        SELECT 
          p.id,
          p.name as product_name,
          SUM(ii.quantity) as quantity,
          SUM(ii.total_price) as total_amount
        FROM invoice_items ii
        JOIN products p ON ii.product_id = p.id
        JOIN invoices i ON ii.invoice_id = i.id
        WHERE i.invoice_date BETWEEN $1 AND $2
        ${customerId ? 'AND i.customer_id = $3' : ''}
        GROUP BY p.id, p.name
        ORDER BY total_amount DESC
        LIMIT 5`;

      const topProductsResult = await db.query(topProductsQuery, params);

      // Get top customers
      const topCustomersQuery = `
        SELECT 
          c.id,
          c.name as customer_name,
          COUNT(DISTINCT i.id) as total_invoices,
          SUM(i.total_amount) as total_amount
        FROM invoices i
        JOIN customers c ON i.customer_id = c.id
        WHERE i.invoice_date BETWEEN $1 AND $2
        GROUP BY c.id, c.name
        ORDER BY total_amount DESC
        LIMIT 5`;

      const topCustomersResult = await db.query(topCustomersQuery, [startDate, endDate]);

      // Ensure all data is included in the response
      const response = {
        summary,
        invoices,
        byDay: salesByDayResult.rows.map(row => ({
          ...row,
          total_amount: parseFloat(row.total_amount)
        })),
        topProducts: topProductsResult.rows.map(row => ({
          ...row,
          quantity: parseInt(row.quantity),
          total_amount: parseFloat(row.total_amount)
        })),
        topCustomers: topCustomersResult.rows.map(row => ({
          ...row,
          total_invoices: parseInt(row.total_invoices),
          total_amount: parseFloat(row.total_amount)
        }))
      };

      console.log('Sales Report Response:', response); // Add logging
      return response;

    } catch (error) {
      console.error('Error in getSalesReport:', error.message);
      throw new Error(`Failed to generate sales report: ${error.message}`);
    }
  },

  /**
   * Get profit and loss report by date range based on received payments
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Profit and loss report data
   */
  async getProfitLossReport(startDate, endDate) {
    try {
      const formattedStartDate = moment(startDate).format('YYYY-MM-DD');
      const formattedEndDate = moment(endDate).format('YYYY-MM-DD');
      
      // Get revenue from all invoices in the period (regardless of payment status)
      const revenueResult = await db.query(
        `SELECT 
          SUM(total_amount) as total_revenue,
          SUM(tax_amount) as total_tax_collected,
          COUNT(*) as invoice_count
        FROM invoices
        WHERE invoice_date BETWEEN $1 AND $2
        AND payment_status != 'Cancelled'`,
        [formattedStartDate, formattedEndDate]
      );
      
      const revenue = revenueResult.rows[0];
      
      // Get COGS from all purchases in the period (regardless of payment status)
      const cogsResult = await db.query(
        `SELECT 
          SUM(total_amount) as total_cogs,
          SUM(tax_amount) as total_tax_paid,
          COUNT(*) as purchase_count
        FROM purchases
        WHERE purchase_date BETWEEN $1 AND $2
        AND payment_status != 'Cancelled'`,
        [formattedStartDate, formattedEndDate]
      );
      
      const cogs = cogsResult.rows[0];
      
      // Calculate gross profit
      const grossProfit = parseFloat(revenue.total_revenue || 0) - parseFloat(cogs.total_cogs || 0);
      
      // Get profit by product category
      const profitByCategoryResult = await db.query(
        `SELECT 
          c.name as category_name,
          SUM(ii.total_price) as revenue,
          SUM(ii.quantity * p.cost_price) as cost,
          SUM(ii.total_price) - SUM(ii.quantity * p.cost_price) as profit
        FROM invoices i
        JOIN invoice_items ii ON i.id = ii.invoice_id
        JOIN products p ON ii.product_id = p.id
        JOIN categories c ON p.category_id = c.id
        WHERE i.invoice_date BETWEEN $1 AND $2
        AND i.payment_status != 'Cancelled'
        GROUP BY c.name
        ORDER BY profit DESC`,
        [formattedStartDate, formattedEndDate]
      );
      
      // Fix the monthly breakdown query
      const monthlyBreakdownResult = await db.query(
        `WITH monthly_data AS (
          SELECT 
            TO_CHAR(invoice_date, 'YYYY-MM') as month,
            SUM(total_amount) as revenue
          FROM invoices i
          WHERE invoice_date BETWEEN $1 AND $2
          AND payment_status != 'Cancelled'
          GROUP BY TO_CHAR(invoice_date, 'YYYY-MM')
        ),
        monthly_purchases AS (
          SELECT 
            TO_CHAR(purchase_date, 'YYYY-MM') as month,
            SUM(total_amount) as cogs
          FROM purchases
          WHERE purchase_date BETWEEN $1 AND $2
          AND payment_status != 'Cancelled'
          GROUP BY TO_CHAR(purchase_date, 'YYYY-MM')
        )
        SELECT 
          md.month,
          md.revenue,
          COALESCE(mp.cogs, 0) as cogs,
          md.revenue - COALESCE(mp.cogs, 0) as gross_profit
        FROM monthly_data md
        LEFT JOIN monthly_purchases mp ON mp.month = md.month
        ORDER BY md.month ASC`,
        [formattedStartDate, formattedEndDate]
      );

      // Format the response
      const response = {
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        summary: {
          revenue: {
            total_revenue: parseFloat(revenue.total_revenue || 0),
            total_tax_collected: parseFloat(revenue.total_tax_collected || 0),
            invoice_count: parseInt(revenue.invoice_count || 0)
          },
          cogs: {
            total_cogs: parseFloat(cogs.total_cogs || 0),
            total_tax_paid: parseFloat(cogs.total_tax_paid || 0),
            purchase_count: parseInt(cogs.purchase_count || 0)
          },
          gross_profit: grossProfit,
          profit_margin: revenue.total_revenue ? (grossProfit / parseFloat(revenue.total_revenue) * 100) : 0
        },
        profitByCategory: profitByCategoryResult.rows.map(row => ({
          category_name: row.category_name,
          revenue: parseFloat(row.revenue || 0),
          cost: parseFloat(row.cost || 0),
          profit: parseFloat(row.profit || 0)
        })),
        monthlyBreakdown: monthlyBreakdownResult.rows.map(row => ({
          month: row.month,
          revenue: parseFloat(row.revenue || 0),
          cogs: parseFloat(row.cogs || 0),
          gross_profit: parseFloat(row.gross_profit || 0)
        }))
      };

      console.log('P&L Report Response:', response);
      return response;
    } catch (error) {
      console.error('Error generating profit and loss report:', error);
      throw error;
    }
  },

  /**
   * Get inventory report
   * @returns {Promise<Object>} Inventory report data
   */
  async getInventoryReport() {
    try {
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
      
      const inventorySummary = inventorySummaryResult.rows[0];
      
      // Get inventory by category
      const inventoryByCategoryResult = await db.query(
        `SELECT 
          c.name as category_name,
          COUNT(p.id) as product_count,
          SUM(p.stock_quantity) as total_quantity,
          SUM(p.stock_quantity * p.cost_price) as total_value
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.is_active = true
        GROUP BY c.name
        ORDER BY total_value DESC`
      );
      
      // Get low stock products
      const lowStockProductsResult = await db.query(
        `SELECT 
          p.id,
          p.name,
          p.sku,
          p.stock_quantity,
          p.low_stock_threshold,
          c.name as category_name
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.stock_quantity <= p.low_stock_threshold
        AND p.is_active = true
        ORDER BY p.stock_quantity ASC`
      );
      
      // Get products with expiring batches
      const expiringBatchesResult = await db.query(
        `SELECT 
          p.id,
          p.name,
          p.sku,
          pb.batch_number,
          pb.expiry_date,
          pb.quantity
        FROM product_batches pb
        JOIN products p ON pb.product_id = p.id
        WHERE pb.expiry_date <= $1
        AND pb.quantity > 0
        ORDER BY pb.expiry_date ASC`,
        [moment().add(30, 'days').format('YYYY-MM-DD')] // Batches expiring in the next 30 days
      );
      
      
      
      return {
        inventorySummary,
        inventoryByCategory: inventoryByCategoryResult.rows,
        lowStockProducts: lowStockProductsResult.rows,
        expiringBatches: expiringBatchesResult.rows
      };
    } catch (error) {
      console.error('Error generating inventory report:', error);
      throw error;
    }
  },

  /**
   * Get tax report by date range and tax type
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} taxType - Tax type filter (all, gst, igst)
   * @returns {Promise<Object>} Tax report data
   */
  async getTaxReport(startDate, endDate, taxType = 'all') {
    try {
      // Format dates for query
      const formattedStartDate = moment(startDate).format('YYYY-MM-DD');
      const formattedEndDate = moment(endDate).format('YYYY-MM-DD');
      
      // Base query conditions for tax collected (from invoices)
      let taxCollectedConditions = `invoice_date BETWEEN $1 AND $2`;
      let taxCollectedParams = [formattedStartDate, formattedEndDate];
      let paramIndex = 3;
      
      // Add tax type filter if not 'all'
      if (taxType !== 'all') {
        taxCollectedConditions += ` AND ii.gst_rate = $${paramIndex}`;
        taxCollectedParams.push(parseFloat(taxType));
        paramIndex++;
      }
      
      // Get tax collected summary (from invoices)
      const taxCollectedQuery = `
        SELECT 
          ii.gst_rate as tax_rate,
          SUM(ii.tax_amount) as tax_collected,
          COUNT(DISTINCT i.id) as invoice_count
        FROM invoices i
        JOIN invoice_items ii ON i.id = ii.invoice_id
        WHERE i.${taxCollectedConditions}
        GROUP BY ii.gst_rate
        ORDER BY ii.gst_rate`;
      
      const taxCollectedResult = await db.query(taxCollectedQuery, taxCollectedParams);
      
      // Base query conditions for tax paid (from purchases)
      let taxPaidConditions = `purchase_date BETWEEN $1 AND $2`;
      let taxPaidParams = [formattedStartDate, formattedEndDate];
      paramIndex = 3;
      
      // Add tax type filter if not 'all'
      if (taxType !== 'all') {
        taxPaidConditions += ` AND pi.gst_rate = $${paramIndex}`;
        taxPaidParams.push(parseFloat(taxType));
      }
      
      // Get tax paid summary (from purchases)
      const taxPaidQuery = `
        SELECT 
          pi.gst_rate as tax_rate,
          SUM(pi.tax_amount) as tax_paid,
          COUNT(DISTINCT p.id) as purchase_count
        FROM purchases p
        JOIN purchase_items pi ON p.id = pi.purchase_id
        WHERE p.${taxPaidConditions}
        GROUP BY pi.gst_rate
        ORDER BY pi.gst_rate`;
      
      const taxPaidResult = await db.query(taxPaidQuery, taxPaidParams);
      
      // Process results
      const taxRates = new Set();
      
      // Add all tax rates from both collections
      taxCollectedResult.rows.forEach(row => taxRates.add(parseFloat(row.tax_rate)));
      taxPaidResult.rows.forEach(row => taxRates.add(parseFloat(row.tax_rate)));
      
      // Create tax summary by rate
      const taxSummary = Array.from(taxRates).map(rate => {
        const collected = taxCollectedResult.rows.find(r => parseFloat(r.tax_rate) === rate) || { tax_collected: 0, invoice_count: 0 };
        const paid = taxPaidResult.rows.find(r => parseFloat(r.tax_rate) === rate) || { tax_paid: 0, purchase_count: 0 };
        
        return {
          tax_rate: rate,
          tax_collected: parseFloat(collected.tax_collected) || 0,
          tax_paid: parseFloat(paid.tax_paid) || 0,
          net_tax: parseFloat(collected.tax_collected || 0) - parseFloat(paid.tax_paid || 0),
          invoice_count: parseInt(collected.invoice_count) || 0,
          purchase_count: parseInt(paid.purchase_count) || 0
        };
      });
      
      // Calculate totals
      const totalTaxCollected = taxSummary.reduce((sum, item) => sum + item.tax_collected, 0);
      const totalTaxPaid = taxSummary.reduce((sum, item) => sum + item.tax_paid, 0);
      const netTax = totalTaxCollected - totalTaxPaid;
      
      return {
        taxSummary,
        totalTaxCollected,
        totalTaxPaid,
        netTax
      };
    } catch (error) {
      console.error('Error generating tax report:', error);
      throw error;
    }
  },

  /**
   * Get accounts receivable report
   * @param {string} customerId - Optional customer ID filter
   * @param {string} agingPeriod - Optional aging period filter (all, 30, 60, 90, 90+)
   * @returns {Promise<Object>} Accounts receivable report data
   */
  async getAccountsReceivableReport(customerId = null, agingPeriod = 'all') {
    try {
      // Base query conditions
      let conditions = `payment_status IN ('Pending', 'Partial')`;
      let params = [];
      let paramIndex = 1;
      
      // Add customer filter if provided
      if (customerId) {
        conditions += ` AND customer_id = $${paramIndex}`;
        params.push(customerId);
        paramIndex++;
      }
      
      // Add aging period filter if not 'all'
      let agingCondition = '';
      if (agingPeriod !== 'all') {
        const today = moment().format('YYYY-MM-DD');
        
        if (agingPeriod === '30') {
          agingCondition = ` AND (DATE('${today}') - DATE(due_date)) BETWEEN 0 AND 30`;
        } else if (agingPeriod === '60') {
          agingCondition = ` AND (DATE('${today}') - DATE(due_date)) BETWEEN 31 AND 60`;
        } else if (agingPeriod === '90') {
          agingCondition = ` AND (DATE('${today}') - DATE(due_date)) BETWEEN 61 AND 90`;
        } else if (agingPeriod === '90+') {
          agingCondition = ` AND (DATE('${today}') - DATE(due_date)) > 90`;
        }
        
        conditions += agingCondition;
      }
      
      // Get outstanding invoices
      const invoicesQuery = `
        SELECT 
          i.id,
          i.invoice_number,
          i.invoice_date,
          i.due_date,
          i.total_amount,
          i.payment_status,
          i.amount_paid,
          (i.total_amount - COALESCE(i.amount_paid, 0)) as outstanding_amount,
          (CURRENT_DATE - DATE(i.due_date)) as days_overdue,
          c.name as customer_name,
          c.email as customer_email,
          c.phone as customer_phone
        FROM invoices i
        JOIN customers c ON i.customer_id = c.id
        WHERE ${conditions}
        ORDER BY days_overdue DESC`;
      
      const invoicesResult = await db.query(invoicesQuery, params);
      
      // Get aging summary
      const today = moment().format('YYYY-MM-DD');
      const agingSummaryQuery = `
        SELECT 
          SUM(CASE WHEN (DATE('${today}') - DATE(due_date)) BETWEEN 0 AND 30 THEN (total_amount - COALESCE(amount_paid, 0)) ELSE 0 END) as days_0_30,
          SUM(CASE WHEN (DATE('${today}') - DATE(due_date)) BETWEEN 31 AND 60 THEN (total_amount - COALESCE(amount_paid, 0)) ELSE 0 END) as days_31_60,
          SUM(CASE WHEN (DATE('${today}') - DATE(due_date)) BETWEEN 61 AND 90 THEN (total_amount - COALESCE(amount_paid, 0)) ELSE 0 END) as days_61_90,
          SUM(CASE WHEN (DATE('${today}') - DATE(due_date)) > 90 THEN (total_amount - COALESCE(amount_paid, 0)) ELSE 0 END) as days_over_90
        FROM invoices
        WHERE payment_status IN ('Pending', 'Partial')
        ${customerId ? ` AND customer_id = $1` : ''}`;
      
      const agingSummaryResult = await db.query(agingSummaryQuery, customerId ? [customerId] : []);
      
      // Calculate totals
      const totalOutstanding = invoicesResult.rows.reduce((sum, invoice) => sum + parseFloat(invoice.outstanding_amount || 0), 0);
      const totalInvoices = invoicesResult.rows.length;
      const totalDaysOutstanding = invoicesResult.rows.reduce((sum, invoice) => sum + parseInt(invoice.days_overdue > 0 ? invoice.days_overdue : 0), 0);
      const averageDaysOutstanding = totalInvoices > 0 ? Math.round(totalDaysOutstanding / totalInvoices) : 0;
      
      return {
        customerId,
        agingPeriod,
        totalOutstanding,
        totalInvoices,
        averageDaysOutstanding,
        agingSummary: agingSummaryResult.rows[0],
        invoices: invoicesResult.rows
      };
    } catch (error) {
      console.error('Error generating accounts receivable report:', error);
      throw error;
    }
  },

  /**
   * Get accounts payable report
   * @param {string} supplierId - Optional supplier ID filter
   * @param {string} agingPeriod - Optional aging period filter (all, 30, 60, 90, 90+)
   * @returns {Promise<Object>} Accounts payable report data
   */
  async getAccountsPayableReport(supplierId = null, agingPeriod = 'all') {
    try {
      const formattedStartDate = moment(startDate).format('YYYY-MM-DD');
      const formattedEndDate = moment(endDate).format('YYYY-MM-DD');
      
      // Base query conditions
      let conditions = `purchase_date BETWEEN $1 AND $2 AND payment_status != 'paid'`;
      let params = [formattedStartDate, formattedEndDate];
      let paramIndex = 3;
      
      // Add supplier filter if provided
      if (supplierId) {
        conditions += ` AND supplier_id = $${paramIndex}`;
        params.push(supplierId);
        paramIndex++;
      }
      
      // Get outstanding purchases
      const outstandingPurchasesQuery = `
        SELECT 
          p.id,
          p.purchase_number,
          p.purchase_date,
          p.due_date,
          p.total_amount,
          p.total_amount as balance,
          s.id as supplier_id,
          s.name as supplier_name,
          s.email as supplier_email,
          s.phone as supplier_phone,
          CASE
            WHEN p.due_date >= CURRENT_DATE THEN 'current'
            WHEN p.due_date >= CURRENT_DATE - INTERVAL '30 days' THEN '1-30'
            WHEN p.due_date >= CURRENT_DATE - INTERVAL '60 days' THEN '31-60'
            WHEN p.due_date >= CURRENT_DATE - INTERVAL '90 days' THEN '61-90'
            ELSE '90+'
          END as aging_period
        FROM purchases p
        JOIN suppliers s ON p.supplier_id = s.id
        WHERE ${conditions}
        ORDER BY p.due_date`;
      
      const outstandingPurchasesResult = await db.query(outstandingPurchasesQuery, params);
      let outstandingPurchases = outstandingPurchasesResult.rows;
      
      // Filter by aging period if provided
      if (agingPeriod && agingPeriod !== 'all') {
        outstandingPurchases = outstandingPurchases.filter(purchase => purchase.aging_period === agingPeriod);
      }
      
      // Calculate aging summary
      const agingSummary = {
        current: { count: 0, total: 0 },
        '1-30': { count: 0, total: 0 },
        '31-60': { count: 0, total: 0 },
        '61-90': { count: 0, total: 0 },
        '90+': { count: 0, total: 0 }
      };
      
      outstandingPurchases.forEach(purchase => {
        agingSummary[purchase.aging_period].count++;
        agingSummary[purchase.aging_period].total += parseFloat(purchase.balance);
      });
      
      // Calculate total outstanding
      const totalOutstanding = outstandingPurchases.reduce((sum, purchase) => sum + parseFloat(purchase.balance), 0);
      
      return {
        supplierId,
        agingPeriod,
        totalOutstanding,
        totalPurchases: outstandingPurchases.length,
        agingSummary: agingSummary,
        outstandingPurchases: outstandingPurchases
      };
    } catch (error) {
      console.error('Error generating accounts payable report:', error);
      throw error;
    }
  },

  /**
   * Get purchase report by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} supplierId - Optional supplier ID filter
   * @param {string} productId - Optional product ID filter
   * @returns {Promise<Object>} Purchase report data
   */
  async getPurchaseReport(startDate, endDate, supplierId = null, productId = null) {
    try {
      // Format dates for query
      const formattedStartDate = moment(startDate).format('YYYY-MM-DD');
      const formattedEndDate = moment(endDate).format('YYYY-MM-DD');
      
      // Base query conditions
      let conditions = `purchase_date BETWEEN $1 AND $2`;
      let params = [formattedStartDate, formattedEndDate];
      let paramIndex = 3;
      
      // Add supplier filter if provided
      if (supplierId) {
        conditions += ` AND supplier_id = $${paramIndex}`;
        params.push(supplierId);
        paramIndex++;
      }
      
      // Get purchase summary
      const purchaseSummaryQuery = `
        SELECT 
          COUNT(*) as total_purchases,
          SUM(total_amount) as total_amount,
          SUM(tax_amount) as total_tax,
          AVG(total_amount) as average_purchase_value
        FROM purchases
        WHERE ${conditions}`;
      
      const purchaseSummaryResult = await db.query(purchaseSummaryQuery, params);
      const summary = purchaseSummaryResult.rows[0] || {
        total_purchases: 0,
        total_amount: 0,
        total_tax: 0,
        average_purchase_value: 0
      };
      
      // Get purchases by day
      const byDayQuery = `
        SELECT 
          TO_CHAR(purchase_date, 'YYYY-MM-DD') as date,
          COUNT(*) as count,
          SUM(total_amount) as total_amount
        FROM purchases
        WHERE ${conditions}
        GROUP BY TO_CHAR(purchase_date, 'YYYY-MM-DD')
        ORDER BY date`;
      
      const byDayResult = await db.query(byDayQuery, params);
      
      // Prepare parameters for product-related queries
      let productParams = [...params];
      let productConditions = conditions;
      
      // Add product filter if provided
      if (productId) {
        productConditions = `${conditions} AND pi.product_id = $${paramIndex}`;
        productParams.push(productId);
      }
      
      // Get top purchased products
      const topProductsQuery = `
        SELECT 
          p.id,
          p.name,
          SUM(pi.quantity) as total_quantity,
          SUM(pi.total_price) as total_amount
        FROM purchase_items pi
        JOIN products p ON pi.product_id = p.id
        JOIN purchases pu ON pi.purchase_id = pu.id
        WHERE pu.${productConditions}
        GROUP BY p.id, p.name
        ORDER BY total_amount DESC
        LIMIT 10`;
      
      const topProductsResult = await db.query(topProductsQuery, productParams);
      
      // Get top suppliers
      const topSuppliersQuery = `
        SELECT 
          s.id,
          s.name,
          COUNT(p.id) as purchase_count,
          SUM(p.total_amount) as total_amount
        FROM purchases p
        JOIN suppliers s ON p.supplier_id = s.id
        WHERE ${conditions}
        GROUP BY s.id, s.name
        ORDER BY total_amount DESC
        LIMIT 10`;
      
      const topSuppliersResult = await db.query(topSuppliersQuery, params);
      
      return {
        summary,
        byDay: byDayResult.rows,
        topProducts: topProductsResult.rows,
        topSuppliers: topSuppliersResult.rows
      };
    } catch (error) {
      console.error('Error generating purchase report:', error);
      throw error;
    }
  },

  getAccountsReceivableReport: async function(startDate, endDate, customerId = null, agingPeriod = null) {
    try {
      const formattedStartDate = moment(startDate).format('YYYY-MM-DD');
      const formattedEndDate = moment(endDate).format('YYYY-MM-DD');
      
      // Base query conditions
      let conditions = `invoice_date BETWEEN $1 AND $2 AND payment_status != 'paid'`;
      let params = [formattedStartDate, formattedEndDate];
      let paramIndex = 3;
      
      // Add customer filter if provided
      if (customerId) {
        conditions += ` AND customer_id = $${paramIndex}`;
        params.push(customerId);
        paramIndex++;
      }
      
      // Get outstanding invoices
      const outstandingInvoicesQuery = `
        SELECT 
          i.id,
          i.invoice_number,
          i.invoice_date,
          i.due_date,
          i.total_amount,
          i.total_amount as balance,
          c.id as customer_id,
          c.name as customer_name,
          c.email as customer_email,
          c.phone as customer_phone,
          CASE
            WHEN i.due_date >= CURRENT_DATE THEN 'current'
            WHEN i.due_date >= CURRENT_DATE - INTERVAL '30 days' THEN '1-30'
            WHEN i.due_date >= CURRENT_DATE - INTERVAL '60 days' THEN '31-60'
            WHEN i.due_date >= CURRENT_DATE - INTERVAL '90 days' THEN '61-90'
            ELSE '90+'
          END as aging_period
        FROM invoices i
        JOIN customers c ON i.customer_id = c.id
        WHERE ${conditions}
        ORDER BY i.due_date`;
      
      const outstandingInvoicesResult = await db.query(outstandingInvoicesQuery, params);
      let outstandingInvoices = outstandingInvoicesResult.rows;
      
      // Filter by aging period if provided
      if (agingPeriod && agingPeriod !== 'all') {
        outstandingInvoices = outstandingInvoices.filter(invoice => invoice.aging_period === agingPeriod);
      }
      
      // Calculate aging summary
      const agingSummary = {
        current: { count: 0, total: 0 },
        '1-30': { count: 0, total: 0 },
        '31-60': { count: 0, total: 0 },
        '61-90': { count: 0, total: 0 },
        '90+': { count: 0, total: 0 }
      };
      
      outstandingInvoices.forEach(invoice => {
        agingSummary[invoice.aging_period].count++;
        agingSummary[invoice.aging_period].total += parseFloat(invoice.balance);
      });
      
      // Calculate total outstanding
      const totalOutstanding = outstandingInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.balance), 0);
      
      return {
        outstandingInvoices,
        agingSummary,
        totalOutstanding,
        totalCount: outstandingInvoices.length
      };
    } catch (error) {
      console.error('Error generating accounts receivable report:', error);
      throw error;
    }
  },
  
  getAccountsPayableReport: async function(startDate, endDate, supplierId = null, agingPeriod = null) {
    try {
      const formattedStartDate = moment(startDate).format('YYYY-MM-DD');
      const formattedEndDate = moment(endDate).format('YYYY-MM-DD');
      
      // Base query conditions
      let conditions = `purchase_date BETWEEN $1 AND $2 AND payment_status != 'paid'`;
      let params = [formattedStartDate, formattedEndDate];
      let paramIndex = 3;
      
      // Add supplier filter if provided
      if (supplierId) {
        conditions += ` AND supplier_id = $${paramIndex}`;
        params.push(supplierId);
        paramIndex++;
      }
      
      // Get outstanding purchases
      const outstandingPurchasesQuery = `
        SELECT 
          p.id,
          p.purchase_number,
          p.purchase_date,
          p.due_date,
          p.total_amount,
          p.total_amount as balance,
          s.id as supplier_id,
          s.name as supplier_name,
          s.email as supplier_email,
          s.phone as supplier_phone,
          CASE
            WHEN p.due_date >= CURRENT_DATE THEN 'current'
            WHEN p.due_date >= CURRENT_DATE - INTERVAL '30 days' THEN '1-30'
            WHEN p.due_date >= CURRENT_DATE - INTERVAL '60 days' THEN '31-60'
            WHEN p.due_date >= CURRENT_DATE - INTERVAL '90 days' THEN '61-90'
            ELSE '90+'
          END as aging_period
        FROM purchases p
        JOIN suppliers s ON p.supplier_id = s.id
        WHERE ${conditions}
        ORDER BY p.due_date`;
      
      const outstandingPurchasesResult = await db.query(outstandingPurchasesQuery, params);
      let outstandingPurchases = outstandingPurchasesResult.rows;
      
      // Filter by aging period if provided
      if (agingPeriod && agingPeriod !== 'all') {
        outstandingPurchases = outstandingPurchases.filter(purchase => purchase.aging_period === agingPeriod);
      }
      
      // Calculate aging summary
      const agingSummary = {
        current: { count: 0, total: 0 },
        '1-30': { count: 0, total: 0 },
        '31-60': { count: 0, total: 0 },
        '61-90': { count: 0, total: 0 },
        '90+': { count: 0, total: 0 }
      };
      
      outstandingPurchases.forEach(purchase => {
        agingSummary[purchase.aging_period].count++;
        agingSummary[purchase.aging_period].total += parseFloat(purchase.balance);
      });
      
      // Calculate total outstanding
      const totalOutstanding = outstandingPurchases.reduce((sum, purchase) => sum + parseFloat(purchase.balance), 0);
      
      return {
        outstandingPurchases,
        agingSummary,
        totalOutstanding,
        totalCount: outstandingPurchases.length
      };
    } catch (error) {
      console.error('Error generating accounts payable report:', error);
      throw error;
    }
  }
};

module.exports = ReportModel; 