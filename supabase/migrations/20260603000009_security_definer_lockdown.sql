-- ============================================================
-- Security Definer function lockdown
--
-- Ensures every SECURITY DEFINER function in the public schema has:
--   1. search_path locked to 'public, pg_catalog' (prevents schema-
--      injection attacks where an attacker creates a shadow function
--      in a schema earlier on the search path).
--   2. EXECUTE revoked from PUBLIC / anon where not needed.
--
-- Functions audited:
--   handle_new_user             – trigger, no direct EXECUTE grant needed
--   admin_set_user_role         – already hardened in 20260416000000; re-assert
--   log_admin_action            – already hardened in 20260416000000; re-assert
--   list_admin_users            – already hardened in 20260416000000; re-assert
--   is_admin / is_admin_or_staff – helpers; anon should not call directly
--   increment_promo_code_uses   – webhook-only; anon must not call
--   decrement_stock             – hardened in migration 005; re-assert here
-- ============================================================

-- ── handle_new_user ──
-- This is a TRIGGER function; it is called by the trigger mechanism, not
-- via EXECUTE. Revoking from PUBLIC/anon is still good hygiene.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
    INSERT INTO public.profiles (id)
    VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
-- Trigger functions don't need a GRANT; the trigger calls them as the owner.


-- ── is_admin ──
-- Pure helper used by RLS policies and other SECURITY DEFINER functions.
-- Anon callers have no legitimate use for this; revoke to prevent
-- information-leakage via timing side-channels.
DO $$
BEGIN
    -- Only create if it doesn't already exist (it was defined implicitly
    -- inside policies in earlier migrations).
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'is_admin'
    ) THEN
        EXECUTE $func$
            CREATE FUNCTION public.is_admin()
            RETURNS boolean
            LANGUAGE sql
            SECURITY DEFINER
            STABLE
            SET search_path = public, pg_catalog
            AS $body$
                SELECT EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE id = auth.uid() AND role = 'admin'
                );
            $body$;
        $func$;
    ELSE
        -- Re-create to lock search_path (CREATE OR REPLACE preserves grants).
        EXECUTE $func$
            CREATE OR REPLACE FUNCTION public.is_admin()
            RETURNS boolean
            LANGUAGE sql
            SECURITY DEFINER
            STABLE
            SET search_path = public, pg_catalog
            AS $body$
                SELECT EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE id = auth.uid() AND role = 'admin'
                );
            $body$;
        $func$;
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;


-- ── is_admin_or_staff ──
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'is_admin_or_staff'
    ) THEN
        EXECUTE $func$
            CREATE FUNCTION public.is_admin_or_staff()
            RETURNS boolean
            LANGUAGE sql
            SECURITY DEFINER
            STABLE
            SET search_path = public, pg_catalog
            AS $body$
                SELECT EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE id = auth.uid() AND role IN ('admin', 'staff')
                );
            $body$;
        $func$;
    ELSE
        EXECUTE $func$
            CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
            RETURNS boolean
            LANGUAGE sql
            SECURITY DEFINER
            STABLE
            SET search_path = public, pg_catalog
            AS $body$
                SELECT EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE id = auth.uid() AND role IN ('admin', 'staff')
                );
            $body$;
        $func$;
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin_or_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_or_staff() TO authenticated;


-- ── increment_promo_code_uses ──
-- Currently defined in 20260419000005 as LANGUAGE SQL SECURITY DEFINER
-- without a locked search_path.  Re-create with the lock.
CREATE OR REPLACE FUNCTION public.increment_promo_code_uses(p_code text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
    UPDATE public.promo_codes
    SET    uses_count = uses_count + 1
    WHERE  code = p_code;
$$;

-- Only authenticated users (completing checkout) should call this.
-- Anon can validate codes but should not increment until the order is placed.
REVOKE ALL ON FUNCTION public.increment_promo_code_uses(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_promo_code_uses(text) TO authenticated;
-- Service role inherits superuser bypass; no explicit grant needed.


-- ── admin_set_user_role ── (re-assert grants; body already hardened in 20260416000000)
-- The function body already enforces is_admin() internally, so the GRANT to
-- authenticated is correct (non-admins get a 'forbidden' exception at runtime).
REVOKE ALL ON FUNCTION public.admin_set_user_role(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, text) TO authenticated;


-- ── log_admin_action ── (re-assert; body already hardened in 20260416000000)
REVOKE ALL ON FUNCTION public.log_admin_action(text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_admin_action(text, text, text, jsonb) TO authenticated;


-- ── list_admin_users ── (re-assert; body already hardened in 20260416000000)
REVOKE ALL ON FUNCTION public.list_admin_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_admin_users() TO authenticated;


-- ── decrement_stock ── (re-assert; body locked in migration 005)
REVOKE ALL ON FUNCTION public.decrement_stock(uuid, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrement_stock(uuid, int) TO service_role;
