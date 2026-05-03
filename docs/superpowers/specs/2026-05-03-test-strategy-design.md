# GajjuExpress — Pre-Launch Test Strategy

**Date:** 2026-05-03
**Owner:** CTO
**Status:** Approved

---

## Overview

Two-layer test strategy targeting launch confidence. Unit tests cover pure logic fast; E2E tests cover critical user and admin journeys against real infrastructure. No visual regression or load testing until post-launch.

---

## Infrastructure

| Environment | Supabase Project | Stripe Mode | Used For |
|---|---|---|---|
| Development | `umlzfxbrnyftmoeayvqk` (staging) | Test keys | Daily dev |
| Test (E2E + unit) | `umlzfxbrnyftmoeayvqk` (staging) | Test keys (`sk_test_`) | CI + local test runs |
| Production | `okznqgzbwcxmlditaqvt` | Live keys | Real users |

Tests always run against staging. Production is never touched by automated tests.

**Environment files:**
- `.env.local` — development (already configured)
- `.env.test` — points to staging, used by Vitest + Playwright
- `.env.production` — points to production, used by hosting provider only

---

## Layer 1 — Unit Tests (Vitest)

**Purpose:** Fast, isolated verification of pure business logic. No browser, no network, no DB.

**Framework:** Vitest + happy-dom

**What is tested:**

| Module | File | What to assert |
|---|---|---|
| VAT calculation | `src/lib/invoice.ts` | Correct VAT at standard/zero rate, edge cases (£0, large amounts) |
| Cart totals | `src/context/CartContext.tsx` | Add item, remove item, quantity change, total recalculation |
| Promo code validation | `src/app/actions.ts` | Valid code applies discount, expired code rejected, unknown code rejected |
| Server action auth guards | `src/app/actions.ts` | Unauthenticated calls return `{ success: false, message: "Unauthorized" }` |
| Admin auth guard | `src/app/actions.ts` | Non-admin role returns `{ success: false, message: "Unauthorized" }` |
| Stripe price helper | `src/app/actions.ts` | Cart items convert correctly to Stripe line items (pence, quantity) |
| Invoice line items | `src/lib/invoice.ts` | Line items sum correctly, VAT line is accurate |

**Mocking strategy:**
- Supabase client → mock with `vi.mock('@/lib/supabase/server')`
- Stripe SDK → mock with `vi.mock('stripe')`
- Resend → mock with `vi.mock('resend')`
- `next/cache` `revalidatePath` → mock (no-op)

**Test location:** `src/__tests__/unit/`

**Run command:** `npx vitest run`

---

## Layer 2 — E2E Tests (Playwright)

**Purpose:** Full browser automation against real staging Supabase and Stripe test mode. Catches integration failures that unit tests cannot.

**Framework:** Playwright with Chromium (primary), Firefox + Safari spot checks on critical checkout flow only.

**Test location:** `e2e/`

**Run command:** `npx playwright test`

### Critical Path Tests (must pass before any release)

#### 1. Guest Checkout → Payment → Order Created
- Browse to products page
- Add 2 items to cart
- Proceed to checkout without logging in
- Fill in delivery details
- Enter Stripe test card `4242 4242 4242 4242`
- Submit payment
- Assert: redirect to `/checkout/success`
- Assert: order appears in Supabase `orders` table with status `pending`
- Assert: confirmation email triggered (check Resend test mode or stub)

#### 2. User Registration → Login → Checkout
- Sign up with a new email (use `+test` suffix pattern e.g. `test+{timestamp}@gmail.com`)
- Verify redirect to account page
- Add item to cart
- Complete checkout with Stripe test card
- Assert: order linked to user account in `orders` table
- Assert: order visible on `/orders` page

#### 3. Google OAuth Login
- Click "Continue with Google" on login page
- Assert: redirect to Google OAuth (verify URL pattern)
- Complete OAuth flow with test Google account
- Assert: profile created in `profiles` table
- Assert: redirect to home or account page

#### 4. Stripe Webhook → Order Status Update
- Trigger a test Stripe `payment_intent.succeeded` webhook event using Stripe CLI
- Assert: corresponding order in Supabase updates status from `pending` to `confirmed`
- Assert: audit log entry created

#### 5. Admin — Product Management
- Log in as admin user
- Navigate to `/admin/products`
- Add a new product (name, price, category, stock, image URL)
- Assert: product appears in product listing
- Edit the product price
- Assert: updated price reflected in product listing
- Delete the product
- Assert: product removed from listing

#### 6. Admin — Order Status Management
- Log in as admin user
- Navigate to `/admin/orders`
- Open an existing order
- Change status to `dispatched`
- Assert: status updated in Supabase
- Assert: audit log entry created
- Assert: customer email triggered

#### 7. Wishlist Add / Remove
- Log in as registered user
- Navigate to a product
- Add to wishlist
- Assert: heart icon toggles to active state
- Assert: product appears on wishlist page
- Remove from wishlist
- Assert: product removed from wishlist page

#### 8. Newsletter Signup
- Navigate to homepage
- Enter email in newsletter signup form
- Submit
- Assert: success message displayed
- Assert: email appears in `newsletter_subscribers` table
- Submit same email again
- Assert: duplicate handled gracefully (no crash, appropriate message)

### Test Data Strategy

- **Admin user:** seeded once in staging Supabase via a seed script (`supabase/seed.sql`) with a known email/password
- **Test products:** seeded via `seed.sql` — at least 5 products across 2 categories
- **Guest orders:** created fresh per test run, cleaned up after
- **User accounts:** use `+timestamp` email pattern so each run creates a unique user; purge periodically via Supabase dashboard

### Stripe Test Cards

| Scenario | Card Number |
|---|---|
| Successful payment | `4242 4242 4242 4242` |
| Card declined | `4000 0000 0000 0002` |
| Requires authentication (3DS) | `4000 0025 0000 3155` |

All test cards use expiry `12/34`, CVC `123`, any postcode.

---

## What is Explicitly Excluded (Pre-Launch)

| Area | Reason |
|---|---|
| Visual regression testing | Post-launch — UI is still being refined |
| Load / performance testing | Post-launch — traffic unknown |
| Accessibility automated scan | Manual audit done separately |
| Email HTML rendering | Covered by manual review |
| PDF invoice pixel-perfect | Covered by manual review |

---

## CI Integration (Post-Setup)

Once tests are written, add to GitHub Actions:

```yaml
# On every PR:
- run: npx vitest run          # Unit tests (fast, always)
- run: npx playwright test     # E2E (against staging)
```

PRs cannot merge if either suite fails.

---

## Definition of Done (Pre-Launch Gate)

- [ ] All unit tests pass (`vitest run` exits 0)
- [ ] All 8 E2E critical paths pass on staging
- [ ] Stripe webhook flow verified end-to-end
- [ ] Admin flows verified end-to-end
- [ ] No TypeScript errors (`tsc --noEmit`)
- [ ] No ESLint errors (`eslint`)
- [ ] Production Supabase schema matches staging (verified via `supabase db diff`)
