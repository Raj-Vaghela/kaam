-- =============================================
-- GUEST CHECKOUT & INVOICE SYSTEM MIGRATION
-- =============================================

-- Modify orders table to support guest checkout
ALTER TABLE orders 
    ALTER COLUMN user_id DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS guest_email TEXT,
    ADD COLUMN IF NOT EXISTS guest_token UUID DEFAULT gen_random_uuid(),
    ADD COLUMN IF NOT EXISTS billing_address JSONB;

-- Create invoices table (immutable for legal compliance)
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL,
    order_id UUID REFERENCES orders(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    
    -- Customer details (snapshot at time of invoice)
    customer_email TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    billing_address JSONB NOT NULL,
    
    -- Line items (snapshot)
    items JSONB NOT NULL,
    
    -- Amounts
    subtotal DECIMAL(10,2) NOT NULL,
    vat_rate DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    vat_amount DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    
    -- PDF storage
    pdf_url TEXT,
    
    -- Prevent modifications
    updated_at TIMESTAMPTZ
);

-- Add invoice_id to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id);

-- Create credit_notes table for refunds
CREATE TABLE IF NOT EXISTS credit_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credit_note_number TEXT UNIQUE NOT NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT,
    refund_id TEXT -- Stripe refund ID
);

-- Create index for guest order lookup
CREATE INDEX IF NOT EXISTS idx_orders_guest_token ON orders(guest_token);
CREATE INDEX IF NOT EXISTS idx_orders_guest_email ON orders(guest_email);

-- RLS for invoices (read-only for users, service role can create)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own invoices"
    ON invoices FOR SELECT
    USING (
        order_id IN (
            SELECT id FROM orders 
            WHERE user_id = auth.uid() OR guest_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- RLS for credit_notes
ALTER TABLE credit_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credit notes"
    ON credit_notes FOR SELECT
    USING (
        invoice_id IN (
            SELECT i.id FROM invoices i
            JOIN orders o ON i.order_id = o.id
            WHERE o.user_id = auth.uid()
        )
    );

-- Update orders RLS to allow guest orders
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;

CREATE POLICY "Users can view their own orders"
    ON orders FOR SELECT
    USING (user_id = auth.uid() OR guest_token IS NOT NULL);

CREATE POLICY "Anyone can insert orders"
    ON orders FOR INSERT
    WITH CHECK (true);

-- Allow service role to update orders (for webhook)
CREATE POLICY "Service role can update orders"
    ON orders FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Update order_items RLS
DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;
DROP POLICY IF EXISTS "Users can insert their own order items" ON order_items;

CREATE POLICY "Users can view order items"
    ON order_items FOR SELECT
    USING (
        order_id IN (SELECT id FROM orders WHERE user_id = auth.uid() OR guest_token IS NOT NULL)
    );

CREATE POLICY "Anyone can insert order items"
    ON order_items FOR INSERT
    WITH CHECK (true);
