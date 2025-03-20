import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const InvoiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState({
    customer_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'draft',
    notes: '',
    items: [{ product_id: '', quantity: 1, price: 0, discount: 0, gst_rate: 0 }]
  });
  
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [productSearches, setProductSearches] = useState(Array(1).fill(''));
  const [filteredProducts, setFilteredProducts] = useState(Array(1).fill([]));

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch customers
        const customersResponse = await fetch('http://localhost:5000/api/customers');
        if (!customersResponse.ok) {
          throw new Error('Failed to fetch customers');
        }
        const customersData = await customersResponse.json();
        setCustomers(Array.isArray(customersData) ? customersData : []);
        
        // Fetch products
        const productsResponse = await fetch('http://localhost:5000/api/products');
        if (!productsResponse.ok) {
          throw new Error('Failed to fetch products');
        }
        const productsData = await productsResponse.json();
        setProducts(Array.isArray(productsData) ? productsData : []);
        
        // If editing, fetch invoice details
        if (isEditing) {
          const invoiceResponse = await fetch(`http://localhost:5000/api/invoices/${id}`);
          if (!invoiceResponse.ok) {
            throw new Error('Failed to fetch invoice');
          }
          const invoiceData = await invoiceResponse.json();
          
          // Initialize product searches with product names
          const searches = invoiceData.items.map(item => {
            const product = productsData.find(p => p.id === item.product_id);
            return product ? product.name : '';
          });
          
          setProductSearches(searches);
          setFilteredProducts(Array(searches.length).fill([]));
          
          setFormData({
            customer_id: invoiceData.customer_id,
            invoice_date: invoiceData.invoice_date.split('T')[0],
            due_date: invoiceData.due_date.split('T')[0],
            status: invoiceData.status,
            notes: invoiceData.notes || '',
            items: invoiceData.items.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity,
              price: parseFloat(item.unit_price),
              discount: parseFloat(item.discount_percentage || 0)
            }))
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEditing]);

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
    
    // If product changed, update price but keep it editable
    if (field === 'product_id') {
      const selectedProduct = products.find(p => p.id === value);
      if (selectedProduct) {
        updatedItems[index].price = parseFloat(selectedProduct.selling_price || 0);
        updatedItems[index].gst_rate = parseFloat(selectedProduct.gst_rate || 0);
      }
    }
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_id: '', quantity: 1, price: 0, discount: 0, gst_rate: 0 }]
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
    const newProductSearches = [...productSearches];
    newProductSearches[index] = searchTerm;
    setProductSearches(newProductSearches);
    
    // Always show dropdown with filtered results
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
    // Update the product_id in the form data
    handleItemChange(index, 'product_id', product.id);
    
    // Update the search field with the product name
    setProductSearches(prev => {
      const updated = [...prev];
      updated[index] = product.name || '';
      return updated;
    });
    
    // Clear the filtered products
    setFilteredProducts(prev => {
      const updated = [...prev];
      updated[index] = [];
      return updated;
    });
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((total, item) => {
      const itemTotal = item.quantity * item.price * (1 - item.discount / 100);
      return total + itemTotal;
    }, 0);
  };

  const calculateTax = () => {
    // Calculate GST based on each item's GST rate
    return formData.items.reduce((total, item) => {
      const itemTotal = parseFloat(item.price) * parseInt(item.quantity) * (1 - parseFloat(item.discount || 0) / 100);
      const gstAmount = itemTotal * (parseFloat(item.gst_rate || 0) / 100);
      return total + gstAmount;
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null); // Clear any previous errors
    
    // Validate required fields
    if (!formData.customer_id) {
      setError("Please select a customer");
      setSubmitting(false);
      return;
    }
    
    // Validate items
    const invalidItems = formData.items.filter(item => 
      !item.product_id || !item.quantity || item.quantity <= 0
    );
    
    if (invalidItems.length > 0) {
      setError("Please select a product and specify a valid quantity for all items");
      setSubmitting(false);
      return;
    }
    
    try {
      const url = isEditing 
        ? `http://localhost:5000/api/invoices/${id}` 
        : 'http://localhost:5000/api/invoices';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      // Prepare items with proper structure
      const items = formData.items.map(item => {
        const product = products.find(p => p.id === item.product_id);
        // Use the price from the form instead of the product's original price
        const unit_price = parseFloat(item.price);
        const total_price = unit_price * parseInt(item.quantity) * (1 - parseFloat(item.discount || 0) / 100);
        
        return {
          product_id: item.product_id,
          product_name: product ? product.name : '',
          quantity: parseInt(item.quantity),
          unit_price,
          total_price,
          discount_percentage: parseFloat(item.discount || 0),
          tax_percentage: 0,
          hsn_sac_code: product ? product.hsn_sac_code || '' : '',
          gst_rate: product ? parseFloat(product.gst_rate || 0) : 0
        };
      });
      
      // Prepare invoice data
      const invoiceData = {
        customer_id: formData.customer_id,
        invoice_date: formData.invoice_date,
        due_date: formData.due_date,
        status: formData.status,
        notes: formData.notes,
        subtotal: calculateSubtotal(),
        tax_amount: calculateTax(),
        total_amount: calculateTotal()
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...invoiceData,
          items
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || 
          `Failed to ${isEditing ? 'update' : 'create'} invoice. Server returned ${response.status}`
        );
      }
      
      const data = await response.json();
      
      // Redirect to invoice view
      navigate(`/invoices/view/${data.id}`);
    } catch (err) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} invoice:`, err);
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} invoice. Please try again.`);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {isEditing ? 'Edit Invoice' : 'Create New Invoice'}
      </h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="customer_id" className="block text-sm font-medium text-gray-700 mb-1">
              Customer *
            </label>
            <select
              id="customer_id"
              name="customer_id"
              value={formData.customer_id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a customer</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="invoice_date" className="block text-sm font-medium text-gray-700 mb-1">
              Invoice Date
            </label>
            <input
              type="date"
              id="invoice_date"
              name="invoice_date"
              value={formData.invoice_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              id="due_date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-2">Invoice Items</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HSN/SAC</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST %</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount %</th>
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
                                  Price: ₹{parseFloat(product.selling_price || 0).toFixed(2)}
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
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={(() => {
                          const product = products.find(p => p.id === item.product_id);
                          return product ? parseFloat(product.gst_rate || 0) : 0;
                        })()}
                        onChange={(e) => {
                          const product = products.find(p => p.id === item.product_id);
                          if (product) {
                            product.gst_rate = parseFloat(e.target.value) || 0;
                            handleItemChange(index, 'gst_rate', parseFloat(e.target.value) || 0);
                          }
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        style={{ height: '38px' }}
                      />
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
                        value={item.price}
                        onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        style={{ height: '38px' }}
                      />
                      {item.product_id && (
                        <div className="text-xs text-gray-500 mt-1">
                          Default: ₹{products.find(p => p.id === item.product_id)?.selling_price || '0.00'}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.discount || 0}
                        onChange={(e) => handleItemChange(index, 'discount', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        style={{ height: '38px' }}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="text-right font-medium">
                        ₹{((item.quantity || 1) * (item.price || 0) * (1 - (item.discount || 0) / 100)).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-500 hover:text-red-700"
                        style={{ height: '38px' }}
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
          
          <div className="flex justify-end mt-6">
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
        </div>
        
        <div className="mb-6">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows="3"
            value={formData.notes}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add any notes or payment instructions..."
          ></textarea>
        </div>
        
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="mr-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : isEditing ? 'Update Invoice' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;

