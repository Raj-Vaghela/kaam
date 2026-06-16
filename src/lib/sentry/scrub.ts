import type { Event, Breadcrumb } from "@sentry/nextjs";

/**
 * Keys that may carry PII. Matched case-insensitively against object keys
 * and URL query-parameter names.
 */
const SENSITIVE_KEY_RE =
    /^(email|phone|address|postcode|postal|password|token|secret|key|guest_token|stripe.*secret)/i;

/**
 * Recursively redact values from a plain object whose keys match
 * SENSITIVE_KEY_RE. Returns a new object — does not mutate the input.
 */
function scrubObject(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
        if (SENSITIVE_KEY_RE.test(k)) {
            result[k] = "[Filtered]";
        } else if (v !== null && typeof v === "object" && !Array.isArray(v)) {
            result[k] = scrubObject(v as Record<string, unknown>);
        } else {
            result[k] = v;
        }
    }
    return result;
}

/**
 * Strip sensitive query parameters from a URL string.
 * Returns the sanitised URL or the original if parsing fails.
 */
function scrubUrl(url: string | undefined): string | undefined {
    if (!url) return url;
    try {
        const parsed = new URL(url);
        const keysToDelete: string[] = [];
        parsed.searchParams.forEach((_v, key) => {
            if (SENSITIVE_KEY_RE.test(key)) keysToDelete.push(key);
        });
        keysToDelete.forEach((k) => {
            parsed.searchParams.set(k, "[Filtered]");
        });
        return parsed.toString();
    } catch {
        return url;
    }
}

/**
 * Scrub a breadcrumb's data.url field.
 */
function scrubBreadcrumb(bc: Breadcrumb): Breadcrumb {
    if (bc.data?.url) {
        return {
            ...bc,
            data: { ...bc.data, url: scrubUrl(bc.data.url as string) },
        };
    }
    return bc;
}

/**
 * Main Sentry beforeSend scrubber. Apply to both client and server configs.
 *
 * Drops events from webhook endpoints entirely (no business value in logging
 * them, and they may contain payment-provider signatures).
 */
export function scrubEvent(event: Event): Event | null {
    // Drop webhook events entirely
    const requestUrl = event.request?.url ?? "";
    if (requestUrl.includes("/api/webhooks/")) return null;

    // Build a clean copy — Sentry events are plain objects so spread is safe
    const clean: Event = { ...event };

    // ── Request ──────────────────────────────────────────────────────────────
    if (clean.request) {
        clean.request = {
            ...clean.request,
            // Strip raw cookie header — may contain session tokens
            cookies: undefined,
            // Strip all request headers — may contain Authorization, Cookie etc.
            headers: undefined,
            url: scrubUrl(clean.request.url),
        };
    }

    // ── User ─────────────────────────────────────────────────────────────────
    if (clean.user) {
        clean.user = {
            ...clean.user,
            email: undefined,
            ip_address: undefined,
        };
    }

    // ── Extra / Contexts ─────────────────────────────────────────────────────
    if (clean.extra && typeof clean.extra === "object") {
        clean.extra = scrubObject(clean.extra as Record<string, unknown>);
    }
    if (clean.contexts && typeof clean.contexts === "object") {
        const scrubbed: Record<string, unknown> = {};
        for (const [ctx, val] of Object.entries(clean.contexts)) {
            scrubbed[ctx] =
                val !== null && typeof val === "object" && !Array.isArray(val)
                    ? scrubObject(val as Record<string, unknown>)
                    : val;
        }
        clean.contexts = scrubbed as Event["contexts"];
    }

    // ── Breadcrumbs ──────────────────────────────────────────────────────────
    if (clean.breadcrumbs && Array.isArray(clean.breadcrumbs)) {
        clean.breadcrumbs = clean.breadcrumbs.map(scrubBreadcrumb);
    }

    return clean;
}
