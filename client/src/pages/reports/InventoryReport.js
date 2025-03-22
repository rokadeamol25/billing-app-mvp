import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatNumber } from '../../utils/format';

const InventoryReport = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    categoryId: '',
    lowStockOnly: false
  });
  
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/products/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        ...(filters.categoryId && { categoryId: filters.categoryId }),
        ...(filters.lowStockOnly && { lowStockOnly: 'true' })
      });
      
      const response = await fetch(`http://localhost:5001/api/reports/inventory?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch inventory report');
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

  useEffect(() => {
    fetchReport();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchReport();
  };

  const handleExport = async () => {
    try {
      const queryParams = new URLSearchParams({
        ...(filters.categoryId && { categoryId: filters.categoryId }),
        ...(filters.lowStockOnly && { lowStockOnly: 'true' }),
        format: 'csv'
      });
      
      const response = await fetch(`http://localhost:5001/api/reports/inventory/export?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to export inventory report');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting report:', err);
      alert('Failed to export report. Please try again.');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1e2a4a]">Inventory Report</h1>
          <p className="text-gray-600">Track stock levels and product movement</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="categoryId"
                name="categoryId"
                value={filters.categoryId}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="lowStockOnly"
                name="lowStockOnly"
                checked={filters.lowStockOnly}
                onChange={handleFilterChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="lowStockOnly" className="ml-2 block text-sm text-gray-900">
                Show Low Stock Items Only
              </label>
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
        <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Inventory Summary</h2>
              <button
                onClick={handleExport}
                className="bg-green-500 text-white py-1 px-3 rounded text-sm hover:bg-green-600"
              >
                Export to CSV
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Total Products</p>
                <p className="text-2xl font-bold">{formatNumber(reportData.inventorySummary?.total_products || 0)}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Total Items in Stock</p>
                <p className="text-2xl font-bold">{formatNumber(reportData.inventorySummary?.total_items_in_stock || 0)}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">Total Inventory Value</p>
                <p className="text-2xl font-bold">{formatCurrency(reportData.inventorySummary?.total_inventory_value || 0)}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-600 font-medium">Low Stock Items</p>
                <p className="text-2xl font-bold">{formatNumber(reportData.inventorySummary?.low_stock_count || 0)}</p>
              </div>
            </div>
          </div>
          
          {reportData.inventoryByCategory && reportData.inventoryByCategory.length > 0 && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium mb-4">Inventory by Category</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Quantity</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.inventoryByCategory.map((category, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">
                          {category.category_name || 'Uncategorized'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {formatNumber(category.product_count || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {formatNumber(category.total_quantity || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                          {formatCurrency(category.total_value || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {reportData.lowStockProducts && reportData.lowStockProducts.length > 0 && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium mb-4">Low Stock Products</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Low Stock Threshold</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Shortage</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.lowStockProducts.map((product, index) => (
                      <tr key={index} className="bg-red-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {product.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {formatNumber(product.stock_quantity || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {formatNumber(product.low_stock_threshold || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-red-600">
                          {formatNumber(product.shortage || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {reportData.productList && reportData.productList.length > 0 && (
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Product Inventory</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Price</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Selling Price</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.productList.map((product, index) => (
                      <tr key={index} className={product.stock_quantity <= product.low_stock_threshold ? 'bg-red-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {product.category_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {product.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {formatNumber(product.stock_quantity || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {formatCurrency(product.cost_price || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {formatCurrency(product.selling_price || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                          {formatCurrency((product.stock_quantity || 0) * (product.cost_price || 0))}
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
          <p>No inventory data available. Please adjust your filters and generate the report.</p>
        </div>
      )}
    </div>
  );
};

export default InventoryReport;