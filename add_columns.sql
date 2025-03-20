-- Add missing columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS hsn_sac_code VARCHAR(20);
ALTER TABLE products ADD COLUMN IF NOT EXISTS gst_rate DECIMAL(5, 2) DEFAULT 0;

-- Add missing columns to invoice_items table
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS hsn_sac_code VARCHAR(20);
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS gst_rate DECIMAL(5, 2) DEFAULT 0; 