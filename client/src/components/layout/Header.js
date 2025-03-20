import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBell, 
  faUser, 
  faCog, 
  faSignOutAlt, 
  faQuestionCircle 
} from '@fortawesome/free-solid-svg-icons';

const Header = ({ setIsCollapsed }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  return (
    <header className="bg-[#1e2a4a] shadow-md z-20 sticky top-0">
      <div className="flex justify-between items-center px-4 py-2.5 border-b border-[#2a3b63]">
        <div className="flex items-center">
          <button
            className="text-gray-300 hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1e2a4a] rounded p-1 md:hidden"
            onClick={() => setIsCollapsed(false)}
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6H20M4 12H20M4 18H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          <div className="ml-4 lg:ml-0">
            <h1 className="text-lg font-semibold text-white">QuickBill</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Help Button */}
          <button className="p-1.5 rounded-full text-gray-300 hover:text-blue-400 hover:bg-[#2a3b63] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1e2a4a]">
            <FontAwesomeIcon icon={faQuestionCircle} className="h-5 w-5" />
          </button>
          
          {/* Notifications Button */}
          <div className="relative">
            <button 
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-1.5 rounded-full text-gray-300 hover:text-blue-400 hover:bg-[#2a3b63] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1e2a4a] relative"
            >
              <FontAwesomeIcon icon={faBell} className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">3</span>
            </button>
            
            {notificationsOpen && (
              <>
                <div 
                  onClick={() => setNotificationsOpen(false)}
                  className="fixed inset-0 h-full w-full z-10"
                ></div>
                
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-20 border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
                    <span className="text-xs font-medium text-blue-600 hover:text-blue-800 cursor-pointer">Mark all as read</span>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    <div className="px-4 py-3 border-b border-gray-200 bg-blue-50">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 bg-blue-100 rounded-full p-2">
                          <FontAwesomeIcon icon={faUser} className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-800">New customer registered</p>
                          <p className="text-xs text-gray-500 mt-1">John Smith created a new account</p>
                          <p className="text-xs text-gray-400 mt-1">5 minutes ago</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="px-4 py-3 border-b border-gray-200">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 bg-green-100 rounded-full p-2">
                          <FontAwesomeIcon icon={faBell} className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-800">Invoice paid</p>
                          <p className="text-xs text-gray-500 mt-1">Invoice #1234 has been paid</p>
                          <p className="text-xs text-gray-400 mt-1">1 hour ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                    <Link to="/notifications" className="text-sm text-center block w-full text-blue-600 hover:text-blue-800">
                      View all notifications
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* User Profile Dropdown */}
          <div className="relative ml-2">
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1e2a4a] rounded-full"
            >
              <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-[#2a3b63]">
                <img 
                  className="h-full w-full object-cover" 
                  src="https://ui-avatars.com/api/?name=Admin+User&background=4F46E5&color=fff" 
                  alt="Your avatar"
                />
              </div>
              <span className="ml-2 text-sm font-medium text-gray-300 hidden md:block">Admin User</span>
              <svg className="ml-1 h-5 w-5 text-gray-400 hidden md:block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            {dropdownOpen && (
              <>
                <div 
                  onClick={() => setDropdownOpen(false)}
                  className="fixed inset-0 h-full w-full z-10"
                ></div>
                
                <div className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-lg shadow-lg z-20 border border-gray-200">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-800">Admin User</p>
                    <p className="text-xs text-gray-500 truncate">admin@quickbill.com</p>
                  </div>
                  
                  <Link 
                    to="/profile" 
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                  >
                    <FontAwesomeIcon icon={faUser} className="w-4 h-4 mr-2 text-gray-400" />
                    Your Profile
                  </Link>
                  
                  <Link 
                    to="/settings" 
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                  >
                    <FontAwesomeIcon icon={faCog} className="w-4 h-4 mr-2 text-gray-400" />
                    Settings
                  </Link>
                  
                  <div className="border-t border-gray-200 my-1"></div>
                  
                  <Link 
                    to="/logout" 
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600"
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} className="w-4 h-4 mr-2 text-gray-400" />
                    Logout
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;