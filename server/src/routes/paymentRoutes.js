const express = require('express');
const router = express.Router();

// Payment route for invoices
router.post('/invoices/:invoiceId/payments', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { amount, payment_method, reference_number, notes } = req.body;
    
    // Validate invoice exists
    const invoice = await db.query(
      'SELECT * FROM invoices WHERE id = $1',
      [invoiceId]
    );

    if (!invoice.rows[0]) {
      return res.status(404).json({
        success: false,
        message: `Invoice not found with ID: ${invoiceId}`
      });
    }

    // Record payment
    const result = await db.query(
      `INSERT INTO payments (invoice_id, amount, payment_method, reference_number, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [invoiceId, amount, payment_method, reference_number || null, notes || null]
    );

    // Update invoice paid amount
    await db.query(
      `UPDATE invoices 
       SET amount_paid = COALESCE(amount_paid, 0) + $1
       WHERE id = $2`,
      [amount, invoiceId]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Payment error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment'
    });
  }
});

module.exports = router; 