const express = require('express');
const router = express.Router();
const InvoiceController = require('../controllers/invoiceController');
const PaymentController = require('../controllers/paymentController');

// Get all invoices
router.get('/', InvoiceController.getAllInvoices);

// Get unpaid invoices
router.get('/unpaid', InvoiceController.getUnpaidInvoices);

// Get invoices by date range
router.get('/date-range', InvoiceController.getInvoicesByDateRange);

// Get sales statistics
router.get('/statistics', InvoiceController.getSalesStatistics);

// Get invoice by ID
router.get('/:id', InvoiceController.getInvoiceById);

// Get invoice details with payments
router.get('/:id/details', InvoiceController.getInvoiceWithPayments);

// Generate PDF
router.get('/:id/pdf', InvoiceController.generatePDF);

// Create new invoice
router.post('/', InvoiceController.createInvoice);

// Update payment status
router.patch('/:id/payment-status', InvoiceController.updatePaymentStatus);

// Process sales return
router.post('/:id/return', InvoiceController.processSalesReturn);

// Send invoice by email
router.post('/:id/email', InvoiceController.sendInvoiceByEmail);

// Payment routes
router.get('/:id/payment-history', PaymentController.getPaymentHistory);
router.post('/:id/payments', PaymentController.createPayment);

// Delete invoice
router.delete('/:id', InvoiceController.deleteInvoice);

module.exports = router; 