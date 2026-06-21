-- Restore stock to products when an order is cancelled or refunded.
-- Mirrors decrement_stock_batch (migration 20260603000005). Used by:
--   1. Customer self-cancel server action (/account/orders/cancelOrder).
--   2. Admin refund flow when an entire order is returned.
-- Atomic: locks all affected rows in deterministic order to avoid deadlocks.

CREATE OR REPLACE FUNCTION public.increment_stock_batch(p_items jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    v_item       jsonb;
    v_product_id uuid;
    v_quantity   int;
BEGIN
    IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
        RAISE EXCEPTION 'invalid_input: p_items must be a JSON array'
            USING ERRCODE = '22023';
    END IF;

    FOR v_item IN
        SELECT value
        FROM   jsonb_array_elements(p_items) AS value
        ORDER  BY value->>'product_id'
    LOOP
        v_product_id := (v_item->>'product_id')::uuid;
        v_quantity   := (v_item->>'quantity')::int;

        IF v_product_id IS NULL THEN
            RAISE EXCEPTION 'invalid_input: product_id required in each item'
                USING ERRCODE = '22023';
        END IF;

        IF v_quantity IS NULL OR v_quantity <= 0 THEN
            RAISE EXCEPTION 'invalid_input: quantity must be a positive integer (product_id=%)', v_product_id
                USING ERRCODE = '22023';
        END IF;

        PERFORM 1
        FROM   public.products p
        WHERE  p.id = v_product_id
        FOR UPDATE;

        IF NOT FOUND THEN
            CONTINUE;
        END IF;

        UPDATE public.products
        SET    stock = stock + v_quantity
        WHERE  id    = v_product_id;
    END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_stock_batch(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_stock_batch(jsonb) TO service_role;
