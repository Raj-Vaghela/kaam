/**
 * Validates a redirect URL to prevent open redirect attacks.
 * Only allows relative paths starting with a single slash.
 */
export function safeRedirect(url: string, fallback: string = "/"): string {
    // Must be a string and non-empty
    if (!url || typeof url !== "string") return fallback;

    // Trim whitespace
    const trimmed = url.trim();

    // Must start with exactly one forward slash (not protocol-relative //)
    if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return fallback;

    // Block any URL with a protocol scheme (javascript:, data:, etc.)
    if (/^\/.*:/i.test(trimmed) && trimmed.includes("://")) return fallback;

    // Block encoded characters that could bypass checks
    if (trimmed.includes("%2f") || trimmed.includes("%2F")) return fallback;
    if (trimmed.includes("\\")) return fallback;

    return trimmed;
}
