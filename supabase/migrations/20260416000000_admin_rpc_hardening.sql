-- ============================================================
-- Admin RPC Hardening
--
-- Replaces service-role-based role mutations with a SECURITY DEFINER
-- RPC that runs under the caller's session and enforces the admin
-- check + allow-list + self-demote guard server-side.
--
-- Also adds a SECURITY DEFINER audit-log insert so app code never
-- needs the service role just to append to the log.
-- ============================================================

-- ---------- admin_set_user_role ----------
-- Atomically change a user's role. Callable by admins only.
-- - Rejects demoting the *last* admin (prevents lockout).
-- - Rejects unknown roles.
-- - Writes an audit_logs row in the same transaction.
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
    target_user_id uuid,
    new_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    caller uuid := auth.uid();
    caller_is_admin boolean;
    current_target_role text;
    remaining_admins int;
BEGIN
    IF caller IS NULL THEN
        RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
    END IF;

    -- Enforce allow-list
    IF new_role NOT IN ('customer', 'staff', 'admin') THEN
        RAISE EXCEPTION 'invalid_role' USING ERRCODE = '22023';
    END IF;

    -- Caller must be admin (read directly — we're SECURITY DEFINER so
    -- we bypass RLS; do not call is_admin() which depends on auth.uid
    -- inside a helper with variable search_path).
    SELECT role = 'admin' INTO caller_is_admin
    FROM public.profiles
    WHERE id = caller;

    IF NOT COALESCE(caller_is_admin, false) THEN
        RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
    END IF;

    -- Target must exist
    SELECT role INTO current_target_role
    FROM public.profiles
    WHERE id = target_user_id;

    IF current_target_role IS NULL THEN
        RAISE EXCEPTION 'target_not_found' USING ERRCODE = 'P0002';
    END IF;

    -- No-op shortcut
    IF current_target_role = new_role THEN
        RETURN;
    END IF;

    -- Prevent demoting yourself (could lock out the last admin)
    IF target_user_id = caller AND new_role <> 'admin' THEN
        RAISE EXCEPTION 'self_demote' USING ERRCODE = '42501';
    END IF;

    -- Prevent removing the last admin by any route
    IF current_target_role = 'admin' AND new_role <> 'admin' THEN
        SELECT count(*) INTO remaining_admins
        FROM public.profiles
        WHERE role = 'admin' AND id <> target_user_id;

        IF remaining_admins = 0 THEN
            RAISE EXCEPTION 'last_admin' USING ERRCODE = '42501';
        END IF;
    END IF;

    UPDATE public.profiles
    SET role = new_role
    WHERE id = target_user_id;

    INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, metadata)
    VALUES (
        caller,
        'user:role_change',
        'user',
        target_user_id::text,
        jsonb_build_object(
            'previousRole', current_target_role,
            'newRole', new_role
        )
    );
END;
$$;

-- Callable by authenticated users; the function itself gates on admin.
REVOKE ALL ON FUNCTION public.admin_set_user_role(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, text) TO authenticated;


-- ---------- log_admin_action ----------
-- Append-only audit insert callable by any authenticated user.
-- The *action* and *metadata* are whatever the caller passes, but the
-- user_id is always the caller's own id — callers cannot forge the
-- actor. Combined with RLS on audit_logs (admin read-only), this is
-- safer than letting app code use the service role just to log.
CREATE OR REPLACE FUNCTION public.log_admin_action(
    action_name text,
    resource_type text DEFAULT NULL,
    resource_id text DEFAULT NULL,
    metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    caller uuid := auth.uid();
BEGIN
    IF caller IS NULL THEN
        RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
    END IF;

    INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, metadata)
    VALUES (caller, action_name, resource_type, resource_id, COALESCE(metadata, '{}'::jsonb));
END;
$$;

REVOKE ALL ON FUNCTION public.log_admin_action(text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_admin_action(text, text, text, jsonb) TO authenticated;


-- ---------- list_admin_users ----------
-- Returns profile rows + email for all users. Admin-only.
-- Replaces the page's current SUPABASE_SERVICE_ROLE_KEY +
-- auth.admin.listUsers() path with a server-enforced RPC.
CREATE OR REPLACE FUNCTION public.list_admin_users()
RETURNS TABLE (
    id uuid,
    email text,
    full_name text,
    role text,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    caller uuid := auth.uid();
    caller_is_admin boolean;
BEGIN
    IF caller IS NULL THEN
        RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
    END IF;

    -- Qualify with table alias to avoid collision with the RETURNS TABLE
    -- column `role` (treated as a PL/pgSQL variable in this scope).
    SELECT p.role = 'admin' INTO caller_is_admin
    FROM public.profiles p
    WHERE p.id = caller;

    IF NOT COALESCE(caller_is_admin, false) THEN
        RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    SELECT
        p.id,
        u.email::text,
        p.full_name,
        p.role,
        p.created_at
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    ORDER BY p.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.list_admin_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_admin_users() TO authenticated;
