import { NextRequest, NextResponse } from "next/server";

function hashToken(password: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < password.length; i++) {
    h ^= password.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);

  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > MAX_ATTEMPTS;
}

function gatePageHtml(next: string, error?: string): Response {
  const errorBlock = error
    ? `<p style="color:#ef4444;font-size:.8125rem;margin:0 0 .75rem">${error}</p>`
    : "";
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="robots" content="noindex,nofollow"/>
  <title>Access Required</title>
</head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif">
  <div style="width:100%;max-width:400px;padding:2.5rem;background:#141414;border-radius:12px;border:1px solid #262626;box-sizing:border-box">
    <h1 style="font-size:1.25rem;font-weight:600;color:#fafafa;margin:0 0 .5rem;text-align:center">Site Under Testing</h1>
    <p style="font-size:.875rem;color:#737373;margin:0 0 1.5rem;text-align:center">Enter the access password to continue.</p>
    <form method="POST" action="/api/gate">
      <input type="hidden" name="next" value="${next}"/>
      <input type="password" name="password" placeholder="Password" autofocus required
        style="width:100%;padding:.75rem 1rem;font-size:.9375rem;background:#0a0a0a;border:1px solid #262626;border-radius:8px;color:#fafafa;outline:none;box-sizing:border-box;margin-bottom:.75rem"/>
      ${errorBlock}
      <button type="submit"
        style="width:100%;padding:.75rem;font-size:.9375rem;font-weight:600;background:#c8553d;color:#fff;border:none;border-radius:8px;cursor:pointer">
        Enter
      </button>
    </form>
  </div>
</body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next") || "/";
  return gatePageHtml(next);
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  const form = await request.formData();
  const password = form.get("password") as string;
  const next = (form.get("next") as string) || "/";

  const sitePassword = process.env.SITE_PASSWORD;

  if (isRateLimited(ip)) {
    return gatePageHtml(next, "Too many attempts. Try again later.");
  }

  if (!sitePassword || password !== sitePassword) {
    return gatePageHtml(next, "Incorrect password");
  }

  const token = hashToken(sitePassword);
  const res = NextResponse.redirect(new URL(next, request.url));
  res.cookies.set("site-access", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
