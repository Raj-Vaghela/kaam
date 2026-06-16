-- ============================================================
-- Newsletter consent columns (PECR compliance)
--
-- UK PECR (Privacy and Electronic Communications Regulations) and
-- UK GDPR require that consent for email marketing is:
--   - freely given, specific, informed, and unambiguous
--   - demonstrable (consent record retained)
--   - revocable (unsubscribe mechanism)
--
-- This migration adds the columns needed to record and honour consent,
-- and provides the unsubscribe_token for one-click unsubscribe links.
--
-- NOTE: Existing subscribers were collected without explicit granular
-- consent capture. Treat them as legacy-confirmed (confirmed_at = created_at)
-- but RECOMMEND running a re-permission campaign before the next
-- marketing send to obtain fresh, recorded consent.
-- ============================================================

ALTER TABLE public.newsletter_subscribers
    ADD COLUMN IF NOT EXISTS unsubscribe_token text
        UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),

    ADD COLUMN IF NOT EXISTS confirmed_at      timestamptz,
    ADD COLUMN IF NOT EXISTS unsubscribed_at   timestamptz,
    ADD COLUMN IF NOT EXISTS consent_ip        inet,
    ADD COLUMN IF NOT EXISTS consent_text      text,
    ADD COLUMN IF NOT EXISTS consent_source    text;

-- Backfill: treat existing rows as legacy-confirmed.
-- This avoids immediately breaking any existing subscriber flows,
-- but a re-permission campaign is strongly recommended.
UPDATE public.newsletter_subscribers
SET confirmed_at = subscribed_at
WHERE confirmed_at IS NULL;

-- Fast lookup for unsubscribe link handler: /api/newsletter/unsubscribe?token=<token>
CREATE INDEX IF NOT EXISTS idx_newsletter_unsubscribe_token
    ON public.newsletter_subscribers (unsubscribe_token);
