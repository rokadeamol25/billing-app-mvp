import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { purchaseAPI } from '../services/api';
import { formatCurrency } from '../utils/format';

const PurchaseView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchPurchase();
  }, [id]);

  const fetchPurchase = async () => {
    try {
      setLoading(true);
      const response = await purchaseAPI.getById(id);
      setPurchase(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching purchase:', err);
      setError('Could not load purchase. Please check your database connection.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      await purchaseAPI.updatePayment(id, { payment_status: newStatus });
      fetchPurchase();
    } catch (err) {
      console.error('Error updating purchase status:', err);
      setError('Failed to update purchase status. Please check your database connection.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center">
          <p>Loading purchase data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="p-4">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Not Found!</strong>
          <span className="block sm:inline"> The requested purchase could not be found.</span>
        </div>
      </div>
    );
  }

  // Calculate totals
  const subtotal = purchase.items?.reduce((total, item) => total + parseFloat(item.total_price || 0), 0) || 0;
  const taxAmount = purchase.tax_amount || 0;
  const totalAmount = purchase.total_amount || subtotal + taxAmount;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4 print:hidden">
        <h1 className="text-2xl font-bold">Purchase #{purchase.purchase_number}</h1>
        <div className="space-x-2">
          <Link to="/purchases" className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">
            Back to Purchases
          </Link>
          <button 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            onClick={handlePrint}
          >
            Print Purchase Order
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Purchase Details</h2>
            <div className="space-y-1">
              <p><span className="font-medium">Purchase Number:</span> {purchase.purchase_number}</p>
              <p><span className="font-medium">Date:</span> {new Date(purchase.purchase_date).toLocaleDateString()}</p>
              <p>
                <span className="font-medium">Status:</span> 
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  purchase.payment_status === 'Paid' ? 'bg-green-100 text-green-800' : 
                  purchase.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'
                }`}>
                  {purchase.payment_status || 'Pending'}
                </span>
              </p>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-2">Supplier Information</h2>
            <div className="space-y-1">
              <p><span className="font-medium">Supplier:</span> {purchase.supplier_name || 'N/A'}</p>
              <p><span className="font-medium">Email:</span> {purchase.supplier_email || 'N/A'}</p>
              <p><span className="font-medium">Phone:</span> {purchase.supplier_phone || 'N/A'}</p>
              <p><span className="font-medium">Address:</span> {purchase.supplier_address || 'N/A'}</p>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Purchase Items</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HSN/SAC</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST %</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {purchase.items && purchase.items.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.product_name || 'Unknown Product'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.hsn_sac_code || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {parseFloat(item.gst_rate || 0).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {item.unit_price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                     {item.total_price}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="flex justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-2">Notes</h2>
            <p className="text-gray-600">{purchase.notes || 'No notes provided.'}</p>
          </div>
          
          <div className="w-64">
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">GST:</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between py-2 font-bold">
              <span>Total:</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
            <div className="mt-4 print:hidden">
              {purchase.payment_status !== 'Paid' && (
                <button 
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded w-full"
                  onClick={() => handleStatusUpdate('Paid')}
                  disabled={updatingStatus}
                >
                  {updatingStatus ? 'Updating...' : 'Mark as Paid'}
                </button>
              )}
              {purchase.payment_status === 'Paid' && (
                <button 
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded w-full"
                  onClick={() => handleStatusUpdate('pending')}
                  disabled={updatingStatus}
                >
                  {updatingStatus ? 'Updating...' : 'Mark as Pending'}
                </button>
              )}
            </div>
          </div>
        </div>
        
        {error && (
          <p className="mt-6 text-red-500">{error}</p>
        )}
      </div>
    </div>
  );
};

export default PurchaseView;