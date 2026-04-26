CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    subscribed_at TIMESTAMPTZ DEFAULT now(),
    source TEXT DEFAULT 'footer'
);
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
-- Only service role can read/write (handled via API route with anon client + server-side insert)
