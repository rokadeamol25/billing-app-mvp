import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supplierAPI } from '../services/api';

const SupplierForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    contact_person: '',
    address: '',
    gst_number: '',
    payment_terms: ''
  });
  
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEditing) {
      fetchSupplier();
    }
  }, [id, isEditing]);

  const fetchSupplier = async () => {
    try {
      setLoading(true);
      const response = await supplierAPI.getById(id);
      setFormData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching supplier:', err);
      setError('Failed to load supplier data. Please check your database connection.');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name) {
      setError('Supplier name is required');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      if (isEditing) {
        await supplierAPI.update(id, formData);
      } else {
        await supplierAPI.create(formData);
      }
      
      navigate('/suppliers');
    } catch (err) {
      console.error('Error saving supplier:', err);
      setError('Failed to save supplier. Please check your database connection.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center">
          <p>Loading supplier data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{isEditing ? 'Edit Supplier' : 'Add New Supplier'}</h1>
        <Link to="/suppliers" className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">
          Back to Suppliers
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                Supplier Name *
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="name"
                name="name"
                type="text"
                placeholder="Enter supplier name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="email"
                name="email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">
                Phone Number
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="phone"
                name="phone"
                type="text"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="contact_person">
                Contact Person
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="contact_person"
                name="contact_person"
                type="text"
                placeholder="Enter contact person name"
                value={formData.contact_person}
                onChange={handleChange}
              />
            </div>
            
            <div className="mb-4 md:col-span-2">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address">
                Address
              </label>
              <textarea
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="address"
                name="address"
                placeholder="Enter address"
                rows="3"
                value={formData.address}
                onChange={handleChange}
              ></textarea>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="gst_number">
                GST Number
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="gst_number"
                name="gst_number"
                type="text"
                placeholder="Enter GST number"
                value={formData.gst_number}
                onChange={handleChange}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="payment_terms">
                Payment Terms
              </label>
              <select
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="payment_terms"
                name="payment_terms"
                value={formData.payment_terms}
                onChange={handleChange}
              >
                <option value="">Select payment terms</option>
                <option value="immediate">Immediate</option>
                <option value="15days">Net 15 days</option>
                <option value="30days">Net 30 days</option>
                <option value="45days">Net 45 days</option>
                <option value="60days">Net 60 days</option>
              </select>
            </div>
          </div>
          
          <div className="mt-6">
            {error && (
              <p className="text-red-500 mb-4">{error}</p>
            )}
            {!error && (
              <p className="text-red-500 mb-4">Note: Database connection is required to save supplier information.</p>
            )}
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Supplier'}
            </button>
            <Link
              to="/suppliers"
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

export default SupplierForm; 