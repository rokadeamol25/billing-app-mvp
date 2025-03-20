import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDate, formatCurrency } from '../../utils/format';

const defaultData = {
  summary: {
    revenue: {
      total_revenue: 0,
      total_tax_collected: 0,
      invoice_count: 0
    },
    cogs: {
      total_cogs: 0,
      total_tax_paid: 0,
      purchase_count: 0
    },
    gross_profit: 0,
    profit_margin: 0
  },
  profitByCategory: [],
  monthlyBreakdown: []
};

const ProfitLossReport = () => {
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState(defaultData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate
      });
      
      const response = await fetch(`http://localhost:5000/api/reports/profit-loss?${queryParams}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch report data');
      }
      
      const data = await response.json();
      setReportData(data);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(err.message);
      setReportData(defaultData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchReport();
  };

  return (
    <div className="container-fluid">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1e2a4a]">Profit & Loss Report</h1>
          <p className="text-gray-600">Analyze your business profitability over time</p>
        </div>
        <Link to="/reports" className="bg-gray-200 text-[#1e2a4a] py-2 px-4 rounded hover:bg-gray-300 transition-colors duration-200">
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
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#1e2a4a] focus:border-[#1e2a4a] transition-colors duration-200"
                max={filters.endDate}
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#1e2a4a] focus:border-[#1e2a4a] transition-colors duration-200"
                min={filters.startDate}
              />
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium mb-4">Financial Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(reportData.summary?.revenue?.total_revenue || 0)}</p>
                <p className="text-sm text-blue-600 mt-2">Tax Collected: {formatCurrency(reportData.summary?.revenue?.total_tax_collected || 0)}</p>
                <p className="text-sm text-blue-600">Invoices: {reportData.summary?.revenue?.invoice_count || 0}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-600 font-medium">Cost of Goods Sold</p>
                <p className="text-2xl font-bold">{formatCurrency(reportData.summary?.cogs?.total_cogs || 0)}</p>
                <p className="text-sm text-red-600 mt-2">Tax Paid: {formatCurrency(reportData.summary?.cogs?.total_tax_paid || 0)}</p>
                <p className="text-sm text-red-600">Purchases: {reportData.summary?.cogs?.purchase_count || 0}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Gross Profit</p>
                <p className="text-2xl font-bold">{formatCurrency(reportData.summary?.gross_profit || 0)}</p>
                <p className="text-sm text-green-600 mt-2">
                  Margin: {((reportData.summary?.profit_margin || 0) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">Total Tax</p>
                <p className="text-2xl font-bold">
                  {formatCurrency((reportData.summary?.revenue?.total_tax_collected || 0) - (reportData.summary?.cogs?.total_tax_paid || 0))}
                </p>
                <p className="text-sm text-purple-600 mt-2">Net Tax Position</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Profit by Category</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.profitByCategory?.map((category, index) => {
                    const margin = category.revenue > 0 ? ((category.profit / category.revenue) * 100) : 0;
                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{category.category_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(category.revenue)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(category.cost)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className={category.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(category.profit)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className={margin >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {margin.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {reportData.monthlyBreakdown?.length > 0 && (
            <div className="p-6 border-t border-gray-200">
              <h3 className="text-lg font-medium mb-4">Monthly Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">COGS</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Profit</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.monthlyBreakdown.map((month, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{formatDate(month.month)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(month.revenue)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(month.cogs)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className={month.gross_profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(month.gross_profit)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfitLossReport;