# Incident Response Runbook

## Severity Levels

| Level | Definition | Example |
|---|---|---|
| SEV1 | Site down or payments broken — active revenue loss | Vercel deployment crashed, Stripe checkout returning 500s |
| SEV2 | Feature broken for a significant subset of users | Order confirmation emails not sending, admin orders page broken |
| SEV3 | Minor degradation, single user, cosmetic | One user cannot load their order history |

## Triage Flow

```
Detect → Assess severity → Contain → Resolve → Postmortem
```

### 1. Detect

Sources of alerts:
- Sentry error rate spike (configured threshold alert)
- Vercel deployment failure notification
- Stripe webhook failure email
- Customer support contact

### 2. Assess Severity

- Is the site reachable? Check Vercel dashboard → Deployments.
- Are payments processing? Check Stripe dashboard → Payments → recent charges.
- Is the database responding? Check Supabase dashboard → Logs → API.
- What is Sentry showing? Filter last 15 minutes.

Assign SEV1, SEV2, or SEV3.

### 3. Contain

**SEV1 — immediate actions:**

1. Rollback the most recent Vercel deployment:
   - Vercel dashboard → Project → Deployments → previous deployment → Promote to Production.
2. If payment-related: pause Stripe webhook endpoint to prevent duplicate processing while resolving.
3. Post in `#incidents` Slack channel: "SEV1 declared — [brief description]. On-call: [name]. Bridge: [link]."

**SEV2:**
1. Identify the affected feature.
2. Determine if a code rollback is warranted or if a hotfix is faster.
3. Post in `#incidents`.

**SEV3:**
1. Create a GitHub issue and assign to next sprint.
2. Inform the affected user if they reported it.

### 4. Resolve

- Deploy the fix (or confirm rollback is stable).
- Verify the fix: exercise the affected flow manually or with a smoke test.
- Confirm Sentry error rate has returned to baseline.
- Confirm Stripe payments are processing if affected.

### 5. Postmortem

For SEV1 (and significant SEV2):
- Document in `docs/postmortems/YYYY-MM-DD-title.md` within 48 hours.
- Cover: timeline, root cause, impact duration, resolution, and action items.
- Add action items to the GitHub issue tracker.

---

## Communication Channels

| Channel | Purpose |
|---|---|
| Slack `#incidents` | Real-time incident coordination (placeholder — configure before launch) |
| On-call rotation | TBD — assign primary and secondary responders |
| Stripe email alerts | Webhook failures, dispute created notifications |
| Sentry alerts | Error spike notifications |

---

## Key Dashboards

| Service | URL |
|---|---|
| Vercel | https://vercel.com/dashboard |
| Sentry | https://sentry.io (see SENTRY_DSN for org/project) |
| Supabase | https://supabase.com/dashboard/project/umlzfxbrnyftmoeayvqk |
| Stripe | https://dashboard.stripe.com |
| Resend | https://resend.com/dashboard |
| Sendcloud | https://panel.sendcloud.sc |
| Upstash | https://console.upstash.com |

---

## SEV1 Checklist

- [ ] Is the Vercel deployment green? If not, rollback.
- [ ] Is `NEXT_PUBLIC_SUPABASE_URL` correct in the Vercel env? Supabase outage?
- [ ] Sentry: what is the top error? Is there a stack trace pointing to a specific route?
- [ ] Stripe dashboard: are recent charges succeeding or failing?
- [ ] Supabase dashboard → Logs: are there connection errors or RLS policy violations?
- [ ] Check Resend for email delivery failures if order confirmations are affected.
- [ ] Check Sendcloud for label generation failures if shipping is affected.
- [ ] Post customer-facing status update if downtime exceeds 10 minutes.
