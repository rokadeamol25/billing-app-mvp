import axios from 'axios';

/**
 * API service for making HTTP requests
 */
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? 'http://srv762239.hstgr.cloud:8080/api' : 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response || error);
    return Promise.reject(error);
  }
);

// API endpoints for customers
export const customerAPI = {
  getAll: () => api.get('/customers'),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  search: (query) => api.get(`/customers/search?q=${query}`),
};

// API endpoints for products
export const productAPI = {
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
  getBySku: (sku) => api.get(`/products/sku/${sku}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  updateStock: (id, quantity) => api.patch(`/products/${id}/stock`, { quantity }),
  delete: (id) => api.delete(`/products/${id}`),
  search: (query) => api.get(`/products/search?q=${query}`),
  getLowStock: () => api.get('/products/low-stock'),
  getBatches: (id) => api.get(`/products/${id}/batches`),
  addBatch: (id, data) => api.post(`/products/${id}/batches`, data),
  getCategories: () => api.get('/products/categories'),
  createCategory: (data) => api.post('/products/categories', data),
};

// API endpoints for invoices
export const invoiceAPI = {
  getAll: () => api.get('/invoices'),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  delete: (id) => api.delete(`/invoices/${id}`),
  updatePayment: (id, data) => api.patch(`/invoices/${id}/payment`, data),
  processReturn: (id, data) => api.post(`/invoices/${id}/return`, data),
  getUnpaid: () => api.get('/invoices/unpaid'),
  getByDateRange: (startDate, endDate) => api.get(`/invoices/date-range?start_date=${startDate}&end_date=${endDate}`),
  getPdf: (id) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
  sendEmail: (id) => api.post(`/invoices/${id}/email`),
  getStatistics: (period) => api.get(`/invoices/statistics?period=${period}`),
};

// API endpoints for purchases
export const purchaseAPI = {
  getAll: () => api.get('/purchases'),
  getById: (id) => api.get(`/purchases/${id}`),
  create: (data) => api.post('/purchases', data),
  delete: (id) => api.delete(`/purchases/${id}`),
  updatePayment: (id, data) => api.patch(`/purchases/${id}/payment`, data),
  getUnpaid: () => api.get('/purchases/unpaid'),
  getByDateRange: (startDate, endDate) => api.get(`/purchases/date-range?start_date=${startDate}&end_date=${endDate}`),
  getBySupplier: (supplierId) => api.get(`/purchases/supplier/${supplierId}`),
  getStatistics: (period) => api.get(`/purchases/statistics?period=${period}`),
};

// API endpoints for suppliers
export const supplierAPI = {
  getAll: () => api.get('/suppliers'),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
  search: (query) => api.get(`/suppliers/search?q=${query}`),
  getPendingPayments: () => api.get('/suppliers/pending-payments'),
};

// API endpoints for reports
export const reportAPI = {
  getSales: (startDate, endDate) => api.get(`/reports/sales?start_date=${startDate}&end_date=${endDate}`),
  getProfitLoss: (startDate, endDate) => api.get(`/reports/profit-loss?start_date=${startDate}&end_date=${endDate}`),
  getInventory: () => api.get('/reports/inventory'),
  getTax: (startDate, endDate) => api.get(`/reports/tax?start_date=${startDate}&end_date=${endDate}`),
  getAccountsReceivable: () => api.get('/reports/accounts-receivable'),
  getAccountsPayable: () => api.get('/reports/accounts-payable'),
};

// API endpoints for dashboard
export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary'),
  getRecentSales: (limit) => api.get(`/dashboard/recent-sales${limit ? `?limit=${limit}` : ''}`),
  getRecentPurchases: (limit) => api.get(`/dashboard/recent-purchases${limit ? `?limit=${limit}` : ''}`),
  getLowStockProducts: (limit) => api.get(`/dashboard/low-stock${limit ? `?limit=${limit}` : ''}`),
  getSalesTrend: (days) => api.get(`/dashboard/sales-trend${days ? `?days=${days}` : ''}`),
  getTopProducts: (limit) => api.get(`/dashboard/top-products${limit ? `?limit=${limit}` : ''}`),
  getPaymentMethods: () => api.get('/dashboard/payment-methods'),
};

export default api;