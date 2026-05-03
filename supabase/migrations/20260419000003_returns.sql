CREATE TABLE IF NOT EXISTS return_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, refunded
    admin_notes TEXT,
    stripe_refund_id TEXT,
    refund_amount NUMERIC(10,2),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;

-- Users can see their own return requests
CREATE POLICY "Users can view own returns" ON return_requests
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own return requests
CREATE POLICY "Users can create own returns" ON return_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role / admin can do everything (via RLS bypass or SECURITY DEFINER)
