import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, 
  faUsers, 
  faBox, 
  faTag, 
  faFileInvoiceDollar, 
  faShoppingCart, 
  faTruck, 
  faChartBar,
  faBars,
  faChevronLeft,
  faChevronRight,
  faTimes
} from '@fortawesome/free-solid-svg-icons';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const location = useLocation();

  
  // Check window width on mount and resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };
    
    // Set initial state
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  
  const menuItems = [
    { path: '/', icon: faHome, label: 'Dashboard' },
    { path: '/customers', icon: faUsers, label: 'Customers' },
    { path: '/products', icon: faBox, label: 'Products' },
    { path: '/categories', icon: faTag, label: 'Categories' },
    { path: '/invoices', icon: faFileInvoiceDollar, label: 'Invoices' },
    { path: '/purchases', icon: faShoppingCart, label: 'Purchases' },
    { path: '/suppliers', icon: faTruck, label: 'Suppliers' },
    { path: '/reports', icon: faChartBar, label: 'Reports' },
  ];

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      {/* Mobile overlay */}
      <div 
        className={`fixed inset-0 bg-gray-900 transition-opacity duration-300 md:hidden
          ${!isCollapsed ? 'opacity-50 z-20' : 'opacity-0 -z-10'}`}
        onClick={() => setIsCollapsed(true)}
      />
      <div 
        className={`bg-[#1e2a4a] text-white ${isCollapsed ? 'w-16 -translate-x-full md:translate-x-0' : 'w-64'} 
          space-y-6 py-7 px-2 fixed md:static inset-y-0 left-0 transform transition-all duration-300 
          ease-in-out shadow-lg z-30 h-full overflow-y-auto md:translate-x-0`}
      >
      {/* Mobile close button */}
      <button 
        className="absolute right-4 top-4 text-gray-300 hover:text-white md:hidden"
        onClick={() => setIsCollapsed(true)}
        aria-label="Close sidebar"
      >
        <FontAwesomeIcon icon={faTimes} size="lg" />
      </button>
      
      {/* Desktop toggle button - bottom of sidebar */}
      <button 
        className="absolute bottom-4 left-0 right-0 mx-auto w-8 h-8 bg-blue-600 text-white p-1 rounded-full shadow-lg hidden md:block"
        onClick={toggleSidebar}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <FontAwesomeIcon icon={isCollapsed ? faChevronRight : faChevronLeft} size="xs" />
      </button>
      
      <div className={`flex ${isCollapsed ? 'justify-center' : 'items-center space-x-2 px-4'} mb-8`}>
        {!isCollapsed && (
          <>
            {/* New QuickBill Logo - Modern invoice/bill design with gradient colors */}
            <svg className="h-10 w-10" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Background shape */}
              <rect x="5" y="5" width="40" height="40" rx="8" fill="url(#quickbill-gradient)" />
              
              {/* Document lines */}
              <rect x="14" y="15" width="22" height="2" rx="1" fill="white" />
              <rect x="14" y="20" width="22" height="2" rx="1" fill="white" opacity="0.8" />
              <rect x="14" y="25" width="16" height="2" rx="1" fill="white" opacity="0.6" />
              
              {/* Dollar sign */}
              <path d="M28 33C28 34.6569 26.6569 36 25 36C23.3431 36 22 34.6569 22 33C22 31.3431 23.3431 30 25 30C26.6569 30 28 31.3431 28 33Z" fill="white" />
              <path d="M25 30V28" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <path d="M25 38V36" stroke="white" strokeWidth="2" strokeLinecap="round" />
              
              {/* Check mark */}
              <path d="M32 18L34 20L38 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Gradient definition */}
              <defs>
                <linearGradient id="quickbill-gradient" x1="5" y1="5" x2="45" y2="45" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#4F46E5" />
                  <stop offset="1" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">QuickBill</span>
          </>
        )}
        {isCollapsed && (
          <svg className="h-8 w-8" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="5" width="40" height="40" rx="8" fill="url(#quickbill-gradient-small)" />
            <path d="M32 18L34 20L38 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M28 33C28 34.6569 26.6569 36 25 36C23.3431 36 22 34.6569 22 33C22 31.3431 23.3431 30 25 30C26.6569 30 28 31.3431 28 33Z" fill="white" />
            <defs>
              <linearGradient id="quickbill-gradient-small" x1="5" y1="5" x2="45" y2="45" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4F46E5" />
                <stop offset="1" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
          </svg>
        )}
      </div>

      <nav>
        <ul className={`${isCollapsed ? 'px-2' : 'px-4'} space-y-2`}>
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-2.5 rounded-lg transition-all duration-200 ${
                  isActive(item.path) 
                    ? 'bg-blue-600 text-white font-medium' 
                    : 'hover:bg-[#2a3b63] text-gray-300'
                }`}
                title={isCollapsed ? item.label : ''}
              >
                <span className="w-6 text-center flex-shrink-0">
                  <FontAwesomeIcon icon={item.icon} size={isCollapsed ? "lg" : "sm"} />
                </span>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      {!isCollapsed && (
        <div className="px-4 mt-12">
          <div className="bg-[#2a3b63] p-4 rounded-lg border border-blue-900/20">
            <h4 className="font-medium text-gray-300 mb-2">Need Help?</h4>
            <p className="text-sm text-gray-400 mb-3">
              Check our documentation for help with using the billing software.
            </p>
            <a 
              href="#" 
              className="inline-block bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 transition duration-200"
            >
              View Docs
            </a>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default Sidebar;