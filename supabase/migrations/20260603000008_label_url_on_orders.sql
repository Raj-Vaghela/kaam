-- ============================================================
-- label_url column + stripe_payment_intent_id index
--
-- This migration absorbs the previously-untracked file
-- supabase/migrations/20260528000001_add_label_url_to_orders.sql
-- (which only contained: ALTER TABLE orders ADD COLUMN IF NOT EXISTS label_url TEXT)
-- and extends it with the missing index on stripe_payment_intent_id.
--
-- NOTE: The original 20260528000001 file remains on disk for reference
-- but its single statement is superseded here. When applying to a
-- clean DB only the 20260603 series will be run; the 20260528 file
-- is a no-op on remote because IF NOT EXISTS guards the column add.
-- ============================================================

-- Add label_url if not already present (idempotent guard for the case
-- where 20260528000001 was already applied to this environment).
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS label_url text;

-- Add stripe_payment_intent_id column if it does not yet exist.
-- The processRefund function in the webhook reads orders by this field;
-- without an index, every refund triggers a full table scan.
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;

-- Index for processRefund / webhook charge lookup.
CREATE INDEX IF NOT EXISTS orders_stripe_payment_intent_id_idx
    ON public.orders (stripe_payment_intent_id);
