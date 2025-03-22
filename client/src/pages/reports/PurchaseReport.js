import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate } from '../../utils/format';

const PurchaseReport = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    supplierId: '',
    productId: ''
  });
  
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        // Fetch suppliers
        const suppliersResponse = await fetch('http://localhost:5001/api/suppliers');
        if (!suppliersResponse.ok) {
          throw new Error('Failed to fetch suppliers');
        }
        const suppliersData = await suppliersResponse.json();
        setSuppliers(suppliersData);
        
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
        ...(filters.supplierId && { supplierId: filters.supplierId }),
        ...(filters.productId && { productId: filters.productId })
      });
      
      const response = await fetch(`http://localhost:5001/api/reports/purchases?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch purchase report');
      }
      
      const data = await response.json();
      
      // Process the data to ensure all values are properly formatted
      const processedData = {
        ...data,
        totalPurchases: parseFloat(data.summary?.total_amount || 0),
        totalOrders: parseInt(data.summary?.total_purchases || 0),
        purchasesByDate: data.byDay?.map(item => ({
          ...item,
          date: item.date,
          count: parseInt(item.count || 0),
          total: parseFloat(item.total_amount || 0)
        })) || [],
        topProducts: data.topProducts?.map(product => ({
          ...product,
          name: product.name || 'Unknown Product',
          quantity: parseInt(product.total_quantity || 0),
          cost: parseFloat(product.total_amount || 0)
        })) || [],
        topSuppliers: data.topSuppliers?.map(supplier => ({
          ...supplier,
          name: supplier.name || 'Unknown Supplier',
          purchases: parseInt(supplier.purchase_count || 0),
          total: parseFloat(supplier.total_amount || 0)
        })) || []
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
        ...(filters.supplierId && { supplierId: filters.supplierId }),
        ...(filters.productId && { productId: filters.productId }),
        format: 'csv'
      });
      
      const response = await fetch(`http://localhost:5001/api/reports/purchases/export?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to export purchase report');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `purchase-report-${filters.startDate}-to-${filters.endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting report:', err);
      alert('Failed to export report. Please try again.');
    }
  };

  // Calculate average purchase
  const getAveragePurchase = () => {
    if (!reportData || !reportData.totalOrders || reportData.totalOrders === 0) {
      return formatCurrency(0);
    }
    return formatCurrency(reportData.totalPurchases / reportData.totalOrders);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1e2a4a]">Purchase Report</h1>
          <p className="text-gray-600">Analyze purchase data by date range, supplier, or product</p>
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
              <label htmlFor="productId" className="block text-sm font-medium text-gray-700 mb-1">
                Product
              </label>
              <select
                id="productId"
                name="productId"
                value={filters.productId}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#1e2a4a] focus:border-[#1e2a4a] transition-colors duration-200"
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
          
          <div className="mt-4 flex justify-end gap-4">
            <button
              type="submit"
              className="bg-[#1e2a4a] text-white py-2 px-4 rounded hover:bg-[#2a3b66] transition-colors duration-200"
            >
              Generate Report
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition-colors duration-200"
            >
              Export to CSV
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
              <h2 className="text-lg font-medium">Purchase Summary</h2>
              <button
                onClick={handleExport}
                className="bg-green-500 text-white py-1 px-3 rounded text-sm hover:bg-green-600"
              >
                Export to CSV
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Total Purchases</p>
                <p className="text-2xl font-bold">{formatCurrency(reportData.totalPurchases)}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Total Orders</p>
                <p className="text-2xl font-bold">{reportData.totalOrders || 0}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">Average Purchase</p>
                <p className="text-2xl font-bold">{getAveragePurchase()}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Purchases by Date</h3>
            {reportData.purchasesByDate && reportData.purchasesByDate.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.purchasesByDate.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatDate(item.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {item.count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No purchase data available for the selected period.</p>
            )}
          </div>
          
          {reportData.topProducts && reportData.topProducts.length > 0 && (
            <div className="p-6 border-t border-gray-200">
              <h3 className="text-lg font-medium mb-4">Top Purchased Products</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Purchased</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.topProducts.map((product, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {product.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                          {formatCurrency(product.cost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {reportData.topSuppliers && reportData.topSuppliers.length > 0 && (
            <div className="p-6 border-t border-gray-200">
              <h3 className="text-lg font-medium mb-4">Top Suppliers</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.topSuppliers.map((supplier, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {supplier.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {supplier.purchases}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                          {formatCurrency(supplier.total)}
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

export default PurchaseReport;