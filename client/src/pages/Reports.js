import React from 'react';
import { Link } from 'react-router-dom';

const Reports = () => {
  const reportTypes = [
    {
      id: 'sales',
      title: 'Sales Report',
      description: 'View sales data by date range, customer, or product.',
      icon: '📈',
      path: '/reports/sales'
    },
    {
      id: 'purchases',
      title: 'Purchase Report',
      description: 'Analyze purchase data by date range, supplier, or product.',
      icon: '🛒',
      path: '/reports/purchases'
    },
    {
      id: 'profit-loss',
      title: 'Profit & Loss Report',
      description: 'Analyze your business profitability over time.',
      icon: '💰',
      path: '/reports/profit-loss'
    },
    {
      id: 'inventory',
      title: 'Inventory Report',
      description: 'Track stock levels, inventory value, and product movement.',
      icon: '📦',
      path: '/reports/inventory'
    },
    {
      id: 'tax',
      title: 'Tax Report',
      description: 'Summarize collected taxes for tax filing purposes.',
      icon: '📝',
      path: '/reports/tax'
    },
    {
      id: 'receivables',
      title: 'Accounts Receivable',
      description: 'Track outstanding customer payments and aging.',
      icon: '💵',
      path: '/reports/receivables'
    },
    {
      id: 'payables',
      title: 'Accounts Payable',
      description: 'Monitor payments due to suppliers and vendors.',
      icon: '💳',
      path: '/reports/payables'
    }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1e2a4a]">Reports</h1>
          <p className="text-gray-600">Generate and analyze business insights</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map(report => (
          <Link 
            key={report.id} 
            to={report.path}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-100 group"
          >
            <div className="p-6">
              <div className="flex items-center mb-4 group-hover:text-[#1e2a4a] transition-colors duration-200">
                <span className="text-3xl mr-3 group-hover:scale-110 transition-transform duration-200">{report.icon}</span>
                <h2 className="text-xl font-bold">{report.title}</h2>
              </div>
              <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-200">{report.description}</p>
            </div>
          </Link>
        ))}
      </div>
      
      <div className="mt-8 bg-[#1e2a4a] text-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-200">
        <h2 className="text-xl font-bold mb-2">Need Custom Reports?</h2>
        <p className="text-gray-200">
          Our system can generate custom reports based on your specific business needs. 
          Contact our support team to discuss custom reporting options.
        </p>
      </div>
    </div>
  );
};

export default Reports;