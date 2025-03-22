import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate } from '../../utils/format';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const SalesReport = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    customerId: '',
    productId: ''
  });
  
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        // Fetch customers
        const customersResponse = await fetch('http://localhost:5001/api/customers');
        if (!customersResponse.ok) {
          throw new Error('Failed to fetch customers');
        }
        const customersData = await customersResponse.json();
        setCustomers(customersData);
        
        // Fetch products
        const productsResponse = await fetch('http://localhost:5001/api/products');
        if (!productsResponse.ok) {
          throw new Error('Failed to fetch products');
        }
        const productsData = await productsResponse.json();
        setProducts(productsData);
        
        // Initial report fetch
        fetchReport();
      } catch (err) {
        console.error('Error fetching options:', err);
        setError('Could not load necessary data. Please try again later.');
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
        ...(filters.customerId && { customerId: filters.customerId }),
        ...(filters.productId && { productId: filters.productId })
      });
      
      const response = await fetch(`http://localhost:5001/api/reports/sales?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sales report');
      }
      
      const data = await response.json();
      
      const processedData = {
        totalInvoiced: parseFloat(data.summary.total_invoiced || 0),
        totalReceived: parseFloat(data.summary.total_received || 0),
        totalOutstanding: parseFloat(data.summary.total_outstanding || 0),
        invoices: (data.invoices || []).map(invoice => ({
          id: invoice.invoice_number,
          date: invoice.date,
          customerName: invoice.customer_name,
          amount: parseFloat(invoice.total_amount || 0),
          paid: parseFloat(invoice.amount_paid || 0),
          outstanding: parseFloat(invoice.amount_outstanding || 0),
          status: invoice.payment_status
        })),
        salesByDate: (data.salesByDay || []).map(day => ({
          date: day.date,
          count: parseInt(day.total_sales || 0),
          total: parseFloat(day.total_amount || 0)
        })),
        topProducts: (data.topProducts || []).map(product => ({
          name: product.product_name,
          quantity: parseInt(product.quantity),
          revenue: parseFloat(product.total_amount)
        })),
        topCustomers: (data.topCustomers || []).map(customer => ({
          name: customer.customer_name,
          invoices: parseInt(customer.total_purchases),
          total: parseFloat(customer.total_amount)
        }))
      };
      
      setReportData(processedData);
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
        ...(filters.productId && { productId: filters.productId }),
        format: 'csv'
      });
      
      const response = await fetch(`http://localhost:5001/api/reports/sales/export?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to export sales report');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `sales-report-${filters.startDate}-to-${filters.endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting report:', err);
      alert('Failed to export report. Please try again.');
    }
  };

  // Calculate average sale
  const getAverageSale = () => {
    if (!reportData || !reportData.totalInvoices || reportData.totalInvoices === 0) {
      return formatCurrency(0);
    }
    return formatCurrency(reportData.totalSales / reportData.totalInvoices);
  };

  const prepareChartData = (reportData) => {
    // Daily Sales Chart
    const dailySalesData = {
      labels: reportData.salesByDate.map(day => formatDate(day.date)),
      datasets: [
        {
          label: 'Daily Sales',
          data: reportData.salesByDate.map(day => day.total),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
          fill: false
        }
      ]
    };

    // Payment Status Chart
    const statusCounts = reportData.invoices.reduce((acc, inv) => {
      acc[inv.status] = (acc[inv.status] || 0) + 1;
      return acc;
    }, {});

    const paymentStatusData = {
      labels: Object.keys(statusCounts),
      datasets: [{
        data: Object.values(statusCounts),
        backgroundColor: [
          'rgb(34, 197, 94)',  // PAID - green
          'rgb(234, 179, 8)',  // PARTIAL - yellow
          'rgb(239, 68, 68)'   // UNPAID - red
        ]
      }]
    };

    // Top Products Chart
    const topProductsData = {
      labels: reportData.topProducts.map(product => product.name),
      datasets: [{
        label: 'Revenue',
        data: reportData.topProducts.map(product => product.revenue),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      }]
    };

    return { dailySalesData, paymentStatusData, topProductsData };
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Sales Report</h1>
        <Link 
          to="/reports" 
          className="bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300"
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
              <label htmlFor="productId" className="block text-sm font-medium text-gray-700 mb-1">
                Product
              </label>
              <select
                id="productId"
                name="productId"
                value={filters.productId}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Products</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium">Sales Summary</h2>
              <button
                onClick={handleExport}
                className="bg-green-500 text-white py-1 px-3 rounded text-sm hover:bg-green-600"
              >
                Export to CSV
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Total Sales (Invoiced)</p>
                <p className="text-2xl font-bold">{formatCurrency(reportData.totalInvoiced)}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Total Payments Received</p>
                <p className="text-2xl font-bold">{formatCurrency(reportData.totalReceived)}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-600 font-medium">Outstanding Receivables</p>
                <p className="text-2xl font-bold">{formatCurrency(reportData.totalOutstanding)}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Sales Transactions</h3>
            {reportData.invoices && reportData.invoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.invoices.map((invoice, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">{invoice.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{formatDate(invoice.date)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{invoice.customerName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium">{formatCurrency(invoice.amount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-green-600">{formatCurrency(invoice.paid)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-red-600">{formatCurrency(invoice.outstanding)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${invoice.status === 'PAID' ? 'bg-green-100 text-green-800' : 
                              invoice.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'}`}>
                            {invoice.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No sales data available for the selected period.</p>
            )}
          </div>
          
          {reportData.byDay && reportData.byDay.length > 0 && (
            <div className="p-6 border-t border-gray-200">
              <h3 className="text-lg font-medium mb-4">Sales Trends</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow">
                  <h4 className="text-sm font-medium text-gray-500 mb-4">Daily Sales Trend</h4>
                  <Line
                    data={prepareChartData(reportData).dailySalesData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { position: 'top' },
                        title: { display: false }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: value => formatCurrency(value)
                          }
                        }
                      }
                    }}
                  />
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow">
                  <h4 className="text-sm font-medium text-gray-500 mb-4">Payment Status Distribution</h4>
                  <div className="h-64">
                    <Doughnut
                      data={prepareChartData(reportData).paymentStatusData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { position: 'right' }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {reportData.topProducts && reportData.topProducts.length > 0 && (
            <div className="p-6 border-t border-gray-200">
              <h3 className="text-lg font-medium mb-4">Top Products Revenue</h3>
              <div className="bg-white p-4 rounded-lg shadow">
                <Bar
                  data={prepareChartData(reportData).topProductsData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { display: false },
                      title: { display: false }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: value => formatCurrency(value)
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          )}
          
          {reportData.topCustomers && reportData.topCustomers.length > 0 && (
            <div className="p-6 border-t border-gray-200">
              <h3 className="text-lg font-medium mb-4">Top Customers</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Invoices</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.topCustomers.map((customer, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {customer.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {customer.invoices}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                          {formatCurrency(customer.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <p>No report data available. Please adjust your filters and generate the report.</p>
        </div>
      )}
    </div>
  );
};

export default SalesReport; 