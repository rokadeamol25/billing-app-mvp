import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { purchaseAPI, supplierAPI, productAPI } from '../services/api';
import { formatCurrency } from '../utils/format';

const PurchaseForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState({
    supplier_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    status: 'pending',
    notes: '',
    items: [{ 
      product_id: '', 
      product_name: '',
      quantity: 1, 
      unit_price: 0, 
      total_price: 0,
      hsn_sac_code: '',
      gst_rate: 0
    }]
  });
  
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [productSearches, setProductSearches] = useState(Array(1).fill(''));
  const [filteredProducts, setFilteredProducts] = useState(Array(1).fill([]));

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (isEditing && id) {
      fetchPurchase();
    }
  }, [id, isEditing]);

  const fetchData = async () => {
    try {
      // Fetch suppliers
      const suppliersResponse = await supplierAPI.getAll();
      setSuppliers(Array.isArray(suppliersResponse.data) ? suppliersResponse.data : []);
      
      // Fetch products
      const productsResponse = await productAPI.getAll();
      setProducts(Array.isArray(productsResponse.data) ? productsResponse.data : []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load suppliers and products. Please check your database connection.');
    }
  };

  const fetchPurchase = async () => {
    try {
      setLoading(true);
      const response = await purchaseAPI.getById(id);
      
      // Format the data for the form
      const purchase = response.data;
      setFormData({
        supplier_id: purchase.supplier_id || '',
        purchase_date: purchase.purchase_date ? purchase.purchase_date.split('T')[0] : new Date().toISOString().split('T')[0],
        status: purchase.status || 'pending',
        notes: purchase.notes || '',
        items: Array.isArray(purchase.items) && purchase.items.length > 0 
          ? purchase.items.map(item => ({
              product_id: item.product_id || '',
              product_name: item.product_name || '',
              quantity: item.quantity || 1,
              unit_price: item.unit_price || 0,
              total_price: item.total_price || 0,
              hsn_sac_code: item.hsn_sac_code || '',
              gst_rate: item.gst_rate || 0
            }))
          : [{ 
              product_id: '', 
              product_name: '',
              quantity: 1, 
              unit_price: 0, 
              total_price: 0,
              hsn_sac_code: '',
              gst_rate: 0
            }]
      });
      
      // Initialize product searches and filtered products arrays
      setProductSearches(Array(purchase.items?.length || 1).fill(''));
      setFilteredProducts(Array(purchase.items?.length || 1).fill([]));
      
      setError(null);
    } catch (err) {
      console.error('Error fetching purchase:', err);
      setError('Failed to load purchase data. Please check your database connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    
    // If product changed, update price and other product details
    if (field === 'product_id') {
      const selectedProduct = products.find(p => p.id === value);
      if (selectedProduct) {
        updatedItems[index].unit_price = parseFloat(selectedProduct.price || 0);
        updatedItems[index].product_name = selectedProduct.name || '';
        updatedItems[index].hsn_sac_code = selectedProduct.hsn_sac_code || '';
        updatedItems[index].gst_rate = parseFloat(selectedProduct.gst_rate || 0);
      }
    }
    
    // Recalculate total price if quantity or unit price changes
    if (field === 'quantity' || field === 'unit_price') {
      const quantity = parseFloat(updatedItems[index].quantity || 0);
      const unitPrice = parseFloat(updatedItems[index].unit_price || 0);
      updatedItems[index].total_price = quantity * unitPrice;
    }
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { 
        product_id: '', 
        product_name: '',
        quantity: 1, 
        unit_price: 0, 
        total_price: 0,
        hsn_sac_code: '',
        gst_rate: 0
      }]
    }));
    
    // Add new entry for product search
    setProductSearches(prev => [...prev, '']);
    setFilteredProducts(prev => [...prev, []]);
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const updatedItems = [...formData.items];
      updatedItems.splice(index, 1);
      
      const updatedSearches = [...productSearches];
      updatedSearches.splice(index, 1);
      
      const updatedFiltered = [...filteredProducts];
      updatedFiltered.splice(index, 1);
      
      setFormData(prev => ({
        ...prev,
        items: updatedItems
      }));
      
      setProductSearches(updatedSearches);
      setFilteredProducts(updatedFiltered);
    }
  };

  const handleProductSearch = (index, searchTerm) => {
    // Always show dropdown with filtered results
    const newProductSearches = [...productSearches];
    newProductSearches[index] = searchTerm;
    setProductSearches(newProductSearches);
    
    let filtered = [];
    if (searchTerm.trim() === '') {
      // Show all products when search is empty (limited to 10)
      filtered = products.slice(0, 10);
    } else {
      // Filter products based on search term
      const searchTermLower = searchTerm.toLowerCase();
      filtered = products.filter(product => 
        (product.name && product.name.toLowerCase().includes(searchTermLower)) ||
        (product.sku && product.sku.toLowerCase().includes(searchTermLower))
      ).slice(0, 10); // Limit to 10 results
    }
    
    const newFilteredProducts = [...filteredProducts];
    newFilteredProducts[index] = filtered;
    setFilteredProducts(newFilteredProducts);
  };

  const selectProduct = (index, product) => {
    handleItemChange(index, 'product_id', product.id);
    
    // Update the search field with the selected product name
    const newProductSearches = [...productSearches];
    newProductSearches[index] = product.name;
    setProductSearches(newProductSearches);
    
    // Clear the filtered products for this index
    const newFilteredProducts = [...filteredProducts];
    newFilteredProducts[index] = [];
    setFilteredProducts(newFilteredProducts);
    
    // Update other product fields
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      product_id: product.id,
      product_name: product.name,
      unit_price: parseFloat(product.price || 0),
      hsn_sac_code: product.hsn_sac_code || '',
      gst_rate: parseFloat(product.gst_rate || 0),
      total_price: parseFloat(product.price || 0) * parseInt(updatedItems[index].quantity || 1)
    };
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((total, item) => {
      return total + parseFloat(item.total_price || 0);
    }, 0);
  };

  const calculateTax = () => {
    // Calculate GST based on each item's GST rate
    return formData.items.reduce((total, item) => {
      const gstRate = parseFloat(item.gst_rate || 0);
      const itemTotal = parseFloat(item.total_price || 0);
      const gstAmount = itemTotal * (gstRate / 100);
      return total + gstAmount;
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.supplier_id) {
      setError('Please select a supplier');
      return;
    }
    
    // Validate items
    const invalidItems = formData.items.filter(item => 
      !item.product_id || !item.quantity || item.quantity <= 0
    );
    
    if (invalidItems.length > 0) {
      setError('Please select a product and specify a valid quantity for all items');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Format data according to what the backend expects
      const purchaseData = {
        supplier_id: formData.supplier_id,
        purchase_date: formData.purchase_date,
        status: formData.status,
        notes: formData.notes,
        subtotal: calculateSubtotal(),
        tax_amount: calculateTax(),
        total_amount: calculateTotal()
      };
      
      const items = formData.items.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: parseInt(item.quantity),
        unit_price: parseFloat(item.unit_price),
        total_price: parseFloat(item.total_price || (item.quantity * item.unit_price)),
        hsn_sac_code: item.hsn_sac_code,
        gst_rate: parseFloat(item.gst_rate)
      }));
      
      const requestData = {
        purchaseData,
        items
      };
      
      if (isEditing) {
        await purchaseAPI.update(id, requestData);
      } else {
        await purchaseAPI.create(requestData);
      }
      
      navigate('/purchases');
    } catch (err) {
      console.error('Error saving purchase:', err);
      setError('Failed to save purchase. Please check your database connection.');
    } finally {
      setSubmitting(false);
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

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{isEditing ? 'Edit Purchase' : 'Create New Purchase'}</h1>
        <Link to="/purchases" className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">
          Back to Purchases
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="supplier_id">
                Supplier *
              </label>
              <select
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="supplier_id"
                name="supplier_id"
                value={formData.supplier_id}
                onChange={handleChange}
                required
              >
                <option value="">Select a supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="purchase_date">
                Purchase Date
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="purchase_date"
                name="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status">
                Status
              </label>
              <select
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Purchase Items</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HSN/SAC</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST %</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2">
                        <div className="relative">
                          <div className="flex items-center">
                            <input
                              type="text"
                              value={productSearches[index] || ''}
                              onChange={(e) => handleProductSearch(index, e.target.value)}
                              onFocus={(e) => handleProductSearch(index, e.target.value)}
                              placeholder="Search products..."
                              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              style={{ height: '38px' }}
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 -ml-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                          {filteredProducts[index]?.length > 0 && (
                            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto">
                              {filteredProducts[index].map(product => (
                                <div
                                  key={product.id}
                                  onClick={() => selectProduct(index, product)}
                                  className="cursor-pointer hover:bg-gray-100 px-4 py-2"
                                >
                                  <div className="font-medium">{product.name || 'Unnamed Product'}</div>
                                  <div className="text-sm text-gray-500">
                                    SKU: {product.sku || 'N/A'} | 
                                    Price: ₹{parseFloat(product.price || 0).toFixed(2)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        {/* Display HSN/SAC code */}
                        {(() => {
                          const product = products.find(p => p.id === item.product_id);
                          return product ? product.hsn_sac_code || '-' : '-';
                        })()}
                      </td>
                      <td className="px-4 py-2">
                        {/* Display GST rate */}
                        {(() => {
                          const product = products.find(p => p.id === item.product_id);
                          return product ? (parseFloat(product.gst_rate || 0)).toFixed(1) + '%' : '0%';
                        })()}
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          style={{ height: '38px' }}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          style={{ height: '38px' }}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <div className="text-right font-medium">
                          ₹{(item.quantity * item.unit_price).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-500 hover:text-red-700"
                          disabled={formData.items.length <= 1}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <button
              type="button"
              onClick={addItem}
              className="mt-4 flex items-center text-blue-500 hover:text-blue-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Item
            </button>
          </div>
          
          <div className="flex justify-between mb-6">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="notes">
                Notes
              </label>
              <textarea
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="notes"
                name="notes"
                rows="3"
                placeholder="Additional notes for the purchase"
                value={formData.notes}
                onChange={handleChange}
              ></textarea>
            </div>
            
            <div className="w-64">
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Subtotal:</span>
                <span>₹{calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">GST:</span>
                <span>₹{calculateTax().toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 font-bold">
                <span>Total:</span>
                <span>₹{calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            {error && (
              <p className="text-red-500 mb-4">{error}</p>
            )}
            {!error && (
              <p className="text-red-500 mb-4">Note: Database connection is required to save purchase information.</p>
            )}
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : (isEditing ? 'Update Purchase' : 'Save Purchase')}
            </button>
            <Link
              to="/purchases"
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseForm; 