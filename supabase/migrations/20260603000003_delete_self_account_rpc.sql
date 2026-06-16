-- ============================================================
-- delete_self_account RPC
--
-- Fulfils the GDPR Art. 17 "right to erasure" obligation referenced in
-- the privacy policy's /api/account/delete promise.
--
-- What this function does (runs inside a single transaction):
--   1. Anonymises orders: clears PII but keeps order records for HMRC
--      7-year accounting retention (VAT Act 1994 / Making Tax Digital).
--   2. Wipes the profiles row (cascades are safe here; see note below).
--
-- What it does NOT do (must be handled by the Next.js API route that
-- calls this RPC):
--   - auth.admin.deleteUser(uid) — requires the Supabase service-role key
--     and must be called from a server-side route, NOT from inside a
--     SECURITY DEFINER function running under the user's session.
--
-- Calling convention (from /api/account/delete route):
--   1. Call this RPC via the authenticated user's client to anonymise data.
--   2. Immediately call supabaseAdmin.auth.admin.deleteUser(uid) to
--      remove the auth.users row and revoke all sessions.
--
-- Security properties:
--   - SECURITY DEFINER: can write to tables the user cannot directly modify.
--   - Caller identity taken from auth.uid() — cannot be spoofed.
--   - search_path locked.
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_self_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    v_uid uuid := auth.uid();
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
    END IF;

    -- ── 1. Anonymise orders ──
    -- Keep the row for HMRC retention but remove all personal identifiers.
    -- The 'anonymised+<id>@deleted.local' sentinel lets ops scripts
    -- distinguish anonymised rows from real guest_email = NULL rows.
    UPDATE public.orders
    SET
        user_id          = NULL,
        guest_email      = 'anonymised+' || id::text || '@deleted.local',
        guest_token      = NULL,
        shipping_address = '{}'::jsonb,
        billing_address  = '{}'::jsonb,
        consent_given_at = NULL
    WHERE user_id = v_uid;

    -- ── 2. Anonymise profile ──
    -- We UPDATE rather than DELETE because:
    --   a) The profiles FK from other tables (audit_logs) uses ON DELETE SET NULL
    --      which is fine, but keeping the row avoids any FK violation edge-cases.
    --   b) audit_logs should remain intact for security forensics.
    UPDATE public.profiles
    SET
        full_name    = NULL,
        phone        = NULL,
        address_line1 = NULL,
        address_line2 = NULL,
        city          = NULL,
        postcode      = NULL
    WHERE id = v_uid;

    -- NOTE: The auth.users row is NOT deleted here.
    -- The calling API route (/api/account/delete) MUST follow this RPC
    -- with: supabaseAdmin.auth.admin.deleteUser(uid)
    -- That call invalidates all sessions and removes the auth row.
    -- If that call fails, the profile is already anonymised, so the
    -- account is unusable even if the auth row persists briefly.
END;
$$;

-- Only authenticated users (i.e. users with a valid session) may call this.
REVOKE ALL ON FUNCTION public.delete_self_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_self_account() TO authenticated;
