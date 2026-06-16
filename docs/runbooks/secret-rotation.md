# Secret Rotation Runbook

## Why and When to Rotate

Rotate secrets when:
- A secret is suspected to be compromised (immediate, unplanned rotation).
- An employee or contractor with access departs.
- Scheduled rotation cycle — every 90 days for all secrets.
- A third-party breach notification is received.

Never delay rotation if compromise is suspected. Assume breach until proven otherwise.

---

## Staged Rotation Pattern

Use this pattern for all rotations to avoid downtime:

1. **Generate** the new secret in the service dashboard.
2. **Set** the new secret alongside the old one (configure your app to accept both temporarily, or use Vercel's "add new variable + keep old" approach with preview environments first).
3. **Deploy** the updated configuration.
4. **Verify** the new secret works end-to-end (see per-service verification below).
5. **Delete** the old secret from the service dashboard and from Vercel env.
6. **Deploy** again to confirm the old secret is no longer present.

---

## Per-Service Rotation Procedures

### Stripe Secret Key (`STRIPE_SECRET_KEY`)

1. Log in to https://dashboard.stripe.com → Developers → API keys.
2. Click **Create restricted key** or roll the standard secret key.
3. Update `STRIPE_SECRET_KEY` in Vercel dashboard → Environment Variables.
4. Redeploy.
5. Verify: place a test order through the checkout flow (test mode) and confirm payment succeeds.
6. Delete the old key from Stripe.

### Stripe Webhook Secret (`STRIPE_WEBHOOK_SECRET`)

1. Go to Stripe Dashboard → Developers → Webhooks → select the production endpoint.
2. Click **Roll secret** (or delete and recreate the webhook endpoint).
3. Copy the new signing secret.
4. Update `STRIPE_WEBHOOK_SECRET` in Vercel env.
5. Redeploy.
6. Verify: trigger a test event from Stripe Dashboard → Webhooks → Send test event. Confirm the app returns 200.
7. If you recreated the endpoint: ensure the new URL is correct and events are re-subscribed.

### Supabase Service Role JWT (`SUPABASE_SERVICE_ROLE_KEY`)

1. Go to Supabase Dashboard → Project → Settings → API.
2. Click **Generate new service role key** (or use the rotate button if available).
3. Update `SUPABASE_SERVICE_ROLE_KEY` in Vercel env.
4. Redeploy.
5. Verify: test an admin action (e.g., view the admin orders page) to confirm service-role calls succeed.
6. The old JWT is immediately invalid once rotated in Supabase.

### Resend API Key (`RESEND_API_KEY`)

1. Log in to https://resend.com → API Keys.
2. Click **Create API key**.
3. Update `RESEND_API_KEY` in Vercel env.
4. Redeploy.
5. Verify: trigger a transactional email (e.g., place a test order) and confirm delivery.
6. Delete the old API key from Resend.

### Sendcloud API Key and Secret (`SENDCLOUD_API_KEY`, `SENDCLOUD_API_SECRET`)

1. Log in to https://panel.sendcloud.sc → Settings → Integrations → Sendcloud API.
2. Delete the existing integration and create a new one, or use the rotate option if available.
3. Update `SENDCLOUD_API_KEY` and `SENDCLOUD_API_SECRET` in Vercel env.
4. Redeploy.
5. Verify: generate a test shipping label from the admin order detail page.
6. Remove the old integration credentials.

### Sentry DSN (`SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`)

1. Log in to Sentry → Project → Settings → Client Keys (DSN).
2. Generate a new DSN key or rotate the existing one.
3. Update both `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` in Vercel env.
4. Redeploy.
5. Verify: trigger a test error (or use Sentry's `captureException` in a dev build) and confirm it appears in the Sentry dashboard.
6. Revoke the old DSN in Sentry.

### Upstash Redis Token (`UPSTASH_REDIS_REST_TOKEN`)

1. Log in to https://console.upstash.com → select the Redis database.
2. Go to **Details** → **REST API** → rotate or regenerate the token.
3. Update `UPSTASH_REDIS_REST_TOKEN` in Vercel env (also update `UPSTASH_REDIS_REST_URL` if it changed).
4. Redeploy.
5. Verify: exercise a rate-limited endpoint (e.g., `/api/payment-intent`) and confirm requests are accepted normally. Check Upstash console to see request count increment.

### Vercel Environment Variables (general)

When rotating any secret:
1. Open Vercel Dashboard → Project → Settings → Environment Variables.
2. Edit the relevant variable for the **Production** environment.
3. Paste the new value and save.
4. Trigger a new deployment (Vercel does not auto-redeploy on env var change).

---

## Verification After Rotation

For each rotated secret, perform these checks before declaring rotation complete:

- [ ] New deployment is active on Vercel (check deployment status).
- [ ] Sentry is not showing a spike in errors related to the rotated service.
- [ ] The specific service integration works end-to-end (per verification step above).
- [ ] Old secret is deleted from both the service provider and Vercel.
- [ ] Rotation is noted with the date in the team's security log or ticketing system.

---

## Emergency Rotation (Suspected Compromise)

1. Rotate immediately — do not wait to schedule.
2. Revoke the old secret in the service dashboard before updating the app (accept brief downtime over continued exposure).
3. Check service access logs for unexpected usage of the compromised secret.
4. If Supabase service role was compromised: audit `audit_logs` table for unexpected admin actions.
5. If Stripe keys were compromised: review Stripe Dashboard → Payments and Refunds for unauthorised charges.
6. Notify affected parties per your data breach procedure if customer data may have been accessed.
