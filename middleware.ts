import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const COOKIE_NAME = "site-access";

const BYPASS_PREFIXES = [
  "/api/gate",
  "/api/webhooks",
  "/api/newsletter",
  "/auth/callback",
  "/auth/signout",
  "/unsubscribe",
  "/monitoring",
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

function hashToken(password: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < password.length; i++) {
    h ^= password.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

async function refreshSupabaseSession(request: NextRequest, response: NextResponse) {
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
            request.cookies.set(name, value),
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  await supabase.auth.getUser();
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (BYPASS_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (
    pathname.match(
      /\.(ico|png|jpg|jpeg|svg|webp|gif|css|js|map|woff2?|ttf|eot|xml|txt|json)$/,
    )
  ) {
    return NextResponse.next();
  }

  const password = process.env.SITE_PASSWORD;

  if (password) {
    const cookie = request.cookies.get(COOKIE_NAME);
    const expectedToken = hashToken(password);
    if (cookie?.value !== expectedToken) {
      const next = pathname + (request.nextUrl.search || "");
      const gateUrl = request.nextUrl.clone();
      gateUrl.pathname = "/api/gate";
      gateUrl.searchParams.set("next", next);
      return NextResponse.redirect(gateUrl);
    }
  }

  const response = NextResponse.next({ request });
  return refreshSupabaseSession(request, response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
