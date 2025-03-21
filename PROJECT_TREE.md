# Billing Software Project Structure

```
billing-software/
├── .gitignore
├── PROJECT_INDEX.md
├── README.md
├── add_columns.sql
├── check-schema.sql
├── clear-database.bat
├── create-db.js
├── package.json
├── package-lock.json
├── query
├── run-app.bat
├── run-backend.bat
├── run-frontend.bat
├── setup-database.bat
│
├── client/                          # Frontend React Application
│   ├── Installation/
│   ├── desktop-app/                 # Desktop application files
│   │   ├── assets/
│   │   ├── desktop-app/
│   │   │   └── dist/
│   │   └── dist/
│   │       └── Billing-Software-Setup.exe
│   ├── public/                      # Static assets
│   │   ├── favicon.svg
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── temp.html
│   ├── src/                         # Source code
│   │   ├── App.js
│   │   ├── index.js
│   │   ├── index.css
│   │   ├── reportWebVitals.js
│   │   ├── assets/
│   │   │   └── logo.svg
│   │   ├── components/              # Reusable components
│   │   │   ├── PaymentForm.js
│   │   │   ├── PaymentHistory.js
│   │   │   ├── Sidebar.js
│   │   │   └── layout/
│   │   │       ├── Header.js
│   │   │       └── Sidebar.js
│   │   ├── pages/                   # Page components
│   │   │   ├── Categories.js
│   │   │   ├── CustomerForm.js
│   │   │   ├── Customers.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Documentation.js
│   │   │   ├── InvoiceForm.js
│   │   │   ├── InvoiceView.js
│   │   │   ├── Invoices.js
│   │   │   ├── Login.js
│   │   │   ├── ProductForm.js
│   │   │   ├── Products.js
│   │   │   ├── PurchaseForm.js
│   │   │   ├── PurchaseView.js
│   │   │   ├── Purchases.js
│   │   │   ├── Reports.js
│   │   │   ├── SalesReport.js
│   │   │   ├── SupplierForm.js
│   │   │   ├── Suppliers.js
│   │   │   └── reports/             # Report-specific pages
│   │   │       ├── InventoryReport.js
│   │   │       ├── PayablesReport.js
│   │   │       ├── ProfitLossReport.js
│   │   │       ├── PurchaseReport.js
│   │   │       ├── ReceivablesReport.js
│   │   │       ├── SalesReport.js
│   │   │       └── TaxReport.js
│   │   ├── services/                # API services
│   │   │   ├── api.js
│   │   │   └── auth.js
│   │   ├── styles/                  # CSS styles
│   │   │   ├── buttons.css
│   │   │   └── reports.css
│   │   └── utils/                   # Utility functions
│   │       ├── format.js
│   │       └── formatters.js
│   ├── package.json
│   ├── package-lock.json
│   └── tailwind.config.js
│
├── server/                          # Backend Node.js Application
│   ├── .env                         # Environment variables
│   ├── package.json
│   ├── package-lock.json
│   └── src/                         # Source code
│       ├── index.js                 # Entry point
│       ├── config/                  # Configuration files
│       │   ├── db.js
│       │   └── db.js.new
│       ├── controllers/             # Request handlers
│       │   ├── customerController.js
│       │   ├── dashboardController.js
│       │   ├── invoiceController.js
│       │   ├── paymentController.js
│       │   ├── productController.js
│       │   ├── purchaseController.js
│       │   ├── reportController.js
│       │   └── supplierController.js
│       ├── database/                # Database migrations
│       │   ├── migrations/
│       │   │   ├── add_payments_table.sql
│       │   │   ├── create_payments_table.sql
│       │   │   └── payments.sql
│       │   └── runMigrations.js
│       ├── middleware/              # Custom middleware
│       ├── models/                  # Database models
│       │   ├── customerModel.js
│       │   ├── dashboardModel.js
│       │   ├── invoiceModel.js
│       │   ├── paymentModel.js
│       │   ├── productModel.js
│       │   ├── purchaseModel.js
│       │   ├── reportModel.js
│       │   └── supplierModel.js
│       ├── routes/                  # API routes
│       │   ├── customers.js
│       │   ├── dashboard.js
│       │   ├── index.js
│       │   ├── invoices.js
│       │   ├── paymentRoutes.js
│       │   ├── products.js
│       │   ├── purchases.js
│       │   ├── reports.js
│       │   └── suppliers.js
│       └── utils/                   # Utility functions
│           ├── emailSender.js
│           ├── numberGenerator.js
│           └── pdfGenerator.js
│
├── database/                        # Database scripts
│   ├── clear_tables.sql
│   ├── init.js
│   └── schema.sql
│
└── storage/                         # File storage
    └── invoices/                    # Invoice PDFs
```