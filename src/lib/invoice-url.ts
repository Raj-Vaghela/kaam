import { createClient } from "@supabase/supabase-js";

/**
 * Generate a signed URL for an invoice PDF stored in Supabase Storage.
 * The pdf_url column stores the path (e.g., "GJX-202604-AB12CD34/invoice.pdf"),
 * not a full URL. This function creates a time-limited signed URL.
 */
export async function getSignedInvoiceUrl(
    pdfPath: string | null,
    expiresInSeconds: number = 3600
): Promise<string | null> {
    if (!pdfPath) return null;

    // If it's already a full URL (legacy data), return as-is
    if (pdfPath.startsWith("http")) return pdfPath;

    // Service role required — the invoices bucket is private.
    // If SUPABASE_SERVICE_ROLE_KEY is absent (should never happen in production
    // given env.ts validation), this will silently return null because the anon
    // key cannot create signed URLs for private buckets.
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase.storage
        .from("invoices")
        .createSignedUrl(pdfPath, expiresInSeconds);

    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
}
