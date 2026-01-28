-- Add SKU column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100);

-- Add index on SKU for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
