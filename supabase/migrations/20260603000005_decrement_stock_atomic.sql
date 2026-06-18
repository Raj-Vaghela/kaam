-- ============================================================
-- Atomic stock decrement
--
-- Part A: Commit the existing single-item decrement_stock function that
--   lives in production but was never written to a migration file.
--   Using CREATE OR REPLACE makes this idempotent.
--
-- Part B: New decrement_stock_batch RPC — atomically decrements stock
--   for multiple items in a single transaction, with a FOR UPDATE lock
--   to prevent oversell under concurrent checkouts.
-- ============================================================

-- ── Part A: existing single-item function (recovered from production) ──
-- SECURITY DEFINER + locked search_path added here; production version
-- may lack these. The existing remote function was declared with parameter
-- names `p_product_id, p_quantity`; we rename to `product_id, quantity` for
-- clarity, which CREATE OR REPLACE cannot do — so we DROP first.
-- The signature (uuid, int) is unchanged, so positional callers are unaffected.
DROP FUNCTION IF EXISTS public.decrement_stock(uuid, int);

CREATE OR REPLACE FUNCTION public.decrement_stock(
    product_id uuid,
    quantity   int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
    UPDATE public.products p
    SET    stock = p.stock - quantity
    WHERE  p.id  = product_id
      AND  p.stock >= quantity;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'insufficient_stock'
            USING ERRCODE = 'P0001',
                  DETAIL  = 'product_id=' || product_id::text;
    END IF;
END;
$$;

-- Only the webhook (service role) and admin paths need this.
-- Anon/authenticated should never call it directly.
REVOKE ALL ON FUNCTION public.decrement_stock(uuid, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrement_stock(uuid, int) TO service_role;


-- ── Part B: new batch function ──
-- Input: jsonb array of {"product_id": "<uuid>", "quantity": <int>} objects.
-- All decrements happen in one transaction with SELECT … FOR UPDATE to
-- serialise concurrent checkouts on the same products.
-- If any product has insufficient stock the entire transaction is rolled back.

CREATE OR REPLACE FUNCTION public.decrement_stock_batch(p_items jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    v_item       jsonb;
    v_product_id uuid;
    v_quantity   int;
    v_stock      int;
BEGIN
    -- Validate input
    IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
        RAISE EXCEPTION 'invalid_input: p_items must be a JSON array'
            USING ERRCODE = '22023';
    END IF;

    -- Lock all affected rows upfront in a deterministic order (by product_id)
    -- to prevent deadlocks when two concurrent calls share products.
    FOR v_item IN
        SELECT value
        FROM   jsonb_array_elements(p_items) AS value
        ORDER  BY value->>'product_id'
    LOOP
        v_product_id := (v_item->>'product_id')::uuid;
        v_quantity   := (v_item->>'quantity')::int;

        IF v_product_id IS NULL THEN
            RAISE EXCEPTION 'invalid_input: product_id is required in each item'
                USING ERRCODE = '22023';
        END IF;

        IF v_quantity IS NULL OR v_quantity <= 0 THEN
            RAISE EXCEPTION 'invalid_input: quantity must be a positive integer (product_id=%)', v_product_id
                USING ERRCODE = '22023';
        END IF;

        -- Acquire row lock and read current stock atomically.
        SELECT p.stock INTO v_stock
        FROM   public.products p
        WHERE  p.id = v_product_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'product_not_found: product_id=%', v_product_id
                USING ERRCODE = 'P0002';
        END IF;

        IF v_stock < v_quantity THEN
            RAISE EXCEPTION 'insufficient_stock: product_id=%, requested=%, available=%',
                            v_product_id, v_quantity, v_stock
                USING ERRCODE = 'P0001';
        END IF;

        UPDATE public.products
        SET    stock = stock - v_quantity
        WHERE  id    = v_product_id;
    END LOOP;
END;
$$;

-- Only the webhook / server-side paths (service role) may call this.
REVOKE ALL ON FUNCTION public.decrement_stock_batch(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrement_stock_batch(jsonb) TO service_role;
