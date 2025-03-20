const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

/**
 * Send an email with invoice attachment
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @param {string} options.attachmentPath - Path to the attachment file
 * @returns {Promise<Object>} - Nodemailer info object
 */
async function sendEmail({ to, subject, text, html, attachmentPath }) {
  try {
    // For development/testing, use a mock function
    if (process.env.NODE_ENV === 'development' && process.env.MOCK_EMAIL === 'true') {
      console.log('MOCK EMAIL SENT:');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Text: ${text}`);
      console.log(`Attachment: ${attachmentPath}`);
      
      return {
        accepted: [to],
        rejected: [],
        response: 'Mock email sent successfully',
        messageId: `mock-${Date.now()}`
      };
    }

    // Create a transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      html
    };

    // Add attachment if provided
    if (attachmentPath && fs.existsSync(attachmentPath)) {
      mailOptions.attachments = [
        {
          filename: path.basename(attachmentPath),
          path: attachmentPath
        }
      ];
    }

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Send invoice email to customer
 * @param {Object} invoice - Invoice object
 * @param {Object} customer - Customer object
 * @param {string} pdfPath - Path to the invoice PDF
 * @returns {Promise<Object>} - Nodemailer info object
 */
async function sendInvoiceEmail(invoice, customer, pdfPath) {
  if (!customer.email) {
    throw new Error('Customer email is required');
  }

  const subject = `Invoice #${invoice.invoice_number} from Your Company`;
  
  const text = `Dear ${customer.name},

Thank you for your business!

Please find attached your invoice #${invoice.invoice_number} for the amount of ₹${invoice.total_amount.toFixed(2)}.

Invoice Date: ${new Date(invoice.invoice_date).toLocaleDateString()}
Due Date: ${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
Payment Method: ${invoice.payment_method}
Payment Status: ${invoice.payment_status}

If you have any questions regarding this invoice, please contact our customer service.

Best regards,
Your Company Team`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { width: 100%; max-width: 600px; margin: 0 auto; }
    .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; }
    .invoice-details { margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Invoice #${invoice.invoice_number}</h2>
    </div>
    <div class="content">
      <p>Dear ${customer.name},</p>
      <p>Thank you for your business!</p>
      <p>Please find attached your invoice #${invoice.invoice_number} for the amount of ₹${invoice.total_amount.toFixed(2)}.</p>
      
      <div class="invoice-details">
        <table>
          <tr>
            <th>Invoice Date</th>
            <td>${new Date(invoice.invoice_date).toLocaleDateString()}</td>
          </tr>
          <tr>
            <th>Due Date</th>
            <td>${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}</td>
          </tr>
          <tr>
            <th>Payment Method</th>
            <td>${invoice.payment_method}</td>
          </tr>
          <tr>
            <th>Payment Status</th>
            <td>${invoice.payment_status}</td>
          </tr>
        </table>
      </div>
      
      <p>If you have any questions regarding this invoice, please contact our customer service.</p>
      
      <p>Best regards,<br>Your Company Team</p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply to this message.</p>
      <p>© ${new Date().getFullYear()} Your Company. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

  return sendEmail({
    to: customer.email,
    subject,
    text,
    html,
    attachmentPath: pdfPath
  });
}

module.exports = {
  sendEmail,
  sendInvoiceEmail
}; 