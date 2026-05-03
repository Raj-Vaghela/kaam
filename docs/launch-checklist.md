# GajjuExpress Launch Checklist

---

## 🔴 Blockers — must be done before launch

### Deployment
- [ ] Merge `feat/logo-rebrand` → `main`
- [ ] Connect repo to Vercel and deploy `main`
- [ ] Set all env vars in Vercel dashboard (copy from `.env.local`)
- [ ] Set `NEXT_PUBLIC_APP_URL=https://gajjuexpress.co.uk` in Vercel env
- [ ] Point `gajjuexpress.co.uk` DNS to Vercel

### Payments
- [ ] Switch to Stripe **live** keys (`pk_live_` / `sk_live_`) in Vercel env
- [ ] Register production webhook endpoint in Stripe dashboard (`https://gajjuexpress.co.uk/api/webhooks/stripe`)
- [ ] Update `STRIPE_WEBHOOK_SECRET` in Vercel env with the production signing secret

### Legal
- [ ] VAT: set `VAT_NUMBER` in env (if VAT-registered) or strip VAT from invoices (if not) ✅ done
- [ ] Add Companies House registration number to Terms and Privacy pages
- [ ] Verify brand phone numbers are real (`+44 20 7946 0123` — 7946 is Ofcom's reserved test range)

### Pages
- [ ] Create `src/app/not-found.tsx` (branded 404 page)
- [ ] Create `src/app/error.tsx` (branded error page)

### Assets
- [ ] Add `favicon.ico` to `public/`
- [ ] Add `apple-touch-icon.png` to `public/` (180×180)
- [ ] Add `icon.png` to `public/` (32×32)

---

## 🟠 Important — fix before real customers arrive

### Email
- [ ] Verify `gajjuexpress.co.uk` domain in Resend dashboard
- [ ] Set `RESEND_DOMAIN=gajjuexpress.co.uk` in Vercel env
- [ ] Confirm order confirmation email arrives after a test checkout (use `stripe listen` locally or test on production)

### Operations
- [ ] Fix stock not decrementing after a completed order (DB trigger or webhook step)
- [ ] Confirm shipping address shows correctly in admin order detail view

### Monitoring
- [ ] Add error monitoring (Sentry or similar) so production crashes alert you
- [ ] Add basic analytics (Vercel Analytics, Plausible, or GA4)

### Trust & Legal
- [ ] Verify social profiles exist: `instagram.com/gajjuexpress`, `facebook.com/gajjuexpress`
- [ ] Cookie consent banner: add Reject / Decline option (UK PECR compliance)

---

## 🟡 Polish — do before or shortly after launch

### SEO & Social
- [ ] Create a proper `1200×630` OG social card image (currently using logo at wrong dimensions)
- [ ] Replace OG image in `src/app/layout.tsx` once created

### Cleanup
- [ ] Delete `public/Login_Left.PNG` (leftover dev asset)
- [ ] Delete boilerplate Next.js SVGs from `public/`: `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`, `file.svg`

---

## ✅ Done

- [x] `SUPABASE_SERVICE_ROLE_KEY` set
- [x] `RESEND_API_KEY` set
- [x] Stripe keys set (test mode — swap for live before launch)
- [x] `STRIPE_WEBHOOK_SECRET` set
- [x] `NEXT_PUBLIC_APP_URL` set (update to production URL in Vercel)
- [x] VAT number wired to env var (`VAT_NUMBER`)
- [x] TypeScript build errors fixed (admin orders form actions)
- [x] `useSearchParams` Suspense boundary added (fixes build error)
- [x] Email `from` address fixed (`onboarding@resend.dev` until domain verified)
- [x] Newsletter template `domain` variable reference fixed
- [x] Security headers (HSTS, CSP, X-Frame-Options, etc.)
- [x] Stripe webhook signature verification
- [x] RLS on all Supabase tables
- [x] Admin audit logging
- [x] Rate limiting on payment intents
- [x] Sitemap at `/sitemap.xml` with live product URLs
- [x] `robots.txt` blocks admin/account/checkout
- [x] Open Graph + Twitter card metadata
- [x] Per-page metadata on all public pages
- [x] Stock validation at checkout (prevents overselling)
- [x] GDPR cookie consent banner
- [x] Privacy policy page
- [x] Terms of service page
- [x] Delivery & shipping page
- [x] Returns & refunds page
