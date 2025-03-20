import React from 'react';

const Documentation = () => {
  const sections = [
    {
      title: 'Getting Started',
      content: [
        { heading: 'Dashboard Overview', text: 'The dashboard provides a quick overview of your business metrics including recent sales, purchases, and inventory status.' },
        { heading: 'Navigation', text: 'Use the sidebar menu to access different modules of the application.' }
      ]
    },
    {
      title: 'Sales Management',
      content: [
        { heading: 'Creating Invoices', text: 'Click on "Invoices" → "New Invoice" to create a new sales invoice. Add customer details and products from your inventory.' },
        { heading: 'Managing Payments', text: 'Track payment status and mark invoices as paid from the invoice details page.' },
        { heading: 'Generating PDFs', text: 'Use the "Download PDF" button on the invoice view page to generate printable invoices.' }
      ]
    },
    {
      title: 'Inventory Management',
      content: [
        { heading: 'Adding Products', text: 'Go to "Products" → "New Product" to add items to your inventory.' },
        { heading: 'Stock Updates', text: 'Monitor stock levels and set up low stock alerts in the product settings.' },
        { heading: 'Categories', text: 'Organize products by categories for better management.' }
      ]
    },
    {
      title: 'Purchase Management',
      content: [
        { heading: 'Creating Purchase Orders', text: 'Use the "Purchases" → "New Purchase" to record new stock purchases.' },
        { heading: 'Supplier Management', text: 'Add and manage suppliers through the Suppliers module.' }
      ]
    },
    {
      title: 'Reports',
      content: [
        { heading: 'Sales Reports', text: 'View detailed sales analytics by date range, customer, or product.' },
        { heading: 'Inventory Reports', text: 'Track stock movements and inventory valuations.' },
        { heading: 'Financial Reports', text: 'Access profit & loss statements and payment tracking.' }
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Documentation</h1>
      
      {sections.map((section, index) => (
        <div key={index} className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">{section.title}</h2>
          <div className="space-y-4">
            {section.content.map((item, itemIndex) => (
              <div key={itemIndex} className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-2 text-gray-700">{item.heading}</h3>
                <p className="text-gray-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-8 bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Need Additional Help?</h2>
        <p className="text-gray-700">
          If you need further assistance, please contact our support team at support@example.com
        </p>
      </div>
    </div>
  );
};

export default Documentation;