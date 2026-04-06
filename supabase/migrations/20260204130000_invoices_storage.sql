-- Create the 'invoices' storage bucket for PDF storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow Public Read Access (invoices should be accessible)
CREATE POLICY "Public Invoice Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'invoices');

-- Policy: Allow Service Role to Upload (webhook uploads)
CREATE POLICY "Service Upload Access"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'invoices');

-- Policy: Prevent deletion of invoices (immutable for legal compliance)
-- No DELETE policy = invoices cannot be deleted via API
