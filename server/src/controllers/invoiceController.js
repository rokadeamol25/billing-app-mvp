const InvoiceModel = require('../models/invoiceModel');
const CustomerModel = require('../models/customerModel');
const { generateInvoicePDF } = require('../utils/pdfGenerator');
const { sendInvoiceEmail } = require('../utils/emailSender');
const PaymentModel = require('../models/paymentModel');
const fs = require('fs');

/**
 * Invoice Controller
 * Handles HTTP requests related to invoices
 */
const InvoiceController = {
  /**
   * Get all invoices
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAllInvoices(req, res, next) {
    try {
      const invoices = await InvoiceModel.getAllInvoices();
      res.json(invoices);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get invoice by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getInvoiceById(req, res, next) {
    try {
      const { id } = req.params;
      const invoice = await InvoiceModel.getInvoiceById(id);
      
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      res.json(invoice);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create a new invoice
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createInvoice(req, res, next) {
    try {
      // Handle both formats: either {invoiceData, items} or flat structure
      let invoiceData, items;
      
      if (req.body.invoiceData && req.body.items) {
        // New structured format
        invoiceData = req.body.invoiceData;
        items = req.body.items;
      } else {
        // Legacy flat format - extract data
        const { 
          customer_id, invoice_date, due_date, status, notes,
          subtotal, tax_amount, total_amount, items: bodyItems,
          ...rest
        } = req.body;
        
        invoiceData = { 
          customer_id, invoice_date, due_date, status, notes,
          subtotal, tax_amount, total_amount, ...rest
        };
        items = bodyItems;
      }
      
      // Validate required fields with detailed error messages
      if (!invoiceData) {
        return res.status(400).json({ 
          message: 'Invoice data is required' 
        });
      }
      
      if (!invoiceData.customer_id) {
        return res.status(400).json({ 
          message: 'Customer ID is required' 
        });
      }
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ 
          message: 'At least one item is required' 
        });
      }
      
      // Validate items with detailed error messages
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.product_id) {
          return res.status(400).json({ 
            message: `Item #${i+1} is missing product_id` 
          });
        }
        if (!item.quantity || item.quantity <= 0) {
          return res.status(400).json({ 
            message: `Item #${i+1} has invalid quantity` 
          });
        }
        if (!item.unit_price || item.unit_price < 0) {
          return res.status(400).json({ 
            message: `Item #${i+1} has invalid unit price` 
          });
        }
      }
      
      // Create the invoice
      const invoice = await InvoiceModel.createInvoice(invoiceData, items);
      res.status(201).json(invoice);
    } catch (error) {
      console.error('Error creating invoice:', error);
      
      // Provide more specific error messages
      if (error.code === '23503') { // Foreign key violation
        return res.status(400).json({ 
          message: 'Invalid customer ID or product ID' 
        });
      }
      
      next(error);
    }
  },

  /**
   * Update invoice payment status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updatePaymentStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { payment_status, payment_method } = req.body;
      
      if (!payment_status) {
        return res.status(400).json({ message: 'Payment status is required' });
      }
      
      if (!['Paid', 'Pending', 'Partial', 'Cancelled'].includes(payment_status)) {
        return res.status(400).json({ 
          message: 'Payment status must be one of: Paid, Pending, Partial, Cancelled' 
        });
      }
      
      const invoice = await InvoiceModel.updatePaymentStatus(id, payment_status, payment_method);
      
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      res.json(invoice);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Process a sales return
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async processSalesReturn(req, res, next) {
    try {
      const { id } = req.params;
      const { return_items, reason } = req.body;
      
      if (!return_items || !return_items.length) {
        return res.status(400).json({ message: 'Return items are required' });
      }
      
      // Validate return items
      for (const item of return_items) {
        if (!item.invoice_item_id || !item.product_id || !item.quantity || !item.unit_price) {
          return res.status(400).json({ 
            message: 'Each return item must have invoice_item_id, product_id, quantity, and unit_price' 
          });
        }
      }
      
      const salesReturn = await InvoiceModel.processSalesReturn(id, return_items, reason);
      res.status(201).json(salesReturn);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get invoices by date range
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getInvoicesByDateRange(req, res, next) {
    try {
      const { start_date, end_date } = req.query;
      
      if (!start_date || !end_date) {
        return res.status(400).json({ message: 'Start date and end date are required' });
      }
      
      const invoices = await InvoiceModel.getInvoicesByDateRange(new Date(start_date), new Date(end_date));
      res.json(invoices);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get unpaid invoices
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getUnpaidInvoices(req, res, next) {
    try {
      const invoices = await InvoiceModel.getUnpaidInvoices();
      res.json(invoices);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Generate invoice PDF
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async generatePDF(req, res, next) {
    try {
      console.log('Starting PDF generation for invoice ID:', req.params.id);
      const { id } = req.params;
      
      // Get invoice details
      console.log('Fetching invoice details...');
      const invoice = await InvoiceModel.getInvoiceById(id);
      
      if (!invoice) {
        console.log('Invoice not found:', id);
        return res.status(404).json({ 
          success: false,
          message: 'Invoice not found' 
        });
      }
      console.log('Invoice found:', invoice.invoice_number);
      
      // Get customer details
      console.log('Fetching customer details...');
      const customer = await CustomerModel.getCustomerById(invoice.customer_id);
      
      if (!customer) {
        console.log('Customer not found:', invoice.customer_id);
        return res.status(404).json({ 
          success: false,
          message: 'Customer not found' 
        });
      }
      console.log('Customer found:', customer.name);

      // Get invoice items
      const items = invoice.items || [];
      console.log('Number of invoice items:', items.length);
      
      // Generate PDF
      console.log('Generating PDF...');
      const pdfPath = await generateInvoicePDF(invoice, customer, items);
      console.log('PDF generated at:', pdfPath);
      
      // Send the PDF file
      console.log('Sending PDF file...');
      res.download(pdfPath, `invoice_${invoice.invoice_number}.pdf`, (err) => {
        if (err) {
          console.error('Error sending PDF:', err);
          // Only send error response if headers haven't been sent yet
          if (!res.headersSent) {
            res.status(500).json({ 
              success: false,
              message: 'Error downloading PDF file' 
            });
          }
        }
        
        // Optionally cleanup the file after sending
        fs.unlink(pdfPath, (unlinkErr) => {
          if (unlinkErr) {
            console.error('Error cleaning up PDF file:', unlinkErr);
          } else {
            console.log('PDF file cleaned up successfully');
          }
        });
      });
    } catch (error) {
      console.error('Error in generatePDF:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          success: false,
          message: 'Error generating PDF',
          error: error.message,
          stack: error.stack 
        });
      }
    }
  },

  /**
   * Send invoice by email
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async sendInvoiceByEmail(req, res, next) {
    try {
      const { id } = req.params;
      const invoice = await InvoiceModel.getInvoiceById(id);
      
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      // Get customer details
      const customer = await CustomerModel.getCustomerById(invoice.customer_id);
      
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      if (!customer.email) {
        return res.status(400).json({ message: 'Customer email is required to send invoice' });
      }
      
      // Generate PDF
      const pdfPath = await generateInvoicePDF(invoice, customer, invoice.items);
      
      // Send email with PDF attachment
      const emailResult = await sendInvoiceEmail(invoice, customer, pdfPath);
      
      res.json({ 
        message: 'Invoice sent successfully', 
        email: customer.email,
        messageId: emailResult.messageId
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get sales statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getSalesStatistics(req, res, next) {
    try {
      const { period } = req.query;
      
      if (!period || !['daily', 'weekly', 'monthly'].includes(period)) {
        return res.status(400).json({ 
          message: 'Valid period is required (daily, weekly, or monthly)' 
        });
      }
      
      const statistics = await InvoiceModel.getSalesStatistics(period);
      res.json(statistics);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get invoice with payment details
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getInvoiceWithPayments(req, res, next) {
    try {
      const { id } = req.params;
      
      // Get invoice details
      const invoice = await InvoiceModel.getInvoiceById(id);
      
      if (!invoice) {
        return res.status(404).json({ 
          success: false, 
          message: 'Invoice not found' 
        });
      }
      
      // Get payment history
      const payments = await PaymentModel.getPaymentsByInvoiceId(id);
      
      // Calculate total paid and balance due
      const totalPaid = await PaymentModel.getTotalPaidForInvoice(id);
      const balanceDue = invoice.total_amount - totalPaid;
      
      // Add payment information to invoice
      const invoiceWithPayments = {
        ...invoice,
        payments,
        amount_paid: totalPaid,
        balance_due: balanceDue,
        payment_status: totalPaid >= invoice.total_amount ? 'Paid' : 
                        totalPaid > 0 ? 'Partially Paid' : 
                        invoice.status
      };
      
      return res.json(invoiceWithPayments);
    } catch (error) {
      console.error('Error fetching invoice with payments:', error);
      next(error);
    }
  },

  /**
   * Delete an invoice
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteInvoice(req, res, next) {
    try {
      const { id } = req.params;
      
      // Check if invoice exists
      const invoice = await InvoiceModel.getInvoiceById(id);
      if (!invoice) {
        return res.status(404).json({ 
          success: false, 
          message: 'Invoice not found' 
        });
      }
      
      // Delete the invoice
      await InvoiceModel.deleteInvoice(id);
      
      res.json({ 
        success: true, 
        message: 'Invoice deleted successfully' 
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = InvoiceController; 