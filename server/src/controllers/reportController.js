const ReportModel = require('../models/reportModel');

/**
 * Report Controller
 * Handles HTTP requests related to reports
 */
const ReportController = {
  /**
   * Get sales report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getSalesReport(req, res, next) {
    try {
      const { startDate, endDate, customerId, productId } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Start date and end date are required' });
      }
      
      // Parse dates and handle potential errors
      let startDateObj, endDateObj;
      try {
        startDateObj = new Date(startDate);
        endDateObj = new Date(endDate);
        
        // Check if dates are valid
        if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
          return res.status(400).json({ message: 'Invalid date format' });
        }
      } catch (err) {
        return res.status(400).json({ message: 'Invalid date format' });
      }
      
      // Get report data with optional filters
      const reportData = await ReportModel.getSalesReport(
        startDateObj, 
        endDateObj,
        customerId,
        productId
      );
      
      // Restructure the response to match UI expectations
      const response = {
        summary: {
          total_invoiced: reportData.summary.total_invoiced,
          total_received: reportData.summary.total_received,
          total_outstanding: reportData.summary.total_outstanding
        },
        salesSummary: {
          total_amount: reportData.summary.total_invoiced,
          total_invoices: reportData.summary.total_invoices
        },
        invoices: reportData.invoices.map(invoice => ({
          invoice_number: invoice.invoice_number,
          date: invoice.date,
          customer_name: invoice.customer_name,
          total_amount: parseFloat(invoice.total_amount),
          amount_paid: parseFloat(invoice.amount_paid),
          amount_outstanding: parseFloat(invoice.amount_outstanding),
          payment_status: invoice.payment_status
        })),
        salesByDay: reportData.byDay.map(day => ({
          date: day.date,
          total_sales: parseInt(day.count),
          total_amount: parseFloat(day.total_amount)
        })),
        topProducts: reportData.topProducts.map(product => ({
          product_name: product.product_name,
          quantity: parseInt(product.quantity),
          total_amount: parseFloat(product.total_amount)
        })),
        topCustomers: reportData.topCustomers.map(customer => ({
          customer_name: customer.customer_name,
          total_purchases: parseInt(customer.total_invoices),
          total_amount: parseFloat(customer.total_amount)
        }))
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error in getSalesReport:', error);
      next(error);
    }
  },

  /**
   * Get profit and loss report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getProfitLossReport(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Start date and end date are required' });
      }
      
      // Parse dates and handle potential errors
      let startDateObj, endDateObj;
      try {
        startDateObj = new Date(startDate);
        endDateObj = new Date(endDate);
        
        // Check if dates are valid
        if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
          return res.status(400).json({ message: 'Invalid date format' });
        }
      } catch (err) {
        return res.status(400).json({ message: 'Invalid date format' });
      }
      
      const report = await ReportModel.getProfitLossReport(startDateObj, endDateObj);
      res.json(report);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get inventory report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getInventoryReport(req, res, next) {
    try {
      const report = await ReportModel.getInventoryReport();
      res.json(report);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get tax report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getTaxReport(req, res, next) {
    try {
      const { startDate, endDate, taxType = 'all' } = req.query;
      
      // Validate required parameters
      if (!startDate || !endDate) {
        return res.status(400).json({ 
          success: false, 
          message: 'Start date and end date are required' 
        });
      }
      
      // Parse dates
      const parsedStartDate = new Date(startDate);
      const parsedEndDate = new Date(endDate);
      
      // Validate date formats
      if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid date format. Please use YYYY-MM-DD format.' 
        });
      }
      
      // Get report data
      const reportData = await ReportModel.getTaxReport(
        parsedStartDate, 
        parsedEndDate,
        taxType
      );
      
      res.json({
        success: true,
        data: reportData
      });
    } catch (error) {
      console.error('Error generating tax report:', error);
      next(error);
    }
  },

  /**
   * Export tax report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async exportTaxReport(req, res, next) {
    try {
      const { startDate, endDate, taxType = 'all', format = 'csv' } = req.query;
      
      // Validate required parameters
      if (!startDate || !endDate) {
        return res.status(400).json({ 
          success: false, 
          message: 'Start date and end date are required' 
        });
      }
      
      // Parse dates
      const parsedStartDate = new Date(startDate);
      const parsedEndDate = new Date(endDate);
      
      // Validate date formats
      if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid date format. Please use YYYY-MM-DD format.' 
        });
      }
      
      // Get report data
      const reportData = await ReportModel.getTaxReport(
        parsedStartDate, 
        parsedEndDate,
        taxType
      );
      
      if (format.toLowerCase() === 'csv') {
        // Generate CSV
        let csvContent = 'Tax Report\n';
        csvContent += `Period: ${startDate} to ${endDate}\n`;
        csvContent += `Tax Type: ${taxType === 'all' ? 'All' : taxType}\n\n`;
        
        // Summary section
        csvContent += 'SUMMARY\n';
        csvContent += `Total Tax Collected,${reportData.totalTaxCollected}\n`;
        csvContent += `Total Tax Paid,${reportData.totalTaxPaid}\n`;
        csvContent += `Net Tax,${reportData.netTax}\n\n`;
        
        // Tax details by rate
        csvContent += 'TAX DETAILS BY RATE\n';
        csvContent += 'Tax Rate,Tax Collected,Tax Paid,Net Tax,Invoice Count,Purchase Count\n';
        reportData.taxSummary.forEach(item => {
          csvContent += `${item.tax_rate}%,${item.tax_collected},${item.tax_paid},${item.net_tax},${item.invoice_count},${item.purchase_count}\n`;
        });
        
        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="tax_report_${startDate}_to_${endDate}.csv"`);
        
        // Send CSV data
        return res.send(csvContent);
      }
      
      // Default to JSON if format is not CSV
      res.json({
        success: true,
        data: reportData
      });
    } catch (error) {
      console.error('Error exporting tax report:', error);
      next(error);
    }
  },

  /**
   * Get accounts receivable report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAccountsReceivableReport(req, res, next) {
    try {
      const { startDate, endDate, customerId, agingPeriod } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Start date and end date are required' });
      }
      
      // Parse dates and handle potential errors
      let startDateObj, endDateObj;
      try {
        startDateObj = new Date(startDate);
        endDateObj = new Date(endDate);
        
        // Check if dates are valid
        if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
          return res.status(400).json({ message: 'Invalid date format' });
        }
      } catch (err) {
        return res.status(400).json({ message: 'Invalid date format' });
      }
      
      // Get report data with optional filters
      const reportData = await ReportModel.getAccountsReceivableReport(
        startDateObj, 
        endDateObj,
        customerId,
        agingPeriod
      );
      
      // Format the response for the frontend
      const response = {
        outstandingInvoices: reportData.outstandingInvoices,
        agingSummary: reportData.agingSummary,
        totalOutstanding: reportData.totalOutstanding,
        totalCount: reportData.totalCount
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error in getAccountsReceivableReport:', error);
      next(error);
    }
  },

  /**
   * Export accounts receivable report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async exportAccountsReceivableReport(req, res, next) {
    try {
      const { startDate, endDate, customerId, agingPeriod, format = 'csv' } = req.query;
      
      // Validate required parameters
      if (!startDate || !endDate) {
        return res.status(400).json({ 
          success: false, 
          message: 'Start date and end date are required' 
        });
      }
      
      // Parse dates
      const parsedStartDate = new Date(startDate);
      const parsedEndDate = new Date(endDate);
      
      // Validate date formats
      if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid date format. Please use YYYY-MM-DD format.' 
        });
      }
      
      // Get report data
      const reportData = await ReportModel.getAccountsReceivableReport(
        parsedStartDate, 
        parsedEndDate,
        customerId,
        agingPeriod
      );
      
      if (format.toLowerCase() === 'csv') {
        // Generate CSV
        let csvContent = 'Accounts Receivable Report\n';
        csvContent += `Period: ${startDate} to ${endDate}\n\n`;
        
        // Summary section
        csvContent += 'SUMMARY\n';
        csvContent += `Total Outstanding,${reportData.totalOutstanding}\n`;
        csvContent += `Total Invoices,${reportData.totalCount}\n\n`;
        
        // Aging summary
        csvContent += 'AGING SUMMARY\n';
        csvContent += 'Period,Count,Amount\n';
        Object.entries(reportData.agingSummary).forEach(([period, data]) => {
          csvContent += `${period},${data.count},${data.total}\n`;
        });
        csvContent += '\n';
        
        // Outstanding invoices
        csvContent += 'OUTSTANDING INVOICES\n';
        csvContent += 'Invoice Number,Customer,Date,Due Date,Amount,Balance,Aging Period\n';
        reportData.outstandingInvoices.forEach(invoice => {
          csvContent += `${invoice.invoice_number},${invoice.customer_name},${invoice.invoice_date},${invoice.due_date},${invoice.total_amount},${invoice.balance},${invoice.aging_period}\n`;
        });
        
        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="accounts_receivable_report_${startDate}_to_${endDate}.csv"`);
        
        // Send CSV data
        return res.send(csvContent);
      }
      
      // Default to JSON if format is not CSV
      res.json({
        success: true,
        data: reportData
      });
    } catch (error) {
      console.error('Error exporting accounts receivable report:', error);
      next(error);
    }
  },

  /**
   * Get accounts payable report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAccountsPayableReport(req, res, next) {
    try {
      const { startDate, endDate, supplierId, agingPeriod } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Start date and end date are required' });
      }
      
      // Parse dates and handle potential errors
      let startDateObj, endDateObj;
      try {
        startDateObj = new Date(startDate);
        endDateObj = new Date(endDate);
        
        // Check if dates are valid
        if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
          return res.status(400).json({ message: 'Invalid date format' });
        }
      } catch (err) {
        return res.status(400).json({ message: 'Invalid date format' });
      }
      
      // Get report data with optional filters
      const reportData = await ReportModel.getAccountsPayableReport(
        startDateObj, 
        endDateObj,
        supplierId,
        agingPeriod
      );
      
      // Format the response for the frontend
      const response = {
        outstandingPurchases: reportData.outstandingPurchases,
        agingSummary: reportData.agingSummary,
        totalOutstanding: reportData.totalOutstanding,
        totalCount: reportData.totalCount
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error in getAccountsPayableReport:', error);
      next(error);
    }
  },

  /**
   * Export accounts payable report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async exportAccountsPayableReport(req, res, next) {
    try {
      const { startDate, endDate, supplierId, agingPeriod, format = 'csv' } = req.query;
      
      // Validate required parameters
      if (!startDate || !endDate) {
        return res.status(400).json({ 
          success: false, 
          message: 'Start date and end date are required' 
        });
      }
      
      // Parse dates
      const parsedStartDate = new Date(startDate);
      const parsedEndDate = new Date(endDate);
      
      // Validate date formats
      if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid date format. Please use YYYY-MM-DD format.' 
        });
      }
      
      // Get report data
      const reportData = await ReportModel.getAccountsPayableReport(
        parsedStartDate, 
        parsedEndDate,
        supplierId,
        agingPeriod
      );
      
      if (format.toLowerCase() === 'csv') {
        // Generate CSV
        let csvContent = 'Accounts Payable Report\n';
        csvContent += `Period: ${startDate} to ${endDate}\n\n`;
        
        // Summary section
        csvContent += 'SUMMARY\n';
        csvContent += `Total Outstanding,${reportData.totalOutstanding}\n`;
        csvContent += `Total Purchases,${reportData.totalCount}\n\n`;
        
        // Aging summary
        csvContent += 'AGING SUMMARY\n';
        csvContent += 'Period,Count,Amount\n';
        Object.entries(reportData.agingSummary).forEach(([period, data]) => {
          csvContent += `${period},${data.count},${data.total}\n`;
        });
        csvContent += '\n';
        
        // Outstanding purchases
        csvContent += 'OUTSTANDING PURCHASES\n';
        csvContent += 'Purchase Number,Supplier,Date,Due Date,Amount,Balance,Aging Period\n';
        reportData.outstandingPurchases.forEach(purchase => {
          csvContent += `${purchase.purchase_number},${purchase.supplier_name},${purchase.purchase_date},${purchase.due_date},${purchase.total_amount},${purchase.balance},${purchase.aging_period}\n`;
        });
        
        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="accounts_payable_report_${startDate}_to_${endDate}.csv"`);
        
        // Send CSV data
        return res.send(csvContent);
      }
      
      // Default to JSON if format is not CSV
      res.json({
        success: true,
        data: reportData
      });
    } catch (error) {
      console.error('Error exporting accounts payable report:', error);
      next(error);
    }
  },

  /**
   * Export sales report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async exportSalesReport(req, res, next) {
    try {
      const { startDate, endDate, customerId, productId, format = 'csv' } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Start date and end date are required' });
      }
      
      // Parse dates and handle potential errors
      let startDateObj, endDateObj;
      try {
        startDateObj = new Date(startDate);
        endDateObj = new Date(endDate);
        
        // Check if dates are valid
        if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
          return res.status(400).json({ message: 'Invalid date format' });
        }
      } catch (err) {
        return res.status(400).json({ message: 'Invalid date format' });
      }
      
      // Get report data with optional filters
      const reportData = await ReportModel.getSalesReport(
        startDateObj, 
        endDateObj,
        customerId,
        productId
      );
      
      // Generate CSV data
      let csvData = 'Sales Report\n';
      csvData += `Period: ${reportData.startDate} to ${reportData.endDate}\n\n`;
      
      // Summary section
      csvData += 'Summary\n';
      csvData += `Total Invoices,${reportData.salesSummary.total_invoices}\n`;
      csvData += `Total Revenue,${reportData.salesSummary.total_revenue}\n`;
      csvData += `Total Tax,${reportData.salesSummary.total_tax}\n`;
      csvData += `Average Invoice Value,${reportData.salesSummary.average_invoice_value}\n\n`;
      
      // Sales by day
      csvData += 'Sales by Day\n';
      csvData += 'Date,Invoice Count,Total Amount\n';
      reportData.salesByDay.forEach(item => {
        csvData += `${item.date},${item.invoice_count},${item.total_amount}\n`;
      });
      csvData += '\n';
      
      // Top products
      csvData += 'Top Products\n';
      csvData += 'Product,SKU,Quantity,Total Revenue\n';
      reportData.topProducts.forEach(product => {
        csvData += `${product.name},${product.sku},${product.total_quantity},${product.total_revenue}\n`;
      });
      csvData += '\n';
      
      // Top customers
      csvData += 'Top Customers\n';
      csvData += 'Customer,Email,Phone,Invoice Count,Total Spent\n';
      reportData.topCustomers.forEach(customer => {
        csvData += `${customer.name},${customer.email},${customer.phone},${customer.invoice_count},${customer.total_spent}\n`;
      });
      
      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=sales-report-${reportData.startDate}-to-${reportData.endDate}.csv`);
      
      // Send CSV data
      res.send(csvData);
    } catch (error) {
      console.error('Error exporting sales report:', error);
      next(error);
    }
  },

  /**
   * Export inventory report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async exportInventoryReport(req, res, next) {
    try {
      const { categoryId, lowStockOnly, format = 'csv' } = req.query;
      
      // Get report data with optional filters
      const reportData = await ReportModel.getInventoryReport(categoryId, lowStockOnly === 'true');
      
      // Generate CSV data
      let csvData = 'Inventory Report\n';
      csvData += `Generated on: ${new Date().toISOString().split('T')[0]}\n\n`;
      
      // Summary section
      csvData += 'Summary\n';
      csvData += `Total Products,${reportData.inventorySummary.total_products}\n`;
      csvData += `Total Items in Stock,${reportData.inventorySummary.total_items_in_stock}\n`;
      csvData += `Total Inventory Value,${reportData.inventorySummary.total_inventory_value}\n`;
      csvData += `Low Stock Items,${reportData.inventorySummary.low_stock_count}\n\n`;
      
      // Inventory by category
      csvData += 'Inventory by Category\n';
      csvData += 'Category,Product Count,Total Quantity,Total Value\n';
      reportData.inventoryByCategory.forEach(category => {
        csvData += `${category.category_name},${category.product_count},${category.total_quantity},${category.total_value}\n`;
      });
      csvData += '\n';
      
      // Low stock products
      if (reportData.lowStockProducts && reportData.lowStockProducts.length > 0) {
        csvData += 'Low Stock Products\n';
        csvData += 'Product,SKU,Current Stock,Low Stock Threshold,Shortage\n';
        reportData.lowStockProducts.forEach(product => {
          csvData += `${product.name},${product.sku},${product.stock_quantity},${product.low_stock_threshold},${product.shortage}\n`;
        });
        csvData += '\n';
      }
      
      // Product list
      csvData += 'Product Inventory\n';
      csvData += 'Product,Category,SKU,Stock,Cost Price,Selling Price,Value\n';
      reportData.productList.forEach(product => {
        const value = (product.stock_quantity || 0) * (product.cost_price || 0);
        csvData += `${product.name},${product.category_name},${product.sku},${product.stock_quantity},${product.cost_price},${product.selling_price},${value}\n`;
      });
      
      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=inventory-report-${new Date().toISOString().split('T')[0]}.csv`);
      
      // Send CSV data
      res.send(csvData);
    } catch (error) {
      console.error('Error exporting inventory report:', error);
      next(error);
    }
  },

  /**
   * Get purchase report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getPurchaseReport(req, res, next) {
    try {
      const { startDate, endDate, supplierId, productId } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Start date and end date are required' });
      }
      
      // Parse dates and handle potential errors
      let startDateObj, endDateObj;
      try {
        startDateObj = new Date(startDate);
        endDateObj = new Date(endDate);
        
        // Check if dates are valid
        if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
          return res.status(400).json({ message: 'Invalid date format' });
        }
      } catch (err) {
        return res.status(400).json({ message: 'Invalid date format' });
      }
      
      // Get report data with optional filters
      const reportData = await ReportModel.getPurchaseReport(
        startDateObj, 
        endDateObj,
        supplierId,
        productId
      );
      
      // Format the response for the frontend
      const response = {
        summary: reportData.summary,
        byDay: reportData.byDay,
        topProducts: reportData.topProducts,
        topSuppliers: reportData.topSuppliers
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error in getPurchaseReport:', error);
      next(error);
    }
  },

  /**
   * Export purchase report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async exportPurchaseReport(req, res, next) {
    try {
      const { startDate, endDate, supplierId, productId, format = 'csv' } = req.query;
      
      // Validate required parameters
      if (!startDate || !endDate) {
        return res.status(400).json({ 
          success: false, 
          message: 'Start date and end date are required' 
        });
      }
      
      // Parse dates
      const parsedStartDate = new Date(startDate);
      const parsedEndDate = new Date(endDate);
      
      // Validate date formats
      if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid date format. Please use YYYY-MM-DD format.' 
        });
      }
      
      // Get report data
      const reportData = await ReportModel.getPurchaseReport(
        parsedStartDate, 
        parsedEndDate,
        supplierId,
        productId
      );
      
      if (format.toLowerCase() === 'csv') {
        // Generate CSV
        let csvContent = 'Purchase Report\n';
        csvContent += `Period: ${startDate} to ${endDate}\n\n`;
        
        // Summary section
        csvContent += 'SUMMARY\n';
        csvContent += `Total Purchases,${reportData.summary.total_purchases}\n`;
        csvContent += `Total Amount,${reportData.summary.total_amount}\n`;
        csvContent += `Total Tax,${reportData.summary.total_tax}\n`;
        csvContent += `Average Purchase Value,${reportData.summary.average_purchase_value}\n\n`;
        
        // Purchases by day
        csvContent += 'PURCHASES BY DAY\n';
        csvContent += 'Date,Count,Total Amount\n';
        reportData.byDay.forEach(day => {
          csvContent += `${day.date},${day.count},${day.total_amount}\n`;
        });
        csvContent += '\n';
        
        // Top products
        csvContent += 'TOP PRODUCTS\n';
        csvContent += 'Product,Quantity,Total Amount\n';
        reportData.topProducts.forEach(product => {
          csvContent += `${product.name},${product.total_quantity},${product.total_amount}\n`;
        });
        csvContent += '\n';
        
        // Top suppliers
        csvContent += 'TOP SUPPLIERS\n';
        csvContent += 'Supplier,Purchase Count,Total Amount\n';
        reportData.topSuppliers.forEach(supplier => {
          csvContent += `${supplier.name},${supplier.purchase_count},${supplier.total_amount}\n`;
        });
        
        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="purchase_report_${startDate}_to_${endDate}.csv"`);
        
        // Send CSV data
        return res.send(csvContent);
      }
      
      // Default to JSON if format is not CSV
      res.json({
        success: true,
        data: reportData
      });
    } catch (error) {
      console.error('Error exporting purchase report:', error);
      next(error);
    }
  },

  /**
   * Export profit and loss report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async exportProfitLossReport(req, res, next) {
    try {
      const { startDate, endDate, format = 'csv' } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Start date and end date are required' });
      }
      
      // Parse dates and handle potential errors
      let startDateObj, endDateObj;
      try {
        startDateObj = new Date(startDate);
        endDateObj = new Date(endDate);
        
        // Check if dates are valid
        if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
          return res.status(400).json({ message: 'Invalid date format' });
        }
      } catch (err) {
        return res.status(400).json({ message: 'Invalid date format' });
      }
      
      // Get report data
      const reportData = await ReportModel.getProfitLossReport(startDateObj, endDateObj);
      
      // Generate CSV data
      let csvData = 'Profit & Loss Report\n';
      csvData += `Period: ${reportData.startDate} to ${reportData.endDate}\n\n`;
      
      // Revenue section
      csvData += 'Revenue\n';
      csvData += `Total Revenue,${reportData.revenue.total_revenue}\n`;
      csvData += `Total Tax Collected,${reportData.revenue.total_tax_collected}\n\n`;
      
      // Expenses section
      csvData += 'Expenses\n';
      csvData += `Cost of Goods Sold,${reportData.cogs}\n`;
      csvData += `Total Expenses,${reportData.expenses.total_expenses}\n`;
      csvData += `Total Tax Paid,${reportData.expenses.total_tax_paid}\n\n`;
      
      // Profit summary
      csvData += 'Profit Summary\n';
      csvData += `Gross Profit,${reportData.grossProfit}\n`;
      csvData += `Net Profit,${reportData.netProfit}\n`;
      csvData += `Profit Margin,${reportData.profitMargin}%\n\n`;
      
      // Profit by category
      csvData += 'Profit by Category\n';
      csvData += 'Category,Revenue,Cost,Profit,Margin\n';
      reportData.profitByCategory.forEach(category => {
        const margin = category.revenue > 0 ? (category.profit / category.revenue) * 100 : 0;
        csvData += `${category.category_name},${category.revenue},${category.cost},${category.profit},${margin.toFixed(2)}%\n`;
      });
      
      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=profit-loss-report-${reportData.startDate}-to-${reportData.endDate}.csv`);
      
      // Send CSV data
      res.send(csvData);
    } catch (error) {
      console.error('Error exporting profit & loss report:', error);
      next(error);
    }
  }
};

module.exports = ReportController; 