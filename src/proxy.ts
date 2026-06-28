/**
 * Next.js 16 Proxy (middleware replacement).
 *
 * Routing decision tree:
 *
 *   Request
 *    ├─ Site password gate (when SITE_PASSWORD is set) — blocks the whole site
 *    │   behind a password until launch. Bypassed for the gate route, auth
 *    │   callback, newsletter links, and static assets.
 *    ├─ Admin subdomain (ops.gajjuexpress.co.uk), /admin/* in dev, OR when
 *    │   ADMIN_ALLOW_MAIN_DOMAIN=true (testing on a preview domain)
 *    │   ├─ GET /admin/auth
 *    │   │   ├─ Logged-in admin/staff  → redirect to /admin
 *    │   │   ├─ Logged-in non-admin   → redirect to / (silently)
 *    │   │   └─ Unauthenticated       → allow (show login form)
 *    │   └─ Any other /admin/* route
 *    │       ├─ No session            → redirect to /admin/auth
 *    │       ├─ Non-admin role        → redirect to / (silently)
 *    │       └─ Admin/staff session   → allow
 *    └─ Retail domain (gajjuexpress.co.uk)
 *        ├─ /account/* (protected)
 *        │   └─ No session            → redirect to /auth?redirect=<path>
 *        ├─ /auth (when logged in)    → redirect to returnUrl or /
 *        └─ /admin/* in production    → redirect to / (blocks direct access)
 *
 * Session is refreshed on every request so expired tokens are rotated.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { safeRedirect } from "@/lib/security/redirect";

const GATE_COOKIE = "site-access";

// FNV-1a hash so the access cookie is tied to the current password — rotating
// SITE_PASSWORD invalidates every previously issued cookie.
function hashToken(password: string): string {
    let h = 0x811c9dc5;
    for (let i = 0; i < password.length; i++) {
        h ^= password.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(36);
}

const GATE_BYPASS = [
    "/api/gate",
    "/api/newsletter",
    "/auth/callback",
    "/auth/signout",
    "/unsubscribe",
    "/monitoring",
];

export async function proxy(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // ── Site password gate ──────────────────────────────────────────────────
    const sitePassword = process.env.SITE_PASSWORD;
    if (sitePassword) {
        const bypass =
            GATE_BYPASS.some((p) => pathname.startsWith(p)) ||
            /\.(ico|png|jpg|jpeg|svg|webp|gif|css|js|map|woff2?|ttf|eot|xml|txt|json)$/.test(
                pathname
            );

        if (!bypass) {
            const cookie = request.cookies.get(GATE_COOKIE);
            if (cookie?.value !== hashToken(sitePassword)) {
                const url = request.nextUrl.clone();
                url.pathname = "/api/gate";
                url.search = "";
                url.searchParams.set(
                    "next",
                    pathname + (request.nextUrl.search || "")
                );
                return NextResponse.redirect(url);
            }
        }
    }

    let supabaseResponse = NextResponse.next({ request });

    // Supabase SSR client — refreshes session cookies on every request
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh session if expired — must be called before reading user
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const hostname = request.headers.get("host") || "";

    // ── Admin routing ─────────────────────────────────────────────────────────
    // Production: only ops.gajjuexpress.co.uk can reach admin routes.
    // Development: /admin/* paths on localhost are treated as the admin subdomain.
    // Testing: set ADMIN_ALLOW_MAIN_DOMAIN=true to reach /admin on a preview
    // domain (e.g. *.vercel.app) before the ops. subdomain is configured.
    const isDev = process.env.NODE_ENV === "development";
    const allowAdminOnMainDomain =
        process.env.ADMIN_ALLOW_MAIN_DOMAIN === "true";
    const isAdminArea = pathname.startsWith("/admin");
    const isAdminSubdomain =
        hostname.startsWith("ops.") ||
        ((isDev || allowAdminOnMainDomain) && isAdminArea);

    // API routes run their own auth checks and must never be redirected by the
    // proxy — otherwise /api/gate (the password form) bounces to /admin/auth,
    // which bounces back to the gate → ERR_TOO_MANY_REDIRECTS on the ops host.
    const isApi = pathname.startsWith("/api");

    if (isAdminSubdomain && !isApi) {
        // Non-admins are sent to the RETAIL domain, not "/" on this host.
        // On the ops subdomain every non-/admin/auth path redirects, so a
        // same-host "/" redirect would loop forever (ERR_TOO_MANY_REDIRECTS).
        const retailHome = new URL(
            "/",
            process.env.NEXT_PUBLIC_APP_URL || "https://gajjuexpress.co.uk"
        );

        if (pathname === "/admin/auth") {
            if (user) {
                // Already authenticated — redirect based on role
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", user.id)
                    .single();

                if (profile?.role === "admin" || profile?.role === "staff") {
                    const url = request.nextUrl.clone();
                    url.pathname = "/admin";
                    url.search = "";
                    return NextResponse.redirect(url);
                }
                // Non-admin user — send to retail without revealing admin exists
                return NextResponse.redirect(retailHome);
            }
            // Unauthenticated — show the login form
            return supabaseResponse;
        }

        // All other admin routes require an authenticated admin/staff session
        if (!user) {
            const url = request.nextUrl.clone();
            url.pathname = "/admin/auth";
            url.search = "";
            return NextResponse.redirect(url);
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "admin" && profile?.role !== "staff") {
            // Silently redirect to retail — no indication admin panel exists
            return NextResponse.redirect(retailHome);
        }

        return supabaseResponse;
    }

    // ── Retail routing ────────────────────────────────────────────────────────

    // /account/* requires authentication
    const protectedPaths = ["/account"];
    const isProtectedRoute = protectedPaths.some((path) =>
        pathname.startsWith(path)
    );

    if (isProtectedRoute && !user) {
        const url = request.nextUrl.clone();
        url.pathname = "/auth";
        url.searchParams.set("redirect", pathname);
        return NextResponse.redirect(url);
    }

    // Authenticated users visiting /auth are redirected to their intended destination
    if (pathname === "/auth" && user) {
        const rawRedirect = request.nextUrl.searchParams.get("redirect") || "/";
        const redirect = safeRedirect(rawRedirect);
        const url = request.nextUrl.clone();
        url.pathname = redirect;
        url.searchParams.delete("redirect");
        return NextResponse.redirect(url);
    }

    // Block direct /admin/* access on the retail domain in production
    if (!isDev && !allowAdminOnMainDomain && isAdminArea) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        url.search = "";
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        // Exclude static assets, optimised images, favicon, and the Stripe webhook
        // (webhook needs raw body for signature verification — middleware must not touch it)
        "/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)",
    ],
};
