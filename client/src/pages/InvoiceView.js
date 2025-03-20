import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PaymentForm from '../components/PaymentForm';
import PaymentHistory from '../components/PaymentHistory';
import { formatCurrency } from '../utils/formatters';

const InvoiceView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payments, setPayments] = useState([]);
  const [amountPaid, setAmountPaid] = useState(0);
  const [balanceDue, setBalanceDue] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState('Pending');

  const fetchInvoice = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/invoices/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch invoice');
      }
      const data = await response.json();
      setInvoice(data);
      
      // Fetch payments separately
      const paymentsResponse = await fetch(`http://localhost:5000/api/invoices/${id}/payment-history`);
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        setPayments(paymentsData.data?.payments || []);
        
        // Calculate total paid amount
        const totalPaid = paymentsData.data?.total_paid || 0;
        setAmountPaid(totalPaid);
        setBalanceDue(paymentsData.data?.remaining_balance || data.total_amount);
        
        // Set payment status from API response
        setPaymentStatus(paymentsData.data?.payment_status || data.status);
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/invoices/${id}/pdf`, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `Invoice-${invoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const handleSendEmail = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/invoices/${id}/email`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to send email');
      }
      
      alert('Invoice has been sent to the customer via email.');
    } catch (err) {
      console.error('Error sending email:', err);
      alert('Failed to send email. Please try again.');
    }
  };

  const handlePaymentRecorded = useCallback((paymentData) => {
    // Refresh invoice data after payment is recorded
    fetchInvoice();
  }, [fetchInvoice]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg">Loading invoice...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Not Found!</strong>
        <span className="block sm:inline"> The requested invoice could not be found.</span>
      </div>
    );
  }

  const isPaid = paymentStatus === 'Paid';

  return (
    <div>
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h1 className="text-2xl font-semibold">Invoice #{invoice.invoice_number}</h1>
        <div className="flex space-x-2">
          <button
            onClick={handlePrint}
            className="bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300"
          >
            Print
          </button>
          <button
            onClick={handleDownloadPDF}
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Download PDF
          </button>
          <button
            onClick={handleSendEmail}
            className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
          >
            Send Email
          </button>
          <Link
            to={`/invoices/edit/${id}`}
            className="bg-indigo-500 text-white py-2 px-4 rounded hover:bg-indigo-600"
          >
            Edit
          </Link>
          <button
            onClick={() => navigate('/invoices')}
            className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
          >
            Back
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold mb-1">INVOICE</h2>
            <p className="text-gray-600">#{invoice.invoice_number}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">Status: <span className={`px-2 py-1 rounded-full text-xs ${
              isPaid
                ? 'bg-green-100 text-green-800' 
                : paymentStatus === 'Partially Paid'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-red-100 text-red-800'
            }`}>{paymentStatus}</span></p>
            <p className="text-gray-600 mt-1">Date: {new Date(invoice.invoice_date).toLocaleDateString()}</p>
            <p className="text-gray-600">Due Date: {new Date(invoice.due_date).toLocaleDateString()}</p>
            
            {amountPaid > 0 && (
              <>
                <p className="text-gray-600 mt-2">Amount Paid: {formatCurrency(amountPaid)}</p>
                <p className="text-gray-600">Balance Due: {formatCurrency(balanceDue || (invoice.total_amount - amountPaid))}</p>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-gray-500 mb-2">From:</h3>
            <p className="font-bold">Swaymbhu Enterprise</p>
            <p>Kolgaon Phata, Kolgaon,</p>
            <p>Ahilyanagar Maharashtra 413728</p>
            <p>Mobile: 7972222584</p>
            <p>Email: vikasceat@gmail.com</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-500 mb-2">To:</h3>
            <p className="font-bold">{invoice.customer_name}</p>
            <p>{invoice.customer_address || 'No address provided'}</p>
            <p>Phone: {invoice.customer_phone || 'N/A'}</p>
            <p>Email: {invoice.customer_email || 'N/A'}</p>
          </div>
        </div>

        <div className="mb-8">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HSN/SAC</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">GST %</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoice.items && invoice.items.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.product_name || 'Product'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.hsn_sac_code || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {parseFloat(item.gst_rate || 0).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {item.discount_percentage ? `${item.discount_percentage}%` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {formatCurrency(item.total_price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex justify-end">
          <div className="w-80 border rounded-md overflow-hidden">
            <div className="px-6 py-3 bg-gray-50 border-b flex justify-between">
              <span className="font-medium">Subtotal:</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            
            <div className="px-6 py-3 bg-white border-b flex justify-between">
              <span className="font-medium">GST:</span>
              <span>{formatCurrency(invoice.tax_amount)}</span>
            </div>
            
            <div className="px-6 py-3 bg-blue-500 text-white flex justify-between font-bold">
              <span>Total:</span>
              <span>{formatCurrency(invoice.total_amount)}</span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-8 pt-4 border-t border-gray-200">
            <h3 className="font-semibold text-gray-500 mb-2">Notes:</h3>
            <p className="text-gray-600">{invoice.notes}</p>
          </div>
        )}
        
        <div className="mt-8 pt-4 border-t border-gray-200 text-center text-gray-500 text-sm">
          <p>Thank you for your business!</p>
        </div>
      </div>
      
      {!isPaid && (
        <PaymentForm 
          invoice={invoice} 
          onPaymentRecorded={handlePaymentRecorded} 
          amountPaid={amountPaid}
        />
      )}
      
      {payments.length > 0 && (
        <PaymentHistory 
          payments={payments} 
          invoice={invoice} 
        />
      )}
    </div>
  );
};

export default InvoiceView; 