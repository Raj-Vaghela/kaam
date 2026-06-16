import * as Sentry from "@sentry/nextjs";
import type { ErrorEvent, EventHint } from "@sentry/nextjs";
import { scrubEvent } from "@/lib/sentry/scrub";

// ---------------------------------------------------------------------------
// Consent check — read synchronously from localStorage or the gx_consent_v1
// cookie before initialising. Sentry must not run without explicit consent.
// ---------------------------------------------------------------------------

function readErrorTrackingConsent(): boolean {
    // 1. Try localStorage (most reliable on client)
    try {
        const raw = localStorage.getItem("gx_consent_v1");
        if (raw) {
            const parsed = JSON.parse(raw) as {
                consent?: { errorTracking?: boolean };
                hasDecided?: boolean;
            };
            if (parsed?.hasDecided && parsed?.consent?.errorTracking === true) {
                return true;
            }
        }
    } catch {
        // localStorage unavailable
    }

    // 2. Fallback: read from document.cookie
    try {
        const match = document.cookie
            .split(";")
            .map((c) => c.trim())
            .find((c) => c.startsWith("gx_consent_v1="));
        if (match) {
            const value = decodeURIComponent(match.split("=").slice(1).join("="));
            const parsed = JSON.parse(value) as {
                consent?: { errorTracking?: boolean };
                hasDecided?: boolean;
            };
            if (parsed?.hasDecided && parsed?.consent?.errorTracking === true) {
                return true;
            }
        }
    } catch {
        // cookie unavailable or parse error
    }

    return false;
}

const errorTrackingConsented = readErrorTrackingConsent();

if (!errorTrackingConsented) {
    // Initialise with disabled: true so the SDK is present but silent.
    // This ensures Sentry.close() below works if consent is granted later
    // without a full page reload.
    Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        enabled: false,
    });
} else {
    Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

        // Enable on production and Vercel preview/staging deployments
        enabled:
            process.env.NODE_ENV === "production" ||
            process.env.NEXT_PUBLIC_VERCEL_ENV !== undefined,

        environment:
            process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,

        release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

        tracesSampleRate: 0.1,

        // Privacy: do NOT include PII fields automatically (IP, user agent, etc.)
        sendDefaultPii: false,

        // Session Replay: disabled by default for raw sessions.
        // Error replays are enabled but with full masking — all text and inputs
        // are hidden before data leaves the browser. This provides useful
        // reproduction context while ensuring no personal data is uploaded.
        // Trade-off: masked replays are less readable but GDPR-safe.
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 1.0,
        integrations: [
            Sentry.replayIntegration({
                maskAllText: true,
                maskAllInputs: true,
                blockAllMedia: true,
            }),
        ],

        beforeSend(event: ErrorEvent, _hint: EventHint): ErrorEvent | null {
            // scrubEvent accepts the broader Sentry Event type; cast is safe
            // because ErrorEvent is a subtype and we only remove/null fields.
            return scrubEvent(event) as ErrorEvent | null;
        },
    });
}

// ---------------------------------------------------------------------------
// Runtime consent revocation
// If the user later revokes error-tracking consent (e.g. via the banner),
// we listen for a custom event dispatched by ConsentContext and close Sentry.
// A full shutdown requires a page reload to re-enable; that is intentional.
// ---------------------------------------------------------------------------

if (typeof window !== "undefined") {
    window.addEventListener("gx:consent:revoke-error-tracking", () => {
        Sentry.close(2000).catch(() => {/* ignore */});
    });
}
