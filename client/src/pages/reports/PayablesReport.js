import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate } from '../../utils/format';

const PayablesReport = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    supplierId: '',
    agingPeriod: 'all'
  });
  
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/suppliers');
        if (!response.ok) {
          throw new Error('Failed to fetch suppliers');
        }
        const data = await response.json();
        setSuppliers(data);
      } catch (err) {
        console.error('Error fetching suppliers:', err);
      }
    };

    fetchSuppliers();
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
        ...(filters.supplierId && { supplierId: filters.supplierId }),
        ...(filters.agingPeriod !== 'all' && { agingPeriod: filters.agingPeriod })
      });
      
      const response = await fetch(`http://localhost:5000/api/reports/payables?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch payables report');
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
        ...(filters.supplierId && { supplierId: filters.supplierId }),
        ...(filters.agingPeriod !== 'all' && { agingPeriod: filters.agingPeriod }),
        format: 'csv'
      });
      
      const response = await fetch(`http://localhost:5000/api/reports/payables/export?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to export payables report');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `payables-report-${new Date().toISOString().split('T')[0]}.csv`;
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
          <h1 className="text-2xl font-extrabold text-[#1e2a4a]">Accounts Payable Report</h1>
          <p className="text-gray-600">Monitor payments due to suppliers and vendors</p>
        </div>
        <Link 
          to="/reports" 
          className="bg-gray-200 text-[#1e2a4a] py-2 px-4 rounded hover:bg-gray-300 transition-colors duration-200"
        >
          Back to Reports
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-[#1e2a4a] mb-4">Report Filters</h2>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#1e2a4a] focus:border-[#1e2a4a] transition-colors duration-200"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#1e2a4a] focus:border-[#1e2a4a] transition-colors duration-200"
              />
            </div>
            
            <div>
              <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700 mb-1">
                Supplier
              </label>
              <select
                id="supplierId"
                name="supplierId"
                value={filters.supplierId}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#1e2a4a] focus:border-[#1e2a4a] transition-colors duration-200"
              >
                <option value="">All Suppliers</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#1e2a4a] focus:border-[#1e2a4a] transition-colors duration-200"
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
              className="bg-[#1e2a4a] text-white py-2 px-4 rounded hover:bg-[#2a3b66] transition-colors duration-200"
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
              <h2 className="text-lg font-medium">Payables Summary</h2>
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
                <p className="text-sm text-green-600 font-medium">Total Purchases</p>
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
                <p className="text-sm text-gray-500">{reportData.agingSummary?.current?.count || 0} purchases</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">1-30 Days</p>
                <p className="text-xl font-bold">{formatCurrency(reportData.agingSummary?.['1-30']?.total || 0)}</p>
                <p className="text-sm text-gray-500">{reportData.agingSummary?.['1-30']?.count || 0} purchases</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-600 font-medium">31-60 Days</p>
                <p className="text-xl font-bold">{formatCurrency(reportData.agingSummary?.['31-60']?.total || 0)}</p>
                <p className="text-sm text-gray-500">{reportData.agingSummary?.['31-60']?.count || 0} purchases</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-orange-600 font-medium">61-90 Days</p>
                <p className="text-xl font-bold">{formatCurrency(reportData.agingSummary?.['61-90']?.total || 0)}</p>
                <p className="text-sm text-gray-500">{reportData.agingSummary?.['61-90']?.count || 0} purchases</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-600 font-medium">90+ Days</p>
                <p className="text-xl font-bold">{formatCurrency(reportData.agingSummary?.['90+']?.total || 0)}</p>
                <p className="text-sm text-gray-500">{reportData.agingSummary?.['90+']?.count || 0} purchases</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Outstanding Purchases</h3>
            {reportData.outstandingPurchases && reportData.outstandingPurchases.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aging Period</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.outstandingPurchases.map((purchase, index) => {
                      const agingPeriod = purchase.aging_period;
                      let rowClass = '';
                      
                      if (agingPeriod === '90+') rowClass = 'bg-red-50';
                      else if (agingPeriod === '61-90') rowClass = 'bg-orange-50';
                      else if (agingPeriod === '31-60') rowClass = 'bg-yellow-50';
                      else if (agingPeriod === '1-30') rowClass = 'bg-blue-50';
                      
                      return (
                        <tr key={purchase.id} className={rowClass}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link to={`/purchases/${purchase.id}`} className="text-blue-600 hover:text-blue-900">
                              {purchase.purchase_number}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">{purchase.supplier_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{formatDate(purchase.purchase_date)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{formatDate(purchase.due_date)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(purchase.total_amount)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right font-medium">{formatCurrency(purchase.balance)}</td>
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
              <p className="text-gray-500">No outstanding purchases found.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PayablesReport;