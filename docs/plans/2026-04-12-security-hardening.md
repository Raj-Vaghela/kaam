# Security Hardening & GDPR Compliance Plan

> **Date:** 2026-04-12
> **Status:** Draft
> **Scope:** Admin auth (separate subdomain login), middleware overhaul, security headers, open redirect fixes, admin API hardening, XSS in emails, invoice security, rate limiting, GDPR compliance, audit logging.

---

## Architecture Overview

```
                    ┌──────────────────────────────┐
                    │        Supabase Auth          │
                    │   (single user table)         │
                    │   profiles.role = admin|staff|customer │
                    └──────────┬───────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                                 │
   ┌──────────▼──────────┐         ┌───────────▼───────────┐
   │  gajjuexpress.co.uk │         │ ops.gajjuexpress.co.uk│
   │  (retail store)     │         │ (admin panel)         │
   │                     │         │                       │
   │  /auth — customer   │         │  /auth — admin only   │
   │  email+pass+Google  │         │  email+pass+MFA       │
   │  30 day session     │         │  4 hour session       │
   │                     │         │  no social auth       │
   │  /products          │         │  /dashboard           │
   │  /checkout          │         │  /products (CRUD)     │
   │  /account           │         │  /orders (manage)     │
   │                     │         │  /invoices            │
   │                     │         │  /audit-log           │
   └─────────────────────┘         └───────────────────────┘
```

**Cookie domain:** `.gajjuexpress.co.uk` (shared session across subdomains)

---

## File Map

### New files to create

| File | Purpose |
|------|---------|
| `src/lib/env.ts` | Runtime env validation — crash early if required vars missing |
| `src/lib/auth/admin.ts` | Admin auth helpers: `requireAdmin()`, `requireStaff()`, `isAdmin()` |
| `src/lib/auth/roles.ts` | Role types and permission matrix |
| `src/lib/security/headers.ts` | Security header constants (used in next.config.ts) |
| `src/lib/security/sanitize.ts` | HTML escape utility for email templates |
| `src/lib/security/redirect.ts` | Safe redirect validation utility |
| `src/lib/security/rate-limit.ts` | Rate limiting utilities |
| `src/app/admin/auth/page.tsx` | Separate admin login page (minimal, no branding) |
| `src/app/privacy/page.tsx` | Privacy policy page (GDPR) |
| `src/app/terms/page.tsx` | Terms of service page (GDPR) |
| `src/app/account/delete/page.tsx` | Account deletion page (GDPR right to erasure) |
| `src/app/account/export/route.ts` | Data export endpoint (GDPR data portability) |
| `src/components/gdpr/CookieConsent.tsx` | Cookie consent banner |

### Existing files to modify

| File | Changes |
|------|---------|
| `src/middleware.ts` | Subdomain routing, admin role gate, redirect validation, rate limiting |
| `src/app/actions.ts` | Admin auth check on `addProduct`, input validation |
| `src/app/api/admin/resend-invoice/route.ts` | Auth check, CSRF, rate limit |
| `src/app/api/webhooks/stripe/route.ts` | Signed URLs for invoices, idempotency |
| `src/app/auth/callback/route.ts` | Safe redirect validation |
| `src/app/auth/signout/route.ts` | Remove GET handler |
| `src/app/auth/page.tsx` | Generic error messages, stronger password hints |
| `src/app/admin/layout.tsx` | Server component with role gate |
| `src/app/admin/page.tsx` | Dynamic data from DB (not hardcoded) |
| `src/lib/email.ts` | HTML escape all dynamic values |
| `src/lib/invoice.ts` | Crypto-secure invoice numbers |
| `src/app/layout.tsx` | Add CookieConsent component |
| `next.config.ts` | Security headers |
| `.env.local` | Add missing vars |
| `src/types/index.ts` | Add Role type |

---

## Phase 1: Foundation (env, roles, utilities)

These are the building blocks everything else depends on.

### Task 1.1 — Create env validation module
**File:** `src/lib/env.ts`
**What:** Export a validated env object that throws at import time if required vars are missing. Cover: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL`.
**Why:** Multiple files use `process.env.X!` which silently passes `undefined` at runtime. This catches misconfig on startup.
**Acceptance:** Importing the module with a missing var throws a descriptive error.

### Task 1.2 — Create role types and permission matrix
**File:** `src/lib/auth/roles.ts`
**What:** Export `type Role = 'admin' | 'staff' | 'customer'`. Export a `PERMISSIONS` object mapping role to allowed actions: `{ admin: ['products:write', 'orders:manage', 'invoices:read', 'invoices:resend', 'settings:write'], staff: ['orders:manage'], customer: [] }`. Export a `hasPermission(role, action)` helper.
**Why:** Centralizes authorization logic. Every guard checks this instead of hardcoding role names.
**Acceptance:** `hasPermission('admin', 'products:write')` returns true, `hasPermission('customer', 'products:write')` returns false.

### Task 1.3 — Create admin auth helpers
**File:** `src/lib/auth/admin.ts`
**What:** `requireAdmin()` — server-side function that gets the Supabase user, fetches `profiles.role`, throws redirect to retail store if not admin. `requireStaff()` — same but allows staff or admin. `isAdmin(userId)` — returns boolean. All use the server Supabase client.
**Why:** Every admin page and action needs this check. DRY it once.
**Acceptance:** Calling `requireAdmin()` with no session redirects. Calling with a customer role redirects. Calling with admin role returns the user object.

### Task 1.4 — Create safe redirect utility
**File:** `src/lib/security/redirect.ts`
**What:** `safeRedirect(url: string, fallback: string = '/')` — validates that the URL is a relative path starting with `/` and not starting with `//`. Returns the URL if safe, fallback if not. No protocol-relative URLs, no absolute URLs.
**Why:** Fixes CRITICAL open redirect in auth callback and middleware.
**Acceptance:** `safeRedirect('/account')` returns '/account'. `safeRedirect('//evil.com')` returns '/'. `safeRedirect('https://evil.com')` returns '/'.

### Task 1.5 — Create HTML sanitize utility
**File:** `src/lib/security/sanitize.ts`
**What:** `escapeHtml(str: string)` — escapes `&`, `<`, `>`, `"`, `'` to their HTML entities.
**Why:** Fixes XSS in email templates where customer names and URLs are interpolated raw.
**Acceptance:** `escapeHtml('<script>alert(1)</script>')` returns `&lt;script&gt;alert(1)&lt;/script&gt;`.

### Task 1.6 — Add missing environment variables to .env.local
**File:** `.env.local`
**What:** Add placeholder entries for `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_DOMAIN`, `NEXT_PUBLIC_APP_URL`. Add comments marking which are required.
**Why:** The webhook and admin API routes crash without these.
**Acceptance:** All vars referenced in codebase have entries in .env.local.

---

## Phase 2: Admin Auth & Middleware Overhaul

The most critical phase — locks down the admin panel.

### Task 2.1 — Add role column to profiles (Supabase migration)
**What:** SQL to run in Supabase dashboard:
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'customer';
CREATE INDEX idx_profiles_role ON profiles(role);
-- Set yourself as admin:
UPDATE profiles SET role = 'admin' WHERE email = '<your-email>';
```
**Why:** No role column = no authorization. Everything in Phase 2+ depends on this.
**Acceptance:** `SELECT role FROM profiles WHERE email = '<your-email>'` returns 'admin'.

### Task 2.2 — Rewrite middleware for subdomain routing
**File:** `src/middleware.ts`
**What:**
1. Detect if request is on admin subdomain (`ops.` prefix or `localhost:3001` for dev)
2. For admin subdomain: check session exists + role is admin/staff. If not, redirect to admin auth page on same subdomain. If no session at all, redirect to `ops.gajjuexpress.co.uk/auth`.
3. For retail domain: keep existing logic (protect `/account` only)
4. Use `safeRedirect()` for all redirect params
5. Remove the unvalidated `redirect` param usage
6. Exclude `/api/webhooks/*` from middleware (webhooks don't need session checks)
**Why:** Currently the entire admin is unprotected. This is the single most critical fix.
**Acceptance:** Unauthenticated request to `/admin` on admin subdomain → redirect to admin auth. Customer role on admin subdomain → redirect to retail store. Admin role → passes through.

### Task 2.3 — Create admin login page
**File:** `src/app/admin/auth/page.tsx`
**What:** Minimal login form. Email + password only. No Google OAuth. No sign-up option. No branding that says "admin" — just a clean login box. On success, check role — if not admin/staff, redirect to retail store with no error message. If admin, redirect to `/admin`. Generic error messages only ("Invalid credentials" for all failures).
**Why:** Separate login allows different security policies. No social auth reduces attack surface.
**Acceptance:** Admin can log in and reach dashboard. Customer credentials log in but redirect to retail. No indication this is an admin page to unauthorized users.

### Task 2.4 — Convert admin layout to server component with role gate
**File:** `src/app/admin/layout.tsx`
**What:** Convert from `"use client"` to server component. Call `requireAdmin()` at the top. If not admin, it redirects (handled by the helper). Keep the sidebar nav but make the sign-out button a form POST to `/auth/signout` instead of client-side.
**Why:** Client components can't enforce server-side auth. The current layout has zero protection.
**Acceptance:** Direct URL access to any `/admin/*` route by a non-admin user results in redirect.

### Task 2.5 — Add auth + role check to addProduct server action
**File:** `src/app/actions.ts`
**What:** At the top of `addProduct()`, call `requireAdmin()`. If the user is not admin, return `{ success: false, message: 'Unauthorized' }`.
**Why:** Currently anyone can call this server action and insert products.
**Acceptance:** Unauthenticated call returns unauthorized. Customer call returns unauthorized. Admin call succeeds.

### Task 2.6 — Add auth + role check to resend-invoice API route
**File:** `src/app/api/admin/resend-invoice/route.ts`
**What:** At the top of the POST handler, verify the user session and admin role using the server Supabase client (not service role). Return 401 if unauthorized. Keep the service role client only for the DB query after auth passes.
**Why:** Currently anyone on the internet can trigger email sends via this endpoint.
**Acceptance:** Unauthenticated POST returns 401. Customer POST returns 403. Admin POST works.

### Task 2.7 — Remove GET handler from signout route
**File:** `src/app/auth/signout/route.ts`
**What:** Delete the entire `export async function GET()` handler. Keep only POST.
**Why:** GET signout allows CSRF logout via `<img src="/auth/signout">`.
**Acceptance:** GET /auth/signout returns 405. POST /auth/signout works.

### Task 2.8 — Fix open redirect in auth callback
**File:** `src/app/auth/callback/route.ts`
**What:** Replace `const next = searchParams.get("next") ?? "/"` with `const next = safeRedirect(searchParams.get("next") || "/")`.
**Why:** Currently `?next=//evil.com` redirects to evil.com.
**Acceptance:** `?next=//evil.com` redirects to `/`. `?next=/account` redirects to `/account`.

### Task 2.9 — Fix auth page error message leakage
**File:** `src/app/auth/page.tsx`
**What:** Replace `setError(err.message)` with a generic message: `setError("Invalid email or password. Please try again.")` for login. For signup, keep specific messages for "already registered" but phrase as "An account with this email may already exist. Try signing in."
**Why:** Supabase error messages reveal whether an email exists in the system.
**Acceptance:** Wrong password shows generic error. Non-existent email shows same generic error.

---

## Phase 3: Security Headers & Hardening

### Task 3.1 — Add security headers to next.config.ts
**File:** `next.config.ts`
**What:** Add `headers()` returning: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`, basic `Content-Security-Policy` allowing Stripe, Supabase, and self.
**Why:** Currently zero security headers. Site is frameable, sniffable, and leaks referrers.
**Acceptance:** Response headers include all listed headers. Stripe checkout still works (CSP allows it).

### Task 3.2 — HTML-escape all email template variables
**File:** `src/lib/email.ts`
**What:** Import `escapeHtml`. Wrap every interpolated variable in `escapeHtml()`: `customerName`, `orderId`, `orderTotal`, `trackingUrl`, `createAccountUrl`, `invoicePdfUrl`. For URLs in `href` attributes, also validate they start with `https://` or `/`.
**Why:** Stored XSS via customer name or manipulated URLs.
**Acceptance:** Customer name `<script>alert(1)</script>` renders as escaped text in email HTML.

### Task 3.3 — Make invoice numbers collision-proof
**File:** `src/lib/invoice.ts`
**What:** Replace `Math.random()` with `crypto.randomUUID().slice(0, 8)` for the random portion. Format: `GJX-YYYYMM-<8-char-hex>`. Also add a unique constraint on `invoices.invoice_number` in Supabase.
**SQL:** `ALTER TABLE invoices ADD CONSTRAINT invoices_invoice_number_unique UNIQUE (invoice_number);`
**Why:** `Math.random()` is not crypto-secure and 5-digit space risks collisions.
**Acceptance:** Generated invoice numbers use crypto-random values. DB rejects duplicate invoice numbers.

### Task 3.4 — Switch invoice PDFs to signed URLs
**File:** `src/app/api/webhooks/stripe/route.ts`
**What:** Replace `getPublicUrl()` with `createSignedUrl()` with 7-day expiry. Store the path (not the signed URL) in the `invoices.pdf_url` column. When displaying invoices, generate a fresh signed URL.
**Also update:** `src/app/admin/invoices/page.tsx` and `src/app/orders/[token]/page.tsx` to generate signed URLs at render time.
**Why:** Public URLs mean anyone who guesses the invoice number pattern can download customer PII.
**Acceptance:** Direct access to the old public URL returns 403. Invoice download links work with signed URLs.

### Task 3.5 — Add idempotency to webhook invoice creation
**File:** `src/app/api/webhooks/stripe/route.ts`
**What:** Add `ON CONFLICT (order_id) DO NOTHING` to the invoice insert (requires unique constraint on `invoices.order_id`). Check the insert result — if no row returned, the invoice already exists.
**SQL:** `ALTER TABLE invoices ADD CONSTRAINT invoices_order_id_unique UNIQUE (order_id);`
**Why:** Concurrent webhook deliveries can create duplicate invoices.
**Acceptance:** Two identical webhook calls create only one invoice.

### Task 3.6 — Use env module across all files
**What:** Replace all `process.env.X!` usages with imports from `src/lib/env.ts`. Touch: `middleware.ts`, `actions.ts`, `webhooks/stripe/route.ts`, `resend-invoice/route.ts`, `email.ts`, `supabase/server.ts`, `supabase/client.ts`, `stripe-client.ts`.
**Why:** Centralizes env access, ensures validation runs, removes non-null assertions on potentially undefined values.
**Acceptance:** Grep for `process.env.*!` returns zero results outside of `env.ts`.

---

## Phase 4: Rate Limiting

### Task 4.1 — Create rate limiting module
**File:** `src/lib/security/rate-limit.ts`
**What:** In-memory rate limiter using a Map with sliding window. Export `rateLimit(key: string, limit: number, windowMs: number): { allowed: boolean, remaining: number }`. In production, this should use Vercel KV or Upstash Redis — but in-memory works for single-instance deploys.
**Why:** No rate limiting anywhere means brute force, order spam, and email spam are all possible.
**Acceptance:** 4th call within a 3-call limit returns `{ allowed: false }`.

### Task 4.2 — Add rate limiting to admin login
**File:** `src/app/admin/auth/page.tsx` (or via middleware)
**What:** Rate limit by IP: 5 attempts per 15 minutes. After lockout, return generic "Too many attempts. Try again later."
**Why:** Admin login is the highest-value target for brute force.
**Acceptance:** 6th login attempt within 15 min returns rate limit error.

### Task 4.3 — Add rate limiting to retail login
**File:** `src/middleware.ts` or `src/app/auth/page.tsx`
**What:** Rate limit by IP: 10 attempts per 15 minutes. More lenient than admin.
**Why:** Prevents credential stuffing on customer accounts.
**Acceptance:** 11th login attempt within 15 min returns rate limit error.

### Task 4.4 — Add rate limiting to createPaymentIntent
**File:** `src/app/actions.ts`
**What:** Rate limit by IP or email: 5 payment intents per 10 minutes.
**Why:** Attacker could create thousands of pending orders, polluting the DB and potentially costing Stripe fees.
**Acceptance:** 6th payment intent creation within 10 min returns error.

### Task 4.5 — Add rate limiting to resend-invoice
**File:** `src/app/api/admin/resend-invoice/route.ts`
**What:** Rate limit by invoice ID: 3 resends per hour.
**Why:** Even authenticated admins shouldn't accidentally spam customers.
**Acceptance:** 4th resend of same invoice within an hour returns rate limit error.

---

## Phase 5: GDPR Compliance

### Task 5.1 — Create privacy policy page
**File:** `src/app/privacy/page.tsx`
**What:** Static page covering: what data is collected (name, email, address, order history, payment info via Stripe), why (contract fulfilment, legitimate interest), who processes it (Stripe, Supabase, Resend), retention periods (orders: 6 years for tax, accounts: until deletion requested, guest data: 2 years), user rights (access, rectification, erasure, portability, objection), contact details, complaint process (ICO for UK).
**Why:** GDPR Article 13/14 — must inform users. Currently the link exists but page doesn't.
**Acceptance:** `/privacy` renders a complete privacy policy. All links to `/privacy` work.

### Task 5.2 — Create terms of service page
**File:** `src/app/terms/page.tsx`
**What:** Static page covering: who operates the store (GajjuExpress Ltd), what the service is, ordering process, pricing (inc. VAT), delivery, returns, liability limitations, governing law (England & Wales).
**Why:** Link exists in checkout footer but page doesn't. Legal requirement for e-commerce.
**Acceptance:** `/terms` renders. All links to `/terms` work.

### Task 5.3 — Create cookie consent banner
**File:** `src/components/gdpr/CookieConsent.tsx`
**What:** Client component. Shows a bottom banner on first visit: "We use essential cookies to keep you signed in and process orders. [Accept] [Privacy Policy]". Store consent in localStorage (`cookie-consent-accepted`). Only show if not yet accepted. No tracking cookies exist currently, so this is informational for essential cookies only.
**Add to:** `src/app/layout.tsx` — render `<CookieConsent />` inside the body.
**Why:** GDPR + PECR require informing users about cookies, even essential ones.
**Acceptance:** First visit shows banner. Clicking accept hides it permanently. Subsequent visits don't show it.

### Task 5.4 — Remove unsolicited marketing email
**File:** `src/app/api/webhooks/stripe/route.ts`
**What:** Remove the automatic `sendAccountCreationInvite()` call. Instead, show the account creation CTA only on the order confirmation page (which already exists). The email should only be sent if the user explicitly opts in.
**Why:** Sending "create your account" emails to guest checkout users without consent violates GDPR Article 6 and UK PECR.
**Acceptance:** Guest checkout no longer triggers account creation email. Order confirmation page still shows create-account CTA.

### Task 5.5 — Add account deletion feature
**File:** `src/app/account/delete/page.tsx`
**What:** Page with clear warning: "This will permanently delete your account and anonymize your order history. This cannot be undone." Requires password confirmation. On confirm: anonymize orders (set `user_id = null`, `guest_email = null`, keep order for tax records but strip PII from `shipping_address` and `billing_address`). Delete the profile row. Delete the Supabase auth user (via service role admin API). Sign out.
**Add link:** to account page sidebar nav.
**Why:** GDPR Article 17 — right to erasure. Users must be able to delete their data.
**Acceptance:** User can delete account. Orders are anonymized (no PII). Auth user is removed. User is signed out.

### Task 5.6 — Add data export feature
**File:** `src/app/account/export/route.ts`
**What:** GET endpoint (auth required). Fetches user's profile, all orders with items, and returns as a JSON download. Headers: `Content-Disposition: attachment; filename="my-data.json"`, `Content-Type: application/json`.
**Add link:** to account page ("Download my data").
**Why:** GDPR Article 20 — right to data portability.
**Acceptance:** Authenticated user can download a JSON file with all their data. Unauthenticated request returns 401.

### Task 5.7 — Add consent tracking to checkout
**File:** `src/app/checkout/page.tsx` and `src/components/checkout/CheckoutForm.tsx`
**What:** Add a required checkbox: "I agree to the Terms of Service and Privacy Policy". Store consent timestamp in the order record (`consent_given_at` column).
**SQL:** `ALTER TABLE orders ADD COLUMN consent_given_at timestamptz;`
**Why:** GDPR requires demonstrable consent. You need a record of when each user agreed.
**Acceptance:** Cannot proceed to payment without checking the box. Consent timestamp stored on order.

---

## Phase 6: Audit Logging

### Task 6.1 — Create audit_logs table
**SQL:**
```sql
CREATE TABLE audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    action text NOT NULL,
    resource_type text,
    resource_id text,
    metadata jsonb DEFAULT '{}',
    ip_address text,
    created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
```
**Why:** Admin actions need an audit trail. Who added a product? Who resent an invoice? When?
**Acceptance:** Table exists with correct schema and indexes.

### Task 6.2 — Create audit logging helper
**File:** `src/lib/audit.ts`
**What:** `logAdminAction(userId, action, resourceType, resourceId, metadata?)` — inserts into audit_logs using service role client.
**Why:** Centralized logging for all admin actions.
**Acceptance:** Calling the helper creates a row in audit_logs.

### Task 6.3 — Add audit logging to admin actions
**Files:** `src/app/actions.ts`, `src/app/api/admin/resend-invoice/route.ts`
**What:** After successful `addProduct`, log `{ action: 'product:create', resource_type: 'product' }`. After successful resend-invoice, log `{ action: 'invoice:resend', resource_type: 'invoice', resource_id: invoiceId }`.
**Why:** Traceability for all admin mutations.
**Acceptance:** Adding a product creates an audit log entry. Resending an invoice creates an audit log entry.

### Task 6.4 — Create audit log viewer page
**File:** `src/app/admin/audit-log/page.tsx`
**What:** Admin-only page showing recent audit log entries in a table: timestamp, user email, action, resource. Paginated, most recent first.
**Why:** Admins need to see who did what and when.
**Acceptance:** Page loads with audit entries. Only accessible to admin role.

---

## Phase 7: PII Cleanup & Hardening

### Task 7.1 — Remove PII from server logs
**Files:** All files using `console.error` / `console.log`
**What:** Replace customer email and address data in log statements with redacted versions. `console.error("Order creation error:", orderError)` is fine (no PII). But ensure no log statement includes customer emails, names, or addresses directly.
**Why:** PII in logs violates GDPR data minimization principle and creates breach risk.
**Acceptance:** Grep for `console.log` and `console.error` — none contain PII interpolation.

### Task 7.2 — Add Supabase RLS policies for admin role
**What:** Ensure RLS policies on `products`, `orders`, `order_items`, `invoices` tables:
- `products`: public read, admin-only write
- `orders`: users read own, admin read all
- `order_items`: users read own (via order), admin read all
- `invoices`: users read own (via order), admin read all
- `profiles`: users read/update own, admin read all
- `audit_logs`: admin read only
**Why:** Even with app-level auth, RLS is defense-in-depth. If a token leaks, RLS limits damage.
**Acceptance:** Customer with stolen admin app token but anon DB key cannot read other users' orders.

---

## Execution Order

```
Phase 1 (Foundation)     → No dependencies, do first
Phase 2 (Admin Auth)     → Depends on Phase 1
Phase 3 (Hardening)      → Depends on Phase 1
Phase 4 (Rate Limiting)  → Independent, can parallel with Phase 2/3
Phase 5 (GDPR)           → Independent, can parallel with Phase 2/3
Phase 6 (Audit Logging)  → Depends on Phase 2 (needs admin auth)
Phase 7 (PII/RLS)        → Do last, cleanup pass
```

**Phases 2+3+4+5 can be parallelized after Phase 1 is complete.**

---

## Summary

| Phase | Tasks | Severity Addressed |
|-------|-------|--------------------|
| 1 | 6 tasks | Foundation for all fixes |
| 2 | 9 tasks | CRITICAL-1, CRITICAL-2, CRITICAL-3, HIGH-1, HIGH-2 |
| 3 | 6 tasks | HIGH-3, HIGH-4, HIGH-5, MEDIUM-1, MEDIUM-2 |
| 4 | 5 tasks | HIGH-6 |
| 5 | 7 tasks | All GDPR gaps (G1-G10) |
| 6 | 4 tasks | Audit trail |
| 7 | 2 tasks | Defense-in-depth |
| **Total** | **39 tasks** | |
