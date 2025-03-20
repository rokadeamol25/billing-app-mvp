# Billing Software MVP

A Minimum Viable Product (MVP) for a billing software application built with Node.js, Express, React, and PostgreSQL.

## Features

### Sales Management
- Create new sales entries (Invoice generation)
- Add customer details
- Add multiple items in a single invoice
- Apply discounts, taxes, and calculate total
- Support for multiple payment methods
- Generate sales receipts as PDF
- Email invoices to customers
- Sales return & refund processing

### Purchase Management
- Add new purchases from suppliers
- Supplier details management
- Add purchased items to inventory
- Track pending supplier payments
- Generate purchase invoices

### Stock/Inventory Management
- Product catalog
- Track stock in real time
- Low stock alerts
- Batch tracking
- Barcode/QR code scanning (simulated via SKU)

### Reporting & Analytics
- Sales Reports
- Profit & Loss Statement
- Outstanding Payments & Receivables
- Stock Movement Report
- Tax & Compliance Reports

### Financial Management
- Track incoming & outgoing payments
- Manage accounts payable & receivable
- Cash flow tracking
- Bank API integration (mock)

### Dashboard
- Sales summary
- Inventory status
- Financial summary
- Customizable widgets

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: React.js, Tailwind CSS
- **Database**: PostgreSQL
- **Libraries**: pdfkit, nodemailer, moment, chart.js, etc.

## Project Structure

```
billing-software-mvp/
├── client/                 # React frontend
│   ├── public/             # Static files
│   └── src/                # React source code
│       ├── components/     # Reusable components
│       ├── pages/          # Page components
│       ├── services/       # API services
│       └── utils/          # Utility functions
├── server/                 # Node.js backend
│   ├── src/                # Server source code
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   └── utils/          # Utility functions
│   └── storage/            # Storage for PDFs, etc.
└── database/               # Database scripts
    └── schema.sql          # Database schema
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd billing-software-mvp
   ```

2. Install dependencies:
   ```
   npm run install-all
   ```

3. Set up environment variables:
   - Copy `server/.env.example` to `server/.env` (if available)
   - Update the database connection details and other configurations

4. Set up the database:
   ```
   # Create a PostgreSQL database named 'billing_software'
   # Then run the schema script
   psql -U postgres -d billing_software -f database/schema.sql
   ```
   
   Alternatively, you can run the database initialization script:
   ```
   cd database
   node init.js
   ```

5. Start the development server:
   ```
   npm run dev
   ```

6. Access the application:
   - Backend API: http://localhost:5000
   - Frontend: http://localhost:3000

## API Endpoints

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer by ID
- `GET /api/customers/search` - Search customers
- `POST /api/customers` - Create a new customer
- `PUT /api/customers/:id` - Update a customer
- `DELETE /api/customers/:id` - Delete a customer

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/sku/:sku` - Get product by SKU
- `GET /api/products/search` - Search products
- `GET /api/products/low-stock` - Get low stock products
- `GET /api/products/categories` - Get all categories
- `POST /api/products` - Create a new product
- `PUT /api/products/:id` - Update a product
- `PATCH /api/products/:id/stock` - Update product stock
- `DELETE /api/products/:id` - Delete a product

### Invoices
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/:id` - Get invoice by ID
- `GET /api/invoices/unpaid` - Get unpaid invoices
- `GET /api/invoices/date-range` - Get invoices by date range
- `GET /api/invoices/:id/pdf` - Generate invoice PDF
- `POST /api/invoices` - Create a new invoice
- `POST /api/invoices/:id/email` - Send invoice by email
- `POST /api/invoices/:id/return` - Process a sales return
- `PATCH /api/invoices/:id/payment` - Update invoice payment status

### Purchases
- `GET /api/purchases` - Get all purchases
- `GET /api/purchases/:id` - Get purchase by ID
- `GET /api/purchases/unpaid` - Get unpaid purchases
- `GET /api/purchases/date-range` - Get purchases by date range
- `GET /api/purchases/supplier/:supplier_id` - Get purchases by supplier
- `POST /api/purchases` - Create a new purchase
- `PATCH /api/purchases/:id/payment` - Update purchase payment status

### Suppliers
- `GET /api/suppliers` - Get all suppliers
- `GET /api/suppliers/:id` - Get supplier by ID
- `GET /api/suppliers/search` - Search suppliers
- `GET /api/suppliers/pending-payments` - Get suppliers with pending payments
- `POST /api/suppliers` - Create a new supplier
- `PUT /api/suppliers/:id` - Update a supplier
- `DELETE /api/suppliers/:id` - Delete a supplier

### Reports
- `GET /api/reports/sales` - Get sales report
- `GET /api/reports/profit-loss` - Get profit and loss report
- `GET /api/reports/inventory` - Get inventory report
- `GET /api/reports/tax` - Get tax report
- `GET /api/reports/accounts-receivable` - Get accounts receivable report
- `GET /api/reports/accounts-payable` - Get accounts payable report

### Dashboard
- `GET /api/dashboard/summary` - Get dashboard summary
- `GET /api/dashboard/recent-sales` - Get recent sales
- `GET /api/dashboard/recent-purchases` - Get recent purchases
- `GET /api/dashboard/low-stock` - Get low stock products
- `GET /api/dashboard/sales-trend` - Get sales trend
- `GET /api/dashboard/top-products` - Get top selling products
- `GET /api/dashboard/payment-methods` - Get payment method distribution

## License

ISC 