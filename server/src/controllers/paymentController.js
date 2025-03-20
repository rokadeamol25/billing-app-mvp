const PaymentModel = require('../models/paymentModel');
const InvoiceModel = require('../models/invoiceModel');

const PaymentController = {
  /**
   * Create a new payment for an invoice
   */
  async createPayment(req, res) {
    try {
      const { id } = req.params;
      const { amount, payment_method, notes, payment_date } = req.body;

      // Validate required fields
      if (!amount || !payment_method) {
        return res.status(400).json({
          success: false,
          message: 'Amount and payment method are required'
        });
      }

      // Validate amount is positive
      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Payment amount must be greater than zero'
        });
      }

      // Get invoice details
      const invoice = await InvoiceModel.getInvoiceById(id);
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      // Get total amount already paid
      const totalPaid = await PaymentModel.getTotalPaidForInvoice(id);
      
      // Check if payment exceeds remaining balance
      const remainingBalance = invoice.total_amount - totalPaid;
      if (amount > remainingBalance) {
        return res.status(400).json({
          success: false,
          message: `Payment amount cannot exceed remaining balance of ${remainingBalance}`
        });
      }

      // Record the payment
      const payment = await PaymentModel.createPayment({
        invoice_id: id,
        amount,
        payment_method,
        notes,
        payment_date: payment_date ? new Date(payment_date) : new Date()
      });

      // Update invoice status based on payment
      const newTotalPaid = totalPaid + parseFloat(amount);
      let newStatus = 'Pending';
      if (newTotalPaid >= invoice.total_amount) {
        newStatus = 'Paid';
      } else if (newTotalPaid > 0) {
        newStatus = 'Partial';
      }

      await InvoiceModel.updatePaymentStatus(id, newStatus);

      return res.json({
        success: true,
        data: {
          payment,
          invoice_status: newStatus,
          total_paid: newTotalPaid,
          remaining_balance: invoice.total_amount - newTotalPaid
        }
      });

    } catch (error) {
      console.error('Error creating payment:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment',
        error: error.message
      });
    }
  },

  /**
   * Get payment history for an invoice
   */
  async getPaymentHistory(req, res) {
    try {
      const { id } = req.params;

      // Get invoice details first
      const invoice = await InvoiceModel.getInvoiceById(id);
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      // Get all payments for this invoice
      const payments = await PaymentModel.getPaymentsByInvoiceId(id);
      
      // Get total paid amount
      const totalPaid = await PaymentModel.getTotalPaidForInvoice(id);
      
      return res.json({
        success: true,
        data: {
          invoice_number: invoice.invoice_number,
          total_amount: invoice.total_amount,
          total_paid: totalPaid,
          remaining_balance: invoice.total_amount - totalPaid,
          payment_status: invoice.payment_status,
          payments: payments.map(payment => ({
            ...payment,
            payment_date: payment.payment_date ? new Date(payment.payment_date).toISOString() : null
          }))
        }
      });
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch payment history',
        error: error.message
      });
    }
  }
};

module.exports = PaymentController;
