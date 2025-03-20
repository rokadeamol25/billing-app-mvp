import React, { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '../utils/format';

const Dashboard = () => {
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalPurchases: 0,
    totalCustomers: 0,
    totalProducts: 0,
    recentInvoices: [],
    recentPurchases: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/dashboard/summary');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const data = await response.json();
        // Ensure we have default values for all properties
        setSummary({
          totalSales: parseFloat(data.sales?.currentMonth?.revenue || 0),
          totalPurchases: parseFloat(data.purchases?.currentMonth?.expenses || 0),
          totalCustomers: parseInt(data.customers?.total || 0),
          totalProducts: parseInt(data.inventory?.productCount || 0),
          recentInvoices: data.recentInvoices || [],
          recentPurchases: data.recentPurchases || []
        });
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Could not load dashboard data. Please try again later.');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg">Loading dashboard data...</p>
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-[#1e2a4a]">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
          <h2 className="text-gray-600 text-sm font-medium mb-2">Total Sales</h2>
          <p className="text-2xl font-bold text-[#1e2a4a]">{formatCurrency(summary.totalSales)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
          <h2 className="text-gray-600 text-sm font-medium mb-2">Total Purchases</h2>
          <p className="text-2xl font-bold text-[#1e2a4a]">{formatCurrency(summary.totalPurchases)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
          <h2 className="text-gray-600 text-sm font-medium mb-2">Total Customers</h2>
          <p className="text-2xl font-bold text-[#1e2a4a]">{summary.totalCustomers || 0}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
          <h2 className="text-gray-600 text-sm font-medium mb-2">Total Products</h2>
          <p className="text-2xl font-bold text-[#1e2a4a]">{summary.totalProducts || 0}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-[#1e2a4a] mb-4">Recent Invoices</h2>
          {summary.recentInvoices && summary.recentInvoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-[#1e2a4a]/5">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#1e2a4a] uppercase tracking-wider">Invoice #</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#1e2a4a] uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#1e2a4a] uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#1e2a4a] uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {summary.recentInvoices.map((invoice, index) => (
                    <tr key={invoice.id || index} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.invoice_number || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.customer_name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(invoice.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.invoice_date ? formatDate(invoice.invoice_date) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent invoices found.</p>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-[#1e2a4a] mb-4">Recent Purchases</h2>
          {summary.recentPurchases && summary.recentPurchases.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-[#1e2a4a]/5">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#1e2a4a] uppercase tracking-wider">Purchase #</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#1e2a4a] uppercase tracking-wider">Supplier</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#1e2a4a] uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#1e2a4a] uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {summary.recentPurchases.map((purchase, index) => (
                    <tr key={purchase.id || index} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{purchase.purchase_number || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{purchase.supplier_name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(purchase.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {purchase.purchase_date ? formatDate(purchase.purchase_date) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent purchases found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;