# Billing Software MVP - Project Index

## Application Overview
A full-stack billing software solution built with React.js frontend and Node.js backend, using PostgreSQL for data storage. This MVP provides comprehensive billing, inventory, and business management functionality.

## Project Structure
```
billing-software-mvp/
├── client/                 # React frontend
│   ├── public/             # Static files
│   ├── src/                # React source code
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── styles/         # CSS styles
│   │   └── utils/          # Utility functions
│   ├── desktop-app/        # Desktop application files
│   └── build/              # Production build
├── server/                 # Node.js backend
│   ├── src/                # Server source code
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── database/       # Database connection
│   │   └── utils/          # Utility functions
│   └── storage/            # Storage for PDFs, etc.
├── database/               # Database scripts
│   ├── schema.sql          # Database schema
│   ├── clear_tables.sql    # Script to clear tables
│   └── init.js             # Database initialization
├── Installation/           # Installation guides and resources
└── storage/                # Application storage
```

## Core Features

### Customer Management
- Customer registration and profile management
- Customer transaction history
- Account receivables tracking

### Product Management
- Product catalog management
- Inventory tracking
- Category organization
- Low stock alerts

### Invoicing System
- Invoice generation and management
- Payment processing and tracking
- PDF invoice generation
- Email invoice functionality
- Sales return & refund processing

### Purchase Management
- Supplier management
- Purchase order creation
- Account payables tracking
- Supplier payment tracking

### Reporting
- Sales reports
- Inventory reports
- Profit/Loss analysis
- Tax reports
- Receivables/Payables reports
- Purchase reports

## Technical Architecture

### Frontend (React.js)
- **Components/**
  - PaymentForm - Payment processing interface
  - PaymentHistory - Transaction history display
  - Layout/
    - Header - Application header component
    - Sidebar - Navigation sidebar

- **Pages/**
  - Dashboard - Main overview page
  - Customers - Customer management
  - Products - Product catalog
  - Invoices - Invoice management
  - Purchases - Purchase order management
  - Reports - Various business reports
  - Suppliers - Supplier management

- **Services/**
  - api.js - API integration service

- **Utils/**
  - format.js - Data formatting utilities
  - formatters.js - Additional formatting helpers

### Backend (Node.js/Express)
- **Controllers/**
  - customerController - Customer operations
  - dashboardController - Dashboard data management
  - invoiceController - Invoice operations
  - paymentController - Payment processing
  - productController - Product operations
  - purchaseController - Purchase order management
  - reportController - Report generation
  - supplierController - Supplier operations

- **Models/**
  - customerModel - Customer data model
  - dashboardModel - Dashboard data model
  - invoiceModel - Invoice data model
  - paymentModel - Payment data model
  - productModel - Product data model
  - purchaseModel - Purchase data model
  - reportModel - Report data model
  - supplierModel - Supplier data model

- **Utils/**
  - emailSender - Email notification service
  - numberGenerator - Invoice/Order number generation
  - pdfGenerator - PDF document generation

## Database
- PostgreSQL database with tables for:
  - Customers
  - Products
  - Invoices
  - Invoice_Items
  - Payments
  - Purchases
  - Purchase_Items
  - Suppliers
  - Categories
  - Users

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

## Development Tools
- Tailwind CSS for styling
- Chart.js for data visualization
- PDFKit for PDF generation
- Nodemailer for email services

## Utility Scripts
- Various batch files (.bat) and PowerShell scripts (.ps1) for:
  - Setting up and fixing database connections
  - Running the application
  - Fixing various components
  - Clearing database
  - Running backend and frontend separately

## Getting Started
Refer to the Installation Guide in the Installation/ directory for setup instructions.

## Running the Application
1. Use `run-app.bat` or `start-app.bat` to run the complete application
2. Use `run-backend.bat` to run only the backend server
3. Use `run-frontend.bat` to run only the frontend client
4. Use `fix-and-run.bat` to fix common issues and run the application