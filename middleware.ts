import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "site-access";

const BYPASS_PREFIXES = [
  "/gate",
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

export function middleware(request: NextRequest) {
  const password = process.env.SITE_PASSWORD;

  if (!password) return NextResponse.next();

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

  const cookie = request.cookies.get(COOKIE_NAME);
  const expectedToken = hashToken(password);
  if (cookie?.value === expectedToken) return NextResponse.next();

  const gateUrl = request.nextUrl.clone();
  gateUrl.pathname = "/gate";
  gateUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(gateUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
