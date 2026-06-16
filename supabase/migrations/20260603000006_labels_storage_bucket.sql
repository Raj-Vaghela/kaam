-- ============================================================
-- Private 'labels' storage bucket
--
-- src/app/admin/orders/actions.ts uploads Evri shipping label PDFs to
-- a bucket called 'labels' which did not exist in any migration.
-- This migration creates it as a private, admin-only bucket.
--
-- Security:
--   - public = false  → no unauthenticated URL access
--   - 5 MB file size cap (sufficient for a PDF label)
--   - Only PDF MIME type allowed
--   - RLS policies restrict all operations to admin/staff roles
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'labels',
    'labels',
    false,
    5242880,    -- 5 MiB
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- SELECT: admins/staff can view/download label PDFs.
CREATE POLICY "Admins can read labels"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'labels'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

-- INSERT: admins/staff can upload label PDFs.
CREATE POLICY "Admins can upload labels"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'labels'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

-- UPDATE: admins/staff can replace a label (e.g. regenerate).
CREATE POLICY "Admins can update labels"
    ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'labels'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

-- DELETE: admins/staff can remove labels.
CREATE POLICY "Admins can delete labels"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'labels'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );
