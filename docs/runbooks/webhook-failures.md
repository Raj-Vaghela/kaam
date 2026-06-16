# Webhook Failures Runbook

## Overview

GajjuExpress processes Stripe webhook events at `POST /api/webhooks/stripe`. Each event is recorded in the `stripe_events` table to enable idempotent processing. This runbook covers identifying failures, replaying events, and manual reconciliation.

---

## Identifying Failed Webhooks

### Via Stripe Dashboard

1. Log in to https://dashboard.stripe.com.
2. Navigate to **Developers** → **Webhooks**.
3. Select the webhook endpoint (`https://gajjuexpress.co.uk/api/webhooks/stripe`).
4. Click **Recent deliveries**.
5. Failed deliveries show a non-2xx response code or a timeout.
6. Click any delivery to see the full request payload and response body.

### Via Application Logs

Vercel → Project → Logs → filter by path `/api/webhooks/stripe`. Look for:
- `500` responses
- `"Webhook signature verification failed"` — indicates a mismatch between `STRIPE_WEBHOOK_SECRET` and the endpoint's signing secret.
- `"RPC error"` — database call failed.

### Via Sentry

Filter events by `transaction:/api/webhooks/stripe` to see unhandled exceptions.

---

## Replaying a Failed Event

### Via Stripe Dashboard

1. Find the failed delivery under **Developers → Webhooks → Recent deliveries**.
2. Click the delivery row.
3. Click **Resend** (top right).
4. Stripe will POST the original payload to the endpoint again.

### Via Stripe CLI

```bash
stripe events resend evt_XXXXXXXXXXXXXXXXXXXXXXXX
```

Replace `evt_XXX` with the event ID shown in the Dashboard.

### Via Stripe API

```bash
curl -X POST https://api.stripe.com/v1/test_helpers/events/evt_XXX/resend \
  -H "Authorization: Bearer $STRIPE_SECRET_KEY"
```

Note: replaying is only available for events delivered within the last 30 days.

---

## The `stripe_events` Table

The deduplication table prevents double-processing if Stripe delivers the same event twice.

Schema (representative):

```sql
stripe_events (
  id          text PRIMARY KEY,  -- Stripe event ID (evt_xxx)
  type        text NOT NULL,     -- e.g. "payment_intent.succeeded"
  processed_at timestamptz NOT NULL DEFAULT now()
)
```

Query recent events:

```sql
SELECT id, type, processed_at
FROM stripe_events
ORDER BY processed_at DESC
LIMIT 50;
```

Check if a specific event was processed:

```sql
SELECT * FROM stripe_events WHERE id = 'evt_XXXXXXXXXXXXXXXXXXXXXXXX';
```

---

## Manual Reconciliation

If the `stripe_events` table got out of sync (e.g., an event was marked processed but the downstream action failed, or vice versa):

### Step 1 — Identify the discrepancy

Compare the Stripe dashboard event status against the corresponding order/payment record:

```sql
-- Find orders that should be paid but aren't
SELECT id, stripe_payment_intent_id, status
FROM orders
WHERE status = 'pending'
  AND created_at > now() - interval '24 hours';
```

Cross-reference each `stripe_payment_intent_id` in the Stripe Dashboard to confirm payment succeeded.

### Step 2 — Remove the dedup record (if event should be reprocessed)

```sql
DELETE FROM stripe_events WHERE id = 'evt_XXXXXXXXXXXXXXXXXXXXXXXX';
```

Then replay the event via the Dashboard or CLI. The handler will process it again and the dedup record will be re-inserted.

### Step 3 — Manually apply the downstream change (if replay is not possible)

If the event is older than 30 days and cannot be replayed, apply the intended change directly:

```sql
-- Example: mark an order as paid after confirming payment in Stripe Dashboard
UPDATE orders
SET status = 'processing', payment_intent_id = 'pi_xxx', updated_at = now()
WHERE id = '<order_id>';
```

Always verify in Stripe first before mutating order state.

---

## Common Failure Causes

| Symptom | Likely Cause | Fix |
|---|---|---|
| 400 "Webhook signature verification failed" | `STRIPE_WEBHOOK_SECRET` mismatch | Rotate secret — see `docs/runbooks/secret-rotation.md` |
| 500 on `payment_intent.succeeded` | Database error during order update | Check Sentry stack trace; fix and replay |
| 200 but order not updated | Event ID already in `stripe_events` (duplicate) | Verify order state; if wrong, delete dedup record and replay |
| Stripe stops retrying | Delivery kept returning 5xx for 72 hours | Stripe stops after 72 hours; use manual replay or CLI |
