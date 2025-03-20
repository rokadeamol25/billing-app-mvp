const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

/**
 * Helper function to safely format currency values
 * @param {any} value - The value to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted currency value
 */
function formatCurrency(value, decimals = 2) {
  if (value === null || value === undefined || value === '') return '0.00';
  const numValue = typeof value === 'string' ? parseFloat(value) : (typeof value === 'number' ? value : 0);
  if (isNaN(numValue)) return '0.00';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(numValue);
}

/**
 * Convert number to words for Indian currency
 * @param {number} amount - Amount to convert
 * @returns {string} - Amount in words
 */
function amountToWords(amount) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  function convertToWords(num) {
    if (num === 0) return '';
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' and ' + convertToWords(num % 100) : '');
    if (num < 100000) return convertToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + convertToWords(num % 1000) : '');
    if (num < 10000000) return convertToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + convertToWords(num % 100000) : '');
    return convertToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + convertToWords(num % 10000000) : '');
  }

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return 'Zero Rupees Only';
  
  const [rupees, paise] = numAmount.toFixed(2).split('.');
  let result = convertToWords(parseInt(rupees)) + ' Rupees';
  if (parseInt(paise) > 0) {
    result += ' and ' + convertToWords(parseInt(paise)) + ' Paise';
  }
  return result + ' Only';
}

/**
 * Generate a PDF invoice with a professional design
 * @param {Object} invoice - The invoice object with all details
 * @param {Object} customer - The customer object
 * @param {Array} items - Array of invoice items with product details
 * @returns {Promise<string>} - Path to the generated PDF file
 */
async function generateInvoicePDF(invoice, customer, items) {
  return new Promise((resolve, reject) => {
    try {
      // Initialize document with professional settings
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4',
        bufferPages: true,
        info: {
          Title: `Invoice ${invoice.invoice_number}`,
          Author: 'Swaymbhu Enterprises',
          Subject: 'Invoice Document',
          Keywords: 'invoice, business, payment',
          CreationDate: new Date()
        }
      });
      
      const pdfStoragePath = path.join(__dirname, '..', '..', 'storage', 'invoices');
      const fileName = `invoice_${invoice.invoice_number}.pdf`;
      const filePath = path.join(pdfStoragePath, fileName);
      
      if (!fs.existsSync(pdfStoragePath)) {
        fs.mkdirSync(pdfStoragePath, { recursive: true });
      }
      
      const stream = fs.createWriteStream(filePath);
      stream.on('error', reject);
      doc.pipe(stream);
      
      // Document measurements
      const pageWidth = doc.page.width; // 595 for A4
      const margin = 50;
      const contentWidth = pageWidth - (margin * 2); // 495 for A4 with 50 margins
      console.log('Content Width:', contentWidth); // Debugging

      // Professional monochromatic color scheme
      const colors = {
        primary: '#333333',     // Dark gray
        secondary: '#f8f8f8',   // Light background
        accent: '#666666',      // Medium gray
        text: '#1a1a1a',        // Near black
        subtext: '#757575',     // Muted text
        success: '#4a4a4a',     // Dark gray
        error: '#8b0000',       // Dark red
        border: '#e0e0e0',      // Light gray border
        highlight: '#f5f5f5'    // Very light gray highlight
      };

      // Header section with gradient effect
      const gradient = doc.linearGradient(0, 0, pageWidth, 0);
      gradient.stop(0, colors.primary)
             .stop(1, colors.accent);
      
      doc.rect(0, 0, pageWidth, 160)
         .fill(gradient);

      // Company logo/name with modern styling
      doc.fontSize(28)
         .font('Helvetica-Bold')
         .fillColor('#ffffff')
         .text('Swaymbhu Enterprise', margin, 35, {
           characterSpacing: 1,
           lineGap: 0,
           align: 'left'
         });

      // Company details in white
      doc.fontSize(9)
         .font('Helvetica')
         .text('Kolgaon 1002/1, AHM MD 74,', margin, 70, { align: 'left' })
         .text('Kolgaon Phata, Kolgaon,', margin, 85, { align: 'left' })
         .text('Ahilyanagar Maharashtra 413728', margin, 100, { align: 'left' })
         .text('Mobile: 7972222584', margin, 115, { align: 'left' }) 
         .text('Email: vikasceat@gmail.com', margin, 130, { align: 'left' });

      // Invoice title and number
      const invoiceDate = moment(invoice.invoice_date);
      doc.fontSize(28)
         .font('Helvetica-Bold')
         .text('INVOICE', pageWidth - 200, 40, { align: 'right' })
         .fontSize(10)
         .font('Helvetica')
         .text(`#${invoice.invoice_number}`, pageWidth - 200, 75, { align: 'right' })
         .text(invoiceDate.format('DD MMM YYYY'), pageWidth - 200, 90, { align: 'right' });

      // White background for content
      doc.rect(margin - 10, 180, contentWidth + 20, 600)
         .fill('#ffffff')
         .stroke(colors.border);

      // Bill To section
      doc.fillColor(colors.text)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('BILL TO', margin, 200)
         .fontSize(10)
         .font('Helvetica')
         .text(customer.name, margin, 220)
         .fillColor(colors.subtext)
         .text(customer.address || '', margin, 235)
         .text(customer.phone || '', margin, 250)
         .text(customer.email || '', margin, 265);

      // Invoice details on right
      doc.fillColor(colors.text)
         .font('Helvetica-Bold')
         .text('INVOICE DETAILS', pageWidth - 200, 200, { lineGap: 0 })
         .font('Helvetica')
         .fontSize(9)
         .text('Due Date:', pageWidth - 200, 220, { lineGap: 0 })
         .text(moment(invoice.due_date || invoice.invoice_date).format('DD MMM YYYY'), pageWidth - 100, 220, { align: 'right', lineGap: 0 })
         .text('Terms:', pageWidth - 200, 240, { lineGap: 0 })
         .text('Due on Receipt', pageWidth - 100, 240, { align: 'right', lineGap: 0 })
         .text('Balance Due:', pageWidth - 200, 260, { lineGap: 0 })
         .font('Helvetica-Bold')
         .fillColor(colors.primary)
         .text(formatCurrency(invoice.balance_due || 0), pageWidth - 100, 260, { align: 'right', lineGap: 0 });

      // Enhanced items table
      const tableTop = 300;
      const tableHeaders = ['#', 'Item & Description', 'HSN/SAC', 'Qty', 'Rate', 'Amount'];
      const minColumnWidths = [30, 150, 80, 50, 50, 60]; // Adjusted minimum widths
      const cellPadding = 8; // Adjusted padding for better spacing

      // Calculate dynamic column widths based on header and content
      let columnWidths = [30, contentWidth * 0.30, contentWidth * 0.15, contentWidth * 0.15, contentWidth * 0.15, contentWidth * 0.25];
      doc.font('Helvetica-Bold').fontSize(10); // Set font for header width calculation
      tableHeaders.forEach((header, i) => {
        const headerWidth = doc.widthOfString(header) + cellPadding * 2;
        columnWidths[i] = Math.max(columnWidths[i], headerWidth);
      });

      // Check widest content in rows and adjust column widths proportionally
      doc.font('Helvetica').fontSize(9);
      items.forEach((item) => {
        const descWidth = doc.widthOfString(item.product_name || '');
        if (descWidth > columnWidths[1] - cellPadding * 2) {
          const overflow = descWidth - (columnWidths[1] - cellPadding * 2);
          const redistributeWidth = overflow / 3;
          columnWidths[2] += redistributeWidth;
          columnWidths[3] += redistributeWidth;
          columnWidths[4] += redistributeWidth;
          columnWidths[1] = descWidth + cellPadding * 2;
        }
      });

      // Ensure total width fits within contentWidth and distribute remaining space
      let totalWidth = columnWidths.reduce((sum, width) => sum + width, 0);
      if (totalWidth < contentWidth) {
        const extraSpace = contentWidth - totalWidth;
        columnWidths[1] += extraSpace * 0.4;
        columnWidths[3] += extraSpace * 0.3;
        columnWidths[4] += extraSpace * 0.3;
      } else if (totalWidth > contentWidth) {
        const scaleFactor = contentWidth / totalWidth;
        columnWidths = columnWidths.map(width => Math.floor(width * scaleFactor));
      }
      console.log('Adjusted Column Widths:', columnWidths);
      console.log('Total Column Width:', columnWidths.reduce((sum, width) => sum + width, 0));

      const startX = margin;
      const rowHeight = 30;

      // Modern table header with gradient
      const headerGradient = doc.linearGradient(margin - 10, 0, margin - 10 + contentWidth + 20, 0);
      headerGradient.stop(0, colors.primary)
                    .stop(1, colors.accent);
      
      doc.rect(margin - 10, tableTop - 5, contentWidth + 20, 25)
         .fill(headerGradient);

      // Enhanced table headers with proper alignment and improved text rendering
      let xPos = startX;
      doc.fillColor('#ffffff')
         .font('Helvetica-Bold')
         .fontSize(10);

      tableHeaders.forEach((header, i) => {
        doc.text(header, xPos + cellPadding, tableTop, {
          width: columnWidths[i] - cellPadding * 2,
          align: i === 3 || i === 4 || i === 5 ? 'right' : 'left',
          lineGap: 0,
          characterSpacing: 0.5
        });
        xPos += columnWidths[i];
      });

      // Table rows
      let yPos = tableTop + 30;
      doc.font('Helvetica').fontSize(9);

      items.forEach((item, index) => {
        xPos = startX;

        // Enhanced zebra striping with subtle shadow
        if (index % 2 === 0) {
          doc.rect(margin - 10, yPos - 5, contentWidth + 20, rowHeight)
             .fill(colors.highlight);
          doc.rect(margin - 10, yPos - 5, contentWidth + 20, rowHeight)
             .fillOpacity(0.5)
             .fill('white');
        }
        doc.fillColor(colors.text);

        // Calculate positions for better alignment
        const descX = xPos + columnWidths[0];
        const hsnX = descX + columnWidths[1];
        const qtyX = hsnX + columnWidths[2];
        const rateX = qtyX + columnWidths[3];
        const amountX = rateX + columnWidths[4];

        const itemRate = item.unit_price || item.rate || 0;
        const itemQuantity = item.quantity || 0;
        const itemAmount = parseFloat(itemRate) * parseFloat(itemQuantity);
        doc.fillColor(colors.text)
           // Index number
           .text((index + 1).toString(), xPos + cellPadding, yPos, { width: columnWidths[0] - cellPadding * 2, align: 'left' })
           // Product name with proper width
           .text(item.product_name, descX + cellPadding, yPos, { width: columnWidths[1] - cellPadding * 2, align: 'left' })
           // HSN/SAC code
           .text(item.hsn_sac_code || '', hsnX + cellPadding, yPos, { width: columnWidths[2] - cellPadding * 2, align: 'left' })
           // Quantity with right alignment
           .text(itemQuantity.toString(), qtyX + cellPadding, yPos, { width: columnWidths[3] - cellPadding * 2, align: 'right' })
           .fontSize(8)
           .text('pcs', qtyX + cellPadding, yPos + 12, { width: columnWidths[3] - cellPadding * 2, align: 'right' })
           .fontSize(9)
           // Rate with right alignment
           .text(formatCurrency(itemRate).replace(/[^0-9.]/g, ''), rateX + cellPadding, yPos, { width: columnWidths[4] - cellPadding * 2, align: 'right' })
           // Amount with right alignment
           .text(formatCurrency(itemAmount).replace(/[^0-9.]/g, ''), amountX + cellPadding, yPos, { width: columnWidths[5] - cellPadding * 2, align: 'right' });


        yPos += 30;
      });

      // Totals section
      yPos += 20;
      const totalsWidth = 200;
      const totalsX = pageWidth - totalsWidth - margin;
      const valuesX = pageWidth - margin;

      // Sub Total
      doc.font('Helvetica-Bold')
         .text('Sub Total:', totalsX, yPos, { width: totalsWidth * 0.5, align: 'right' })
         .fontSize(12)
         .text(formatCurrency(invoice.subtotal).replace(/[^0-9.]/g, ''), totalsX + totalsWidth * 0.5, yPos, { width: totalsWidth * 0.5, align: 'right', lineGap: 0 })
         .fontSize(10);

      // GST
      yPos += 20;
      doc.font('Helvetica-Bold')
         .text('GST:', totalsX, yPos, { width: totalsWidth * 0.5, align: 'right' })
         .fontSize(12)
         .text(formatCurrency(invoice.tax_amount || 0).replace(/[^0-9.]/g, ''), totalsX + totalsWidth * 0.5, yPos, { width: totalsWidth * 0.5, align: 'right', lineGap: 0 })
         .fontSize(10);

      // Total
      yPos += 20;
      doc.font('Helvetica-Bold')
         .text('Total:', totalsX, yPos, { width: totalsWidth * 0.5, align: 'right' })
         .fontSize(14)
         .text(formatCurrency(invoice.total_amount).replace(/[^0-9.]/g, ''), totalsX + totalsWidth * 0.5, yPos, { width: totalsWidth * 0.5, align: 'right', lineGap: 0 })
         .fontSize(10);

      // Total In Words
      yPos += 30;
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .text('Total In Words:', margin, yPos)
         .font('Helvetica-Bold')
         .text(`Indian Rupee ${amountToWords(invoice.total_amount)}`, margin + 80, yPos);

      // Signature and Thank You Note
      yPos += 40;
      doc.fontSize(9)
         .font('Helvetica')
         .text('Authorized Signature', margin, yPos)
         .moveTo(margin, yPos + 40)
         .lineTo(margin + 150, yPos + 40)
         .stroke()
         .font('Helvetica')
         .text('Thanks for your business.', pageWidth - 200, yPos + 20, { align: 'right' });

      doc.end();
      
      stream.on('finish', () => {
        resolve(filePath);
      });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateInvoicePDF
};