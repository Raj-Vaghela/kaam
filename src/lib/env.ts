// Runtime environment validation — crash early if required vars are missing.

function required(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(
            `Missing required environment variable: ${name}. Check your .env.local file.`
        );
    }
    return value;
}

function optional(name: string, fallback: string): string {
    return process.env[name] || fallback;
}

// Public (exposed to browser)
export const NEXT_PUBLIC_SUPABASE_URL = required("NEXT_PUBLIC_SUPABASE_URL");
export const NEXT_PUBLIC_SUPABASE_ANON_KEY = required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
export const NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = required("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
export const NEXT_PUBLIC_APP_URL = optional("NEXT_PUBLIC_APP_URL", "http://localhost:3000");

// Server-only
export const SUPABASE_SERVICE_ROLE_KEY = required("SUPABASE_SERVICE_ROLE_KEY");
export const STRIPE_SECRET_KEY = required("STRIPE_SECRET_KEY");
export const STRIPE_WEBHOOK_SECRET = required("STRIPE_WEBHOOK_SECRET");
export const RESEND_API_KEY = required("RESEND_API_KEY");
export const RESEND_DOMAIN = optional("RESEND_DOMAIN", "resend.dev");
