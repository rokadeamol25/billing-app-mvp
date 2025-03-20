-- Create payments table for tracking partial payments
CREATE TABLE IF NOT EXISTS payments (
    payment_id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(invoice_id),
    payment_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- CASH, CREDIT_CARD, BANK_TRANSFER, etc.
    reference_number VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Modify invoices table to track payment status
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'UNPAID',
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS balance_due DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED;

-- Create view for accounts receivable
CREATE OR REPLACE VIEW accounts_receivable AS
SELECT 
    c.customer_id,
    c.name AS customer_name,
    i.invoice_id,
    i.invoice_number,
    i.issue_date,
    i.due_date,
    i.total_amount,
    i.amount_paid,
    i.balance_due,
    i.payment_status,
    CASE 
        WHEN i.due_date < CURRENT_DATE AND i.balance_due > 0 THEN 'OVERDUE'
        ELSE 'CURRENT'
    END AS status,
    CASE
        WHEN i.due_date < CURRENT_DATE THEN CURRENT_DATE - i.due_date
        ELSE 0
    END AS days_overdue
FROM 
    invoices i
JOIN 
    customers c ON i.customer_id = c.customer_id
WHERE 
    i.balance_due > 0 AND i.status != 'CANCELLED'; 