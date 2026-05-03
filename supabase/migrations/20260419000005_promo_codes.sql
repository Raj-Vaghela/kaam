CREATE TABLE IF NOT EXISTS promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
    discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
    min_order_value NUMERIC(10,2) DEFAULT 0,
    max_uses INTEGER, -- null = unlimited
    uses_count INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
-- Public can read active codes (needed for validation endpoint)
CREATE POLICY "Active codes are readable" ON promo_codes FOR SELECT USING (active = true);

-- Seed an initial welcome code
INSERT INTO promo_codes (code, description, discount_type, discount_value, min_order_value, max_uses)
VALUES ('WELCOME10', '£10 off first order over £60', 'fixed', 10.00, 60.00, NULL)
ON CONFLICT (code) DO NOTHING;

-- Add discount columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code TEXT;

-- RPC for atomic increment
CREATE OR REPLACE FUNCTION increment_promo_code_uses(p_code TEXT)
RETURNS VOID LANGUAGE SQL SECURITY DEFINER AS $$
    UPDATE promo_codes SET uses_count = uses_count + 1 WHERE code = p_code;
$$;
