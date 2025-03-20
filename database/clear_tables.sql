-- Disable foreign key checks temporarily
SET session_replication_role = 'replica';

-- Clear child tables first
TRUNCATE TABLE sales_return_items CASCADE;
TRUNCATE TABLE sales_returns CASCADE;
TRUNCATE TABLE payments CASCADE;
TRUNCATE TABLE invoice_items CASCADE;
TRUNCATE TABLE purchase_items CASCADE;
TRUNCATE TABLE product_batches CASCADE;

-- Clear main tables
TRUNCATE TABLE invoices CASCADE;
TRUNCATE TABLE purchases CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE categories CASCADE;
TRUNCATE TABLE customers CASCADE;
TRUNCATE TABLE suppliers CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

-- Reset all sequences
SELECT setval(pg_get_serial_sequence('customers', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('suppliers', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('categories', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('products', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('product_batches', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('invoices', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('invoice_items', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('purchases', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('purchase_items', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('payments', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('sales_returns', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('sales_return_items', 'id'), 1, false); 