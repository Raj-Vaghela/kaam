-- Product reviews
CREATE TABLE IF NOT EXISTS product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    body TEXT NOT NULL CHECK (char_length(body) BETWEEN 10 AND 1000),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(product_id, user_id) -- one review per product per user
);
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read reviews" ON product_reviews FOR SELECT USING (true);
CREATE POLICY "Auth users can insert own reviews" ON product_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth users can update own reviews" ON product_reviews FOR UPDATE USING (auth.uid() = user_id);

-- Wishlist
CREATE TABLE IF NOT EXISTS user_wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, product_id)
);
ALTER TABLE user_wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own wishlist" ON user_wishlists USING (auth.uid() = user_id);
