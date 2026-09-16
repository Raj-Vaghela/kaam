import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const isDev = process.env.NODE_ENV !== "production";

const scriptSrc = [
    "script-src",
    "'self'",
    "'unsafe-inline'",
    // Next.js dev-mode React Refresh compiles modules via eval(); needed for HMR.
    // Stripped in production builds.
    isDev ? "'unsafe-eval'" : null,
    "https://js.stripe.com",
    "https://*.stripe.network",
    "https://maps.googleapis.com",
]
    .filter(Boolean)
    .join(" ");

const cspDirectives = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://*.supabase.co https://placehold.co https://*.stripe.com https://images.unsplash.com",
    // Stripe iframes (3DS, payment element)
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    // Clickjacking defence at CSP level (supplements X-Frame-Options)
    "frame-ancestors 'none'",
    // Sentry tunnel route proxies to *.ingest.sentry.io and *.ingest.us.sentry.io
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.stripe.com https://o4504266765647872.ingest.sentry.io https://*.ingest.sentry.io https://*.ingest.us.sentry.io",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // Force all HTTP requests to HTTPS (defence-in-depth alongside HSTS)
    "upgrade-insecure-requests",
    // report-uri intentionally omitted until /api/csp-report exists.
];

const securityHeaders = [
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
        key: "Permissions-Policy",
        // Extended policy: block unused sensor/hardware APIs, limit payment to
        // Stripe, block FLoC/Topics (privacy-preserving ad targeting opt-out)
        value: [
            "camera=()",
            "microphone=()",
            "geolocation=()",
            "payment=(self \"https://js.stripe.com\")",
            "fullscreen=(self)",
            "usb=()",
            "interest-cohort=()",
            "browsing-topics=()",
        ].join(", "),
    },
    {
        // preload added so the site can be submitted to the HSTS preload list
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains; preload",
    },
    {
        key: "Content-Security-Policy",
        value: cspDirectives.join("; "),
    },
];

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "**.supabase.co" },
            { protocol: "https", hostname: "placehold.co" },
            { protocol: "https", hostname: "images.unsplash.com" },
        ],
    },
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: securityHeaders,
            },
        ];
    },
};

export default withSentryConfig(nextConfig, {
    silent: true,
    disableLogger: true,
    // deleteSourcemapsAfterUpload: source maps are uploaded to Sentry for
    // stack-trace de-obfuscation but then deleted from the deployment so they
    // are not shipped to clients (security hardening).
    sourcemaps: {
        deleteSourcemapsAfterUpload: true,
    },
    // /monitoring proxies Sentry ingestion through our own domain (CSP-friendly).
    // TODO: rate-limit this route at the edge/middleware layer to prevent abuse.
    tunnelRoute: "/monitoring",
});
