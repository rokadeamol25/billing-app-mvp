import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './services/auth';
import Login from './pages/Login';

// Layout components
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// Pages
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerForm from './pages/CustomerForm';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import Categories from './pages/Categories';
import Invoices from './pages/Invoices';
import InvoiceForm from './pages/InvoiceForm';
import InvoiceView from './pages/InvoiceView';
import Purchases from './pages/Purchases';
import PurchaseForm from './pages/PurchaseForm';
import PurchaseView from './pages/PurchaseView';
import Suppliers from './pages/Suppliers';
import SupplierForm from './pages/SupplierForm';
import Reports from './pages/Reports';
import SalesReport from './pages/reports/SalesReport';
import PurchaseReport from './pages/reports/PurchaseReport';
import ProfitLossReport from './pages/reports/ProfitLossReport';
import InventoryReport from './pages/reports/InventoryReport';
import TaxReport from './pages/reports/TaxReport';
import ReceivablesReport from './pages/reports/ReceivablesReport';
import PayablesReport from './pages/reports/PayablesReport';

// Protected Route wrapper component
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <div className="flex h-screen bg-gray-100">
              <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
              <div className="flex-1 flex flex-col overflow-hidden">
                <Header setIsCollapsed={setIsCollapsed} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4">
                  <div className="container mx-auto">
                    <Routes>
                      {/* Dashboard */}
                      <Route path="/" element={<Dashboard />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                      
                      {/* Customers */}
                      <Route path="/customers" element={<Customers />} />
                      <Route path="/customers/new" element={<CustomerForm />} />
                      <Route path="/customers/edit/:id" element={<CustomerForm />} />
                      
                      {/* Products */}
                      <Route path="/products" element={<Products />} />
                      <Route path="/products/new" element={<ProductForm />} />
                      <Route path="/products/edit/:id" element={<ProductForm />} />
                      <Route path="/categories" element={<Categories />} />
                      
                      {/* Invoices */}
                      <Route path="/invoices" element={<Invoices />} />
                      <Route path="/invoices/new" element={<InvoiceForm />} />
                      <Route path="/invoices/edit/:id" element={<InvoiceForm />} />
                      <Route path="/invoices/view/:id" element={<InvoiceView />} />
                      
                      {/* Purchases */}
                      <Route path="/purchases" element={<Purchases />} />
                      <Route path="/purchases/new" element={<PurchaseForm />} />
                      <Route path="/purchases/edit/:id" element={<PurchaseForm />} />
                      <Route path="/purchases/view/:id" element={<PurchaseView />} />
                      
                      {/* Suppliers */}
                      <Route path="/suppliers" element={<Suppliers />} />
                      <Route path="/suppliers/new" element={<SupplierForm />} />
                      <Route path="/suppliers/edit/:id" element={<SupplierForm />} />
                      
                      {/* Reports */}
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/reports/sales" element={<SalesReport />} />
                      <Route path="/reports/purchases" element={<PurchaseReport />} />
                      <Route path="/reports/profit-loss" element={<ProfitLossReport />} />
                      <Route path="/reports/inventory" element={<InventoryReport />} />
                      <Route path="/reports/tax" element={<TaxReport />} />
                      <Route path="/reports/receivables" element={<ReceivablesReport />} />
                      <Route path="/reports/payables" element={<PayablesReport />} />
                    </Routes>
                  </div>
                </main>
              </div>
            </div>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;