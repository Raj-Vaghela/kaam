/**
 * Next.js 16 Proxy (middleware replacement).
 *
 * Routing decision tree:
 *
 *   Request
 *    ├─ Admin subdomain (ops.gajjuexpress.co.uk) OR /admin/* in dev
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
 * The matcher excludes _next assets and the Stripe webhook to keep cold-start
 * latency off static files and signature-verified ingress.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { safeRedirect } from "@/lib/security/redirect";

export async function proxy(request: NextRequest) {
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

    const pathname = request.nextUrl.pathname;
    const hostname = request.headers.get("host") || "";

    // ── Admin routing ─────────────────────────────────────────────────────────
    // Production: only ops.gajjuexpress.co.uk can reach admin routes.
    // Development: /admin/* paths on localhost are treated as the admin subdomain.
    const isDev = process.env.NODE_ENV === "development";
    const isAdminSubdomain =
        hostname.startsWith("ops.") ||
        (isDev && pathname.startsWith("/admin"));

    if (isAdminSubdomain) {
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
                    return NextResponse.redirect(url);
                }
                // Non-admin user — send to retail without revealing admin exists
                return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
            }
            // Unauthenticated — show the login form
            return supabaseResponse;
        }

        // All other admin routes require an authenticated admin/staff session
        if (!user) {
            const url = request.nextUrl.clone();
            url.pathname = "/admin/auth";
            return NextResponse.redirect(url);
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "admin" && profile?.role !== "staff") {
            // Silently redirect to retail — no indication admin panel exists
            return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
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
    if (!isDev && pathname.startsWith("/admin")) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
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
