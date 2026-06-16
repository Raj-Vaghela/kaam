-- ============================================================
-- Drop dangerously open RLS policies and replace with tight ones
-- ============================================================

-- ── products ──
-- Drop the "for development" open write policies from the initial migration.
DROP POLICY IF EXISTS "Allow public write access" ON products;
DROP POLICY IF EXISTS "Allow public update access" ON products;
DROP POLICY IF EXISTS "Allow public delete access" ON products;
-- "Allow public read access" and "Anyone can read products" are fine (SELECT USING (true)).
-- "Admins can manage products" from security_hardening covers INSERT/UPDATE/DELETE for admins.
-- To be explicit and belt-and-suspenders, re-create the admin write policies using the
-- is_admin_or_staff() helper (created in 20260413185131 as EXISTS check).

DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products" ON products
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

-- ── orders – SELECT ──
-- Drop the policy that leaks ALL guest orders to any anon:
-- "Users can view their own orders" (from 20260204120000) - USING (user_id = auth.uid() OR guest_token IS NOT NULL)
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
-- Also drop variants created by security_hardening (belt-and-suspenders):
DROP POLICY IF EXISTS "Users can read own orders" ON orders;

-- Authenticated users see only their own orders.
-- Guest order lookup must go through the get_order_by_token() SECURITY DEFINER RPC (see migration 002).
CREATE POLICY "Users can read own orders" ON orders
    FOR SELECT
    USING (auth.uid() = user_id);

-- Admins/staff can read all orders (pre-existing from security_hardening, recreated for clarity).
DROP POLICY IF EXISTS "Admins can read all orders" ON orders;
CREATE POLICY "Admins can read all orders" ON orders
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

-- ── orders – INSERT ──
-- Drop the fully-open insert policy.
DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;

-- Allow guest and authenticated checkout.
-- The WITH CHECK ensures an authenticated user cannot set a user_id belonging to someone else.
CREATE POLICY "Anyone can insert orders" ON orders
    FOR INSERT
    WITH CHECK (
        user_id IS NULL           -- guest checkout: no user_id required
        OR user_id = auth.uid()   -- logged-in: must own the row
    );

-- ── orders – UPDATE ──
-- Drop the old service-role policy (service role bypasses RLS, so this is dead weight and
-- an attack surface if the key ever leaks at the RLS evaluation layer).
DROP POLICY IF EXISTS "Service role can update orders" ON orders;
DROP POLICY IF EXISTS "Service can update orders" ON orders;

-- Only admins/staff may update orders via the API.
-- The Stripe webhook uses the service role, which bypasses RLS entirely; no policy needed for it.
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
CREATE POLICY "Admins can update orders" ON orders
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

-- ── order_items – SELECT ──
-- Drop the policy that exposes ALL guest order items to anyone:
-- "Users can view order items" - USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid() OR guest_token IS NOT NULL))
DROP POLICY IF EXISTS "Users can view order items" ON order_items;
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Users can read own order items" ON order_items;

-- Authenticated users see only items for their own orders.
CREATE POLICY "Users can read own order items" ON order_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_items.order_id
              AND o.user_id = auth.uid()
        )
    );

-- Admins/staff can read all order items.
DROP POLICY IF EXISTS "Admins can read all order items" ON order_items;
CREATE POLICY "Admins can read all order items" ON order_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

-- ── order_items – INSERT ──
-- Drop the fully-open insert policy.
DROP POLICY IF EXISTS "Anyone can insert order items" ON order_items;

-- Only allow inserting items for an order that belongs to the current user (or is a new guest order).
CREATE POLICY "Anyone can insert order items" ON order_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_items.order_id
              AND (
                  o.user_id IS NULL           -- guest order in progress
                  OR o.user_id = auth.uid()   -- authenticated user's order
              )
        )
    );
