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
  // When the password was wrong, reveal the staff form so the error is visible.
  const formDisplay = error ? "block" : "none";
  const errorBlock = error
    ? `<p style="color:#ffb4a2;font-size:.8125rem;margin:0 0 .75rem">${error}</p>`
    : "";
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="robots" content="noindex,nofollow"/>
  <link rel="icon" href="/icon"/>
  <title>GajjuExpress — Coming Soon</title>
</head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#134048;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;padding:24px;box-sizing:border-box">
  <div style="width:100%;max-width:480px;text-align:center">
    <img src="/gajjuexpress-logo-h-white.png" alt="GajjuExpress" width="220" style="max-width:220px;height:auto;margin:0 auto 40px;display:block"/>
    <h1 style="font-size:2.5rem;font-weight:700;color:#f5f0e6;margin:0 0 16px;letter-spacing:-.5px">Coming Soon</h1>
    <p style="font-size:1.0625rem;line-height:1.6;color:#aec5c7;margin:0 0 8px">Authentic Indian groceries, delivered to your door.</p>
    <p style="font-size:1.0625rem;line-height:1.6;color:#aec5c7;margin:0 0 40px">We're putting the finishing touches on something special — launching very soon.</p>

    <button onclick="document.getElementById('staff-access').style.display='block';this.style.display='none';"
      style="background:none;border:none;color:#5f8487;font-size:.8125rem;cursor:pointer;text-decoration:underline;text-underline-offset:3px;padding:8px">
      Staff access
    </button>

    <div id="staff-access" style="display:${formDisplay};margin-top:20px">
      <form method="POST" action="/api/gate" style="max-width:320px;margin:0 auto">
        <input type="hidden" name="next" value="${next}"/>
        <input type="password" name="password" placeholder="Password" autofocus required
          style="width:100%;padding:.75rem 1rem;font-size:.9375rem;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.18);border-radius:8px;color:#f5f0e6;outline:none;box-sizing:border-box;margin-bottom:.75rem"/>
        ${errorBlock}
        <button type="submit"
          style="width:100%;padding:.75rem;font-size:.9375rem;font-weight:600;background:#c66b3d;color:#fff;border:none;border-radius:8px;cursor:pointer">
          Enter
        </button>
      </form>
    </div>
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
  // 303 forces the follow-up to be a GET — without it the browser replays the
  // POST against the destination page route (which only handles GET).
  const res = NextResponse.redirect(new URL(next, request.url), { status: 303 });
  res.cookies.set("site-access", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
