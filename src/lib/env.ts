// Runtime environment validation — crash early if required vars are missing.
//
// IMPORTANT: env reads must use STATIC dot-access (e.g. process.env.NEXT_PUBLIC_X),
// not dynamic bracket access. Next.js / webpack only inlines NEXT_PUBLIC_* vars
// into the browser bundle when they're statically referenced. Dynamic access via
// a helper like process.env[name] is left as a runtime read, which in the browser
// resolves to undefined and would throw at module load.

const isServer = typeof window === "undefined";

function required(name: string, value: string | undefined): string {
    if (!value) {
        throw new Error(
            `Missing required environment variable: ${name}. Check your .env.local file.`
        );
    }
    return value;
}

// For secrets that must never reach the browser. If env.ts is transitively
// imported from a client component, this returns "" on the client (no throw)
// so the module can load; consumers are server-only and get the real value
// in Node where process.env is fully populated.
function serverRequired(name: string, value: string | undefined): string {
    if (!isServer) return "";
    return required(name, value);
}

// Safe even when used dynamically — undefined on client just returns the fallback.
function optional(name: string, fallback?: string): string | undefined {
    const value = process.env[name];
    return value || fallback;
}

function optionalWithDefault(name: string, fallback: string): string {
    return process.env[name] || fallback;
}

// Public (exposed to browser) — static reads so webpack DefinePlugin inlines them.
export const NEXT_PUBLIC_SUPABASE_URL = required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
export const NEXT_PUBLIC_SUPABASE_ANON_KEY = required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = required("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
export const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Server-only secrets — guarded so transitive client imports don't crash.
export const SUPABASE_SERVICE_ROLE_KEY = serverRequired("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
export const STRIPE_SECRET_KEY = serverRequired("STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY);
export const STRIPE_WEBHOOK_SECRET = serverRequired("STRIPE_WEBHOOK_SECRET", process.env.STRIPE_WEBHOOK_SECRET);
export const RESEND_API_KEY = serverRequired("RESEND_API_KEY", process.env.RESEND_API_KEY);
export const RESEND_DOMAIN = process.env.RESEND_DOMAIN || "resend.dev";

// Upstash Redis (rate limiting)
export const UPSTASH_REDIS_REST_URL = optional("UPSTASH_REDIS_REST_URL");
export const UPSTASH_REDIS_REST_TOKEN = optional("UPSTASH_REDIS_REST_TOKEN");

// Sentry error monitoring
// owned by error-monitoring agent for DSN wiring; validated in production below
export const SENTRY_DSN = optional("SENTRY_DSN");
export const NEXT_PUBLIC_SENTRY_DSN = optional("NEXT_PUBLIC_SENTRY_DSN");

// Vercel deployment environment — informational, not required
export const VERCEL_ENV = optional("VERCEL_ENV"); // "production" | "preview" | "development" | undefined

// Legal / company registration (CA 2006 s.82 + E-commerce Regs)
export const COMPANY_NUMBER = optional("COMPANY_NUMBER");
export const VAT_NUMBER = optional("VAT_NUMBER");
export const VAT_REGISTERED = optionalWithDefault("VAT_REGISTERED", "false");
export const SUPPORT_PHONE = optional("SUPPORT_PHONE");
export const SUPPORT_WHATSAPP_URL = optional("SUPPORT_WHATSAPP_URL"); // e.g. https://wa.me/447xxxxxxxxx
export const SUPPORT_WHATSAPP_DISPLAY = optional("SUPPORT_WHATSAPP_DISPLAY"); // e.g. +44 7xxx xxxxxx

// Registered address (E-commerce Regs reg. 6)
export const REGISTERED_ADDRESS_LINE1 = optional("REGISTERED_ADDRESS_LINE1");
export const REGISTERED_ADDRESS_LINE2 = optional("REGISTERED_ADDRESS_LINE2");
export const REGISTERED_ADDRESS_CITY = optional("REGISTERED_ADDRESS_CITY");
export const REGISTERED_ADDRESS_POSTCODE = optional("REGISTERED_ADDRESS_POSTCODE");
export const REGISTERED_ADDRESS_COUNTRY = optionalWithDefault("REGISTERED_ADDRESS_COUNTRY", "GB");

// ─── Production assertions ────────────────────────────────────────────────────
// These run at module-import time so a misconfigured deployment crashes loudly
// rather than serving legally incomplete pages.

if (process.env.NODE_ENV === "production" && typeof window === "undefined") {
    const prodRequired = [
        "COMPANY_NUMBER",
        "RESEND_DOMAIN",
        "REGISTERED_ADDRESS_LINE1",
        "REGISTERED_ADDRESS_CITY",
        "REGISTERED_ADDRESS_POSTCODE",
        // Rate limiting — in-memory fallback is useless on Vercel multi-instance.
        "UPSTASH_REDIS_REST_URL",
        "UPSTASH_REDIS_REST_TOKEN",
        // Error monitoring — must be configured before going live.
        "SENTRY_DSN",
        "NEXT_PUBLIC_SENTRY_DSN",
    ] as const;

    for (const key of prodRequired) {
        if (!process.env[key]) {
            throw new Error(
                `[env] Production requires ${key} to be set. ` +
                `This value is required for UK legal compliance (CA 2006 s.82 / E-commerce Regs).`
            );
        }
    }

    // VAT number format check: GB followed by 9 or 12 digits (HMRC formats)
    if (process.env.VAT_REGISTERED === "true") {
        const vat = process.env.VAT_NUMBER;
        if (!vat || !/^GB\d{9}(\d{3})?$/.test(vat)) {
            throw new Error(
                `[env] VAT_REGISTERED is 'true' but VAT_NUMBER is missing or invalid. ` +
                `Expected format: GB followed by 9 or 12 digits (e.g. GB123456789).`
            );
        }
    }

    if (process.env.RESEND_DOMAIN === "resend.dev") {
        throw new Error(
            `[env] RESEND_DOMAIN is set to 'resend.dev' in production. ` +
            `Set RESEND_DOMAIN to your verified sending domain (e.g. gajjuexpress.co.uk).`
        );
    }
}
