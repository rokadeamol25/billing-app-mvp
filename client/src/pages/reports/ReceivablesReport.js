import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate } from '../../utils/format';

const ReceivablesReport = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    customerId: '',
    agingPeriod: 'all'
  });
  
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/customers');
        if (!response.ok) {
          throw new Error('Failed to fetch customers');
        }
        const data = await response.json();
        setCustomers(data);
      } catch (err) {
        console.error('Error fetching customers:', err);
      }
    };

    fetchCustomers();
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
        ...(filters.customerId && { customerId: filters.customerId }),
        ...(filters.agingPeriod !== 'all' && { agingPeriod: filters.agingPeriod })
      });
      
      const response = await fetch(`http://localhost:5000/api/reports/receivables?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch receivables report');
      }
      
      const data = await response.json();
      setReportData(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Could not load report data. Please try again later.');
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchReport();
  };

  const handleExport = async () => {
    try {
      const queryParams = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
        ...(filters.customerId && { customerId: filters.customerId }),
        ...(filters.agingPeriod !== 'all' && { agingPeriod: filters.agingPeriod }),
        format: 'csv'
      });
      
      const response = await fetch(`http://localhost:5000/api/reports/receivables/export?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to export receivables report');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `receivables-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting report:', err);
      alert('Failed to export report. Please try again.');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1e2a4a]">Accounts Receivable Report</h1>
          <p className="text-gray-600">Track outstanding customer payments and aging</p>
        </div>
        <Link 
          to="/reports" 
          className="bg-gray-200 text-[#1e2a4a] py-2 px-4 rounded hover:bg-gray-300 transition-colors duration-200"
        >
          Back to Reports
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Report Filters</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 mb-1">
                Customer
              </label>
              <select
                id="customerId"
                name="customerId"
                value={filters.customerId}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Customers</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="agingPeriod" className="block text-sm font-medium text-gray-700 mb-1">
                Aging Period
              </label>
              <select
                id="agingPeriod"
                name="agingPeriod"
                value={filters.agingPeriod}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All</option>
                <option value="current">Current</option>
                <option value="1-30">1-30 days</option>
                <option value="31-60">31-60 days</option>
                <option value="61-90">61-90 days</option>
                <option value="90+">90+ days</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              Generate Report
            </button>
          </div>
        </form>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-lg">Loading report data...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      ) : reportData ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Receivables Summary</h2>
              <button
                onClick={handleExport}
                className="bg-green-500 text-white py-1 px-3 rounded text-sm hover:bg-green-600"
              >
                Export to CSV
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Total Outstanding</p>
                <p className="text-2xl font-bold">{formatCurrency(reportData.totalOutstanding || 0)}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Total Invoices</p>
                <p className="text-2xl font-bold">{reportData.totalCount || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium mb-4">Aging Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Current</p>
                <p className="text-xl font-bold">{formatCurrency(reportData.agingSummary?.current?.total || 0)}</p>
                <p className="text-sm text-gray-500">{reportData.agingSummary?.current?.count || 0} invoices</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">1-30 Days</p>
                <p className="text-xl font-bold">{formatCurrency(reportData.agingSummary?.['1-30']?.total || 0)}</p>
                <p className="text-sm text-gray-500">{reportData.agingSummary?.['1-30']?.count || 0} invoices</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-600 font-medium">31-60 Days</p>
                <p className="text-xl font-bold">{formatCurrency(reportData.agingSummary?.['31-60']?.total || 0)}</p>
                <p className="text-sm text-gray-500">{reportData.agingSummary?.['31-60']?.count || 0} invoices</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-orange-600 font-medium">61-90 Days</p>
                <p className="text-xl font-bold">{formatCurrency(reportData.agingSummary?.['61-90']?.total || 0)}</p>
                <p className="text-sm text-gray-500">{reportData.agingSummary?.['61-90']?.count || 0} invoices</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-600 font-medium">90+ Days</p>
                <p className="text-xl font-bold">{formatCurrency(reportData.agingSummary?.['90+']?.total || 0)}</p>
                <p className="text-sm text-gray-500">{reportData.agingSummary?.['90+']?.count || 0} invoices</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Outstanding Invoices</h3>
            {reportData.outstandingInvoices && reportData.outstandingInvoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aging Period</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.outstandingInvoices.map((invoice, index) => {
                      const agingPeriod = invoice.aging_period;
                      let rowClass = '';
                      
                      if (agingPeriod === '90+') rowClass = 'bg-red-50';
                      else if (agingPeriod === '61-90') rowClass = 'bg-orange-50';
                      else if (agingPeriod === '31-60') rowClass = 'bg-yellow-50';
                      else if (agingPeriod === '1-30') rowClass = 'bg-blue-50';
                      
                      return (
                        <tr key={invoice.id} className={rowClass}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link to={`/invoices/${invoice.id}`} className="text-blue-600 hover:text-blue-900">
                              {invoice.invoice_number}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">{invoice.customer_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{formatDate(invoice.invoice_date)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{formatDate(invoice.due_date)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(invoice.total_amount)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right font-medium">{formatCurrency(invoice.balance)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${agingPeriod === 'current' ? 'bg-green-100 text-green-800' : 
                                agingPeriod === '1-30' ? 'bg-blue-100 text-blue-800' : 
                                agingPeriod === '31-60' ? 'bg-yellow-100 text-yellow-800' : 
                                agingPeriod === '61-90' ? 'bg-orange-100 text-orange-800' : 
                                'bg-red-100 text-red-800'}`}>
                              {agingPeriod === 'current' ? 'Current' : 
                               agingPeriod === '1-30' ? '1-30 days' : 
                               agingPeriod === '31-60' ? '31-60 days' : 
                               agingPeriod === '61-90' ? '61-90 days' : 
                               '90+ days'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No outstanding invoices found.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ReceivablesReport;