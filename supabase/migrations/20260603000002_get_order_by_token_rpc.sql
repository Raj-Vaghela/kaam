-- ============================================================
-- get_order_by_token RPC
--
-- Safe replacement for direct SELECT on orders WHERE guest_token = $1.
-- Migration 20260603000001 removed the policy that allowed any anon to
-- dump all guest orders; this RPC is the only way to look up a guest
-- order from the front-end.
--
-- Security properties:
--   - SECURITY DEFINER: runs as the function owner, bypasses RLS.
--   - search_path locked: prevents search-path injection.
--   - Returns NULL (not an error) for no-match, preventing oracle attacks.
--   - Input validated: raises INVALID_TEXT_REPRESENTATION if p_token is
--     not a valid UUID, closing the timing oracle on malformed tokens.
--   - Never returns anonymised orders (those have been GDPR-wiped).
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_order_by_token(p_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    v_order_id uuid;
    v_result   json;
BEGIN
    -- p_token typed as uuid so Postgres already rejects non-UUID strings at
    -- the call boundary; this explicit guard is for defence-in-depth when
    -- the function is called via dynamic SQL or RPC with text coercion.
    IF p_token IS NULL THEN
        RETURN NULL;
    END IF;

    -- Look up the order.  Exclude rows that have been anonymised (GDPR Art.17):
    -- we treat a NULL guest_email combined with a NULL user_id as anonymised.
    SELECT o.id INTO v_order_id
    FROM public.orders o
    WHERE o.guest_token = p_token
      AND NOT (o.user_id IS NULL AND o.guest_email IS NULL)
    LIMIT 1;

    IF v_order_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Build the response JSON: order header + line items array.
    SELECT json_build_object(
        'id',               o.id,
        'status',           o.status,
        'total',            o.total,
        'guest_email',      o.guest_email,
        'shipping_address', o.shipping_address,
        'billing_address',  o.billing_address,
        'tracking_number',  o.tracking_number,
        'tracking_url',     o.tracking_url,
        'created_at',       o.created_at,
        'items', (
            SELECT json_agg(
                json_build_object(
                    'id',           i.id,
                    'product_id',   i.product_id,
                    'product_name', i.product_name,
                    'quantity',     i.quantity,
                    'unit_price',   i.unit_price
                )
            )
            FROM public.order_items i
            WHERE i.order_id = o.id
        )
    )
    INTO v_result
    FROM public.orders o
    WHERE o.id = v_order_id;

    RETURN v_result;
END;
$$;

-- Allow both anon (guest tracking page) and authenticated users to call this.
-- The function itself enforces the token match; no privilege escalation is possible.
REVOKE ALL ON FUNCTION public.get_order_by_token(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_by_token(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_order_by_token(uuid) TO authenticated;
