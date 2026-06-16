# Chargeback (Dispute) Runbook

## Overview

A chargeback is raised when a customer disputes a charge with their bank. Stripe notifies us via the `charge.dispute.created` webhook event. We have a limited window to submit evidence. Losing a dispute means the charge is reversed plus a dispute fee (~£15).

---

## Response Window

**You have 7 to 21 days** from `charge.dispute.created` to submit evidence, depending on the card network. Stripe typically shows the exact due date in the dispute detail.

**The hard limit is set by the card network, not Stripe.** Do not wait until the last day.

---

## Identifying a Dispute

### Via Stripe Dashboard

1. Log in to https://dashboard.stripe.com.
2. Navigate to **Disputes** (left sidebar) or search for the payment ID.
3. Each dispute shows:
   - Dispute reason (e.g., `fraudulent`, `product_not_received`, `unrecognized`)
   - Evidence due date
   - Charge amount
   - Associated customer email

### Via Database

Disputed orders are flagged with `status = 'disputed'`:

```sql
SELECT id, stripe_payment_intent_id, guest_email, total_amount, created_at, status
FROM orders
WHERE status = 'disputed'
ORDER BY created_at DESC;
```

If the order was not automatically marked as disputed when the webhook fired, update it manually after verifying in Stripe:

```sql
UPDATE orders
SET status = 'disputed', updated_at = now()
WHERE stripe_payment_intent_id = 'pi_XXXXXXXXXXXXXXXXXXXXXXXX';
```

---

## Evidence Checklist

Gather the following before submitting evidence. More evidence improves win rates.

- [ ] **Order record** — PDF invoice or order confirmation showing item, amount, date, and customer details.
- [ ] **Shipping label** — generated label showing recipient name and address.
- [ ] **Proof of delivery** — tracking URL from EVRI/Sendcloud showing "Delivered" status. Screenshot the delivery event with timestamp.
- [ ] **Customer communications** — any emails or messages between the customer and support (order confirmation, shipping notification, any replies).
- [ ] **IP address and device info** — available from Stripe Radar on the charge detail (shows IP, country, browser).
- [ ] **Terms of service acceptance** — note that the customer agreed to terms at checkout (point to `/terms` on the site).
- [ ] **Refund policy** — point to `/returns` and note the 14-day return window.

For `product_not_received` disputes, tracking proof of delivery is the most important piece of evidence.

For `fraudulent` disputes, Stripe Radar data (IP match, address match) matters most.

---

## Finding Tracking Information

1. In Supabase: query the `orders` table for the order linked to the disputed payment intent.
2. The `label_url` or `tracking_number` column (if populated) gives the Sendcloud tracking reference.
3. Look up the tracking status at https://panel.sendcloud.sc or directly on https://www.evri.com/track.

---

## Submitting Evidence in Stripe

1. Go to **Disputes** in the Stripe Dashboard.
2. Click the dispute row.
3. Click **Submit evidence**.
4. Fill in each section:
   - Customer name, email, IP
   - Product description
   - Shipping carrier, tracking number, documentation
   - Paste the tracking proof of delivery URL and upload a screenshot
   - Customer signature / acceptance (note checkout flow)
5. Click **Submit evidence**. You cannot edit after submission.

Alternatively, use the Stripe API to upload evidence programmatically (useful if automating for high volume).

---

## After Submission

- Stripe notifies you of the outcome via `charge.dispute.funds_reinstated` (won) or `charge.dispute.lost`.
- If you win: the disputed amount is returned minus the dispute fee.
- If you lose: the charge is reversed. Update the order status to `refunded` or `lost_dispute` for accounting.

```sql
-- Mark lost dispute
UPDATE orders
SET status = 'lost_dispute', updated_at = now()
WHERE stripe_payment_intent_id = 'pi_XXXXXXXXXXXXXXXXXXXXXXXX';
```

---

## Prevention

- Ensure order confirmation and shipping notification emails are sent promptly (reduces `product_not_received` disputes).
- Ensure EVRI tracking numbers are stored on orders as soon as labels are generated.
- Display clear return policy at checkout and in confirmation emails.
- Use Stripe Radar rules to flag suspicious orders before they are charged.
