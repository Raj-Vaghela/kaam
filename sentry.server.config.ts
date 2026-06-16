import * as Sentry from "@sentry/nextjs";
import type { ErrorEvent, EventHint } from "@sentry/nextjs";
import { scrubEvent } from "@/lib/sentry/scrub";

// Server-side Sentry: no consent gating because server errors occur during
// request processing that is not attributable to a specific browser session's
// consent state. The scrubber ensures no PII is transmitted regardless.

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

    // Privacy: do not attach user IP, email, or other PII automatically
    sendDefaultPii: false,

    beforeSend(event: ErrorEvent, _hint: EventHint): ErrorEvent | null {
        // scrubEvent accepts the broader Sentry Event type; cast is safe
        // because ErrorEvent is a subtype and we only remove/null fields.
        return scrubEvent(event) as ErrorEvent | null;
    },
});
