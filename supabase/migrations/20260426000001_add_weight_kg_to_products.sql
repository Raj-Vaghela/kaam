-- Add the missing weight_kg column to products.
-- This column is referenced in all public-facing product queries but was never
-- created in the original migration, causing every product query to fail silently.
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_kg NUMERIC DEFAULT 0;

-- Backfill existing products with realistic weights from the mock data
UPDATE products SET weight_kg = 5    WHERE name ILIKE '%Basmati Rice%';
UPDATE products SET weight_kg = 1    WHERE name ILIKE '%Tata Gold Tea%';
UPDATE products SET weight_kg = 10   WHERE name ILIKE '%Aashirvaad%';
UPDATE products SET weight_kg = 0.4  WHERE name ILIKE '%Bhujia Sev%';
UPDATE products SET weight_kg = 0.1  WHERE name ILIKE '%Deggi Mirch%';
UPDATE products SET weight_kg = 1    WHERE name ILIKE '%Amul%Ghee%';
UPDATE products SET weight_kg = 0.3  WHERE name ILIKE '%Parle-G%';
UPDATE products SET weight_kg = 0.2  WHERE name ILIKE '%Dabur%Toothpaste%';
