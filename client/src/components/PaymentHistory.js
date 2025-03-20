import React from 'react';
import { formatCurrency } from '../utils/formatters';

const PaymentHistory = ({ payments, invoice }) => {
  if (!payments || payments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Payment History</h2>
        <p className="text-gray-500">No payment records found.</p>
      </div>
    );
  }
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Calculate running balance
  let runningTotal = invoice.total_amount;
  const paymentsWithBalance = [...payments].map(payment => {
    runningTotal -= parseFloat(payment.amount);
    return {
      ...payment,
      balance_after: runningTotal
    };
  });
  
  // Sort by payment date (newest first)
  paymentsWithBalance.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));
  
  const getPaymentMethodBadge = (method) => {
    const badgeClasses = {
      'Cash': 'bg-green-100 text-green-800',
      'Credit Card': 'bg-blue-100 text-blue-800',
      'Bank Transfer': 'bg-indigo-100 text-indigo-800',
      'Check': 'bg-yellow-100 text-yellow-800',
      'Online': 'bg-purple-100 text-purple-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${badgeClasses[method] || 'bg-gray-100 text-gray-800'}`}>
        {method}
      </span>
    );
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Payment History</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance After</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paymentsWithBalance.map((payment, index) => (
              <tr key={payment.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(payment.payment_date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatCurrency(payment.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getPaymentMethodBadge(payment.payment_method)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {payment.reference_number || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  {formatCurrency(payment.balance_after)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {payment.notes || '-'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50">
              <td colSpan="4" className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                Current Balance:
              </td>
              <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                {formatCurrency(runningTotal)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default PaymentHistory; 