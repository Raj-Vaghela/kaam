# GajjuExpress

GajjuExpress is a UK-based e-commerce store built for selling South Asian grocery and household products. It is a full-stack Next.js application with server-side rendering, Supabase for database and authentication, Stripe for payments, Resend for transactional email, Sendcloud for shipping label generation via EVRI, and Sentry for error monitoring.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 / React 19 / TypeScript |
| Database & Auth | Supabase (Postgres + RLS + Auth) |
| Payments | Stripe |
| Email | Resend |
| Shipping | Sendcloud (EVRI Tracked) |
| Error monitoring | Sentry |
| Analytics | Vercel Analytics |
| Hosting | Vercel |

---

## Local setup

```bash
git clone <repo-url>
cd kaam
cp .env.local.example .env.local
# Fill in all values in .env.local (see file for guidance)
npm install
supabase start        # starts local Postgres + Auth via Docker
npm run dev           # http://localhost:3000
```

All required environment variables are documented in `.env.local.example`. At startup `src/lib/env.ts` validates required vars and will throw early if any are missing, preventing silent misconfiguration.

---

## Running tests

```bash
npm test                   # unit tests (Vitest)
npm run test:coverage      # unit tests with coverage report
npm run test:e2e           # Playwright E2E (starts server automatically)
npm run test:e2e:headed    # E2E with visible browser (useful for debugging)
```

E2E tests require a running Supabase instance and the env vars listed in `.env.local`. For CI, the tests run against staging secrets stored in GitHub Actions secrets.

---

## Database migrations

All schema changes live in `supabase/migrations/`. Migration files are named `YYYYMMDDHHmmss_description.sql`.

```bash
# Apply to local Supabase
supabase db push

# Apply to linked remote project (requires supabase link first)
supabase db push --linked
```

Never hand-edit the remote database outside of tracked migrations. Use `supabase migration new <name>` to create a new migration file.

---

## Deployment

The project deploys automatically to Vercel on every push to `main`.

**Environment variables** are configured in the Vercel dashboard under Project → Settings → Environment Variables. Copy all keys from `.env.local.example` and provide production values.

**Boot-time validation:** `src/lib/env.ts` runs assertions at module-import time in `NODE_ENV=production`. A deployment with missing legal, payment, or monitoring vars will fail to start rather than serving a broken page. Variables validated in production:

- `COMPANY_NUMBER`, `RESEND_DOMAIN`, `REGISTERED_ADDRESS_*` (UK legal compliance)
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (rate limiting — required on multi-instance Vercel)
- `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` (error monitoring)

---

## Secret rotation

See `docs/runbooks/secret-rotation.md` for per-service rotation procedures, the staged rotation pattern, and verification steps.

Rotate secrets at least every 90 days or immediately on suspicion of compromise.

---

## Admin onboarding

To grant a user the `admin` role:

1. Use the `admin_set_user_role` SECURITY DEFINER RPC via the Supabase Studio SQL editor, or call it from a trusted admin context.
2. The user must have MFA enabled before being granted admin access.

Admin actions are recorded in the `audit_logs` table via `src/lib/audit.ts`.

---

## Observability

- **Sentry** — error tracking. Organisation and project are configured via `SENTRY_DSN`. View the Sentry dashboard for error rates and performance traces. Triage alerts by checking the breadcrumb trail and the associated Supabase request logs.
- **Vercel Analytics** — page views and Web Vitals are collected automatically. View under the Vercel project dashboard → Analytics.
- **Supabase logs** — database slow queries and auth events are visible in the Supabase dashboard → Logs.

---

## Incident response

See `docs/runbooks/incident-response.md` for the full triage flow, severity definitions, and per-service runbooks.

Quick reference:
- **SEV1 (site down / payment broken):** rollback deploy → check Sentry error rate → check Stripe dashboard for declines.
- **SEV2 (feature broken for many users):** identify via Sentry, patch forward.
- **SEV3 (minor / single user):** create issue, fix in next sprint.

---

## Legal

- Privacy policy: `/privacy`
- Terms of service: `/terms`
- Returns and refunds: `/returns`

UK legal compliance (CA 2006 s.82, E-commerce Regulations 2002) requires `COMPANY_NUMBER`, `REGISTERED_ADDRESS_*`, and `VAT_NUMBER` (if VAT-registered) to be set before going live.
