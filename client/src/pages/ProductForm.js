import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cost_price: '',
    selling_price: '',
    stock_quantity: '',
    category_id: '',
    sku: '',
    low_stock_threshold: '10',
    is_active: true,
    hsn_sac_code: '',
    gst_rate: '0'
  });
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Fetch categories
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/products/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        setCategories(data);
        setCategoriesLoading(false);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setCategoriesLoading(false);
      }
    };

    fetchCategories();

    // Fetch product if editing
    if (isEditing) {
      const fetchProduct = async () => {
        try {
          const response = await fetch(`http://localhost:5001/api/products/${id}`);
          if (!response.ok) {
            throw new Error('Failed to fetch product');
          }
          const data = await response.json();
          setFormData(data);
          setLoading(false);
        } catch (err) {
          console.error('Error fetching product:', err);
          setError('Could not load product data. Please try again later.');
          setLoading(false);
        }
      };

      fetchProduct();
    }
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null); // Clear any previous errors
    
    // Validate required fields
    if (!formData.name) {
      setError("Product name is required");
      setSubmitting(false);
      return;
    }
    
    if (!formData.sku) {
      setError("SKU is required");
      setSubmitting(false);
      return;
    }
    
    if (!formData.cost_price || parseFloat(formData.cost_price) <= 0) {
      setError("Cost price must be greater than zero");
      setSubmitting(false);
      return;
    }
    
    if (!formData.selling_price || parseFloat(formData.selling_price) <= 0) {
      setError("Selling price must be greater than zero");
      setSubmitting(false);
      return;
    }
    
    // Validate category_id is a valid UUID if provided
    if (formData.category_id && !isValidUUID(formData.category_id)) {
      setError("Please select a valid category");
      setSubmitting(false);
      return;
    }
    
    try {
      const url = isEditing 
        ? `http://localhost:5001/api/products/${id}` 
        : 'http://localhost:5001/api/products';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      // Convert numeric fields to proper types
      const productData = {
        ...formData,
        cost_price: parseFloat(formData.cost_price),
        selling_price: parseFloat(formData.selling_price),
        stock_quantity: parseInt(formData.stock_quantity || 0),
        low_stock_threshold: parseInt(formData.low_stock_threshold || 10),
        gst_rate: parseFloat(formData.gst_rate || 0)
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || 
          `Failed to ${isEditing ? 'update' : 'create'} product. Server returned ${response.status}`
        );
      }
      
      navigate('/products');
    } catch (err) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} product:`, err);
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} product. Please try again.`);
      setSubmitting(false);
    }
  };

  // Helper function to validate UUID
  const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  if (loading || categoriesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1e2a4a]">{isEditing ? 'Edit Product' : 'Add New Product'}</h1>
            <p className="mt-1 text-sm text-gray-500">Manage your product details</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Product Name */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-semibold text-[#1e2a4a]">
                  Product Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e2a4a] focus:border-transparent transition duration-200"
                  placeholder="Enter product name"
                  required
                />
              </div>
              
              {/* SKU */}
              <div className="space-y-2">
                <label htmlFor="sku" className="block text-sm font-semibold text-[#1e2a4a]">
                  SKU *
                </label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e2a4a] focus:border-transparent transition duration-200"
                  placeholder="Enter SKU"
                  required
                />
              </div>
              
              {/* Category */}
              <div className="space-y-2">
                <label htmlFor="category_id" className="block text-sm font-semibold text-[#1e2a4a]">
                  Category
                </label>
                <select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e2a4a] focus:border-transparent transition duration-200"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Cost Price */}
              <div className="space-y-2">
                <label htmlFor="cost_price" className="block text-sm font-semibold text-[#1e2a4a]">
                  Cost Price *
                </label>
                <input
                  type="number"
                  id="cost_price"
                  name="cost_price"
                  value={formData.cost_price}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e2a4a] focus:border-transparent transition duration-200"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              
              {/* Selling Price */}
              <div className="space-y-2">
                <label htmlFor="selling_price" className="block text-sm font-semibold text-[#1e2a4a]">
                  Selling Price *
                </label>
                <input
                  type="number"
                  id="selling_price"
                  name="selling_price"
                  value={formData.selling_price}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e2a4a] focus:border-transparent transition duration-200"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              
              {/* Stock Quantity */}
              <div className="space-y-2">
                <label htmlFor="stock_quantity" className="block text-sm font-semibold text-[#1e2a4a]">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  id="stock_quantity"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e2a4a] focus:border-transparent transition duration-200"
                  placeholder="0"
                  min="0"
                />
              </div>
              
              {/* Low Stock Threshold */}
              <div className="space-y-2">
                <label htmlFor="low_stock_threshold" className="block text-sm font-semibold text-[#1e2a4a]">
                  Low Stock Alert Threshold
                </label>
                <input
                  type="number"
                  id="low_stock_threshold"
                  name="low_stock_threshold"
                  value={formData.low_stock_threshold}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e2a4a] focus:border-transparent transition duration-200"
                  placeholder="10"
                  min="0"
                />
              </div>
              
              {/* HSN/SAC Code */}
              <div className="space-y-2">
                <label htmlFor="hsn_sac_code" className="block text-sm font-semibold text-[#1e2a4a]">
                  HSN/SAC Code
                </label>
                <input
                  type="text"
                  id="hsn_sac_code"
                  name="hsn_sac_code"
                  value={formData.hsn_sac_code}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e2a4a] focus:border-transparent transition duration-200"
                  placeholder="Enter HSN/SAC code"
                />
              </div>
              
              <div>
                <label htmlFor="gst_rate" className="block text-sm font-medium text-gray-700 mb-1">
                  GST Rate (%)
                </label>
                <input
                  type="number"
                  id="gst_rate"
                  name="gst_rate"
                  value={formData.gst_rate}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex items-center mt-4">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Active Product
                </label>
              </div>
            </div>
            
            {/* Description textarea */}
            <div className="mt-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>
            
            {/* Form buttons */}
            <div className="mt-6 flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/products')}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-medium text-white bg-[#1e2a4a] rounded-lg hover:bg-[#283761] focus:outline-none focus:ring-2 focus:ring-[#1e2a4a] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {submitting ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;