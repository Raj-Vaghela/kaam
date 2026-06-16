-- ============================================================
-- stripe_events deduplication table
--
-- Stripe guarantees "at least once" delivery; without this table a
-- network timeout between Stripe and the webhook handler causes a retry
-- that can double-decrement stock, double-fulfil an order, or corrupt
-- payment state.
--
-- Usage pattern (in the webhook handler):
--   INSERT INTO stripe_events (id, type, payload)
--   VALUES ($stripe_event_id, $type, $raw_payload)
--   ON CONFLICT (id) DO NOTHING;
--   -- If 0 rows inserted → already processed → return 200 immediately.
--
-- RLS: USING (false) / WITH CHECK (false) means no JWT-bearing request
-- can touch this table. The Stripe webhook uses the service role, which
-- bypasses RLS entirely, so it can always INSERT.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.stripe_events (
    id           text        PRIMARY KEY,         -- Stripe event ID (evt_...)
    type         text        NOT NULL,             -- e.g. "checkout.session.completed"
    payload      jsonb,                            -- raw Stripe event object (optional, for debugging)
    processed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- Deny all access via the API / anon key.
-- Service role bypasses RLS, so the webhook handler can still INSERT.
CREATE POLICY "No direct API access to stripe_events" ON public.stripe_events
    AS RESTRICTIVE
    FOR ALL
    USING (false)
    WITH CHECK (false);

-- Index for periodic cleanup job (DELETE FROM stripe_events WHERE processed_at < now() - interval '90 days').
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed_at
    ON public.stripe_events (processed_at DESC);
