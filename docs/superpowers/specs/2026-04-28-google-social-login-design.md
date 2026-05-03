# Google Social Login — Design Spec

**Date:** 2026-04-28  
**Scope:** Add Google OAuth sign-in to the existing auth page

---

## Goal

Let users sign in or create an account with one click via Google, reducing friction at checkout and account creation. Email/password login stays as the primary flow; Google is offered as an alternative below it.

---

## Auth Page Layout

The existing Sign In / Sign Up toggle and email/password form remain unchanged. The following is added below the submit button on both tabs:

1. An `OR` divider (horizontal line with centred label)
2. A single "Continue with Google" button (white background, Google logo, full width)

No other layout changes. The left-panel brand design is untouched.

---

## OAuth Flow

1. User clicks "Continue with Google"
2. Client calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '<APP_URL>/auth/callback?redirect=<redirect>' } })`
3. User is redirected to Google's consent screen
4. Google redirects to `<APP_URL>/auth/callback?code=...&redirect=...`
5. The callback route handler calls `supabase.auth.exchangeCodeForSession(code)`
6. On success, redirect to the `redirect` param (default `/`)
7. On error, redirect to `/auth?error=oauth_failed`

On first sign-in, Supabase automatically creates the user record. No additional DB work needed — existing RLS and profile triggers handle it.

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/auth/page.tsx` | Add OR divider + Google button below submit button (both tabs) |
| `src/app/auth/callback/route.ts` | New — OAuth callback route handler |

---

## Files Unchanged

- All email/password logic in `src/app/auth/page.tsx`
- `src/app/actions.ts` — no changes
- Database schema, RLS policies, profile table — no changes
- All other pages and components — no changes

---

## Environment Variables

No new env vars required. The callback URL uses `NEXT_PUBLIC_APP_URL` which is already set.

---

## External Setup (Manual — not code)

### Google Cloud Console
1. Create project (or use existing)
2. Enable Google Identity API
3. Create OAuth 2.0 Client ID (Web application type)
4. Add authorized redirect URI: `https://umlzfxbrnyftmoeayvqk.supabase.co/auth/v1/callback`
5. **Publish the OAuth consent screen** (removes 100-user test limit)

### Supabase Dashboard
1. Auth → Providers → Google → Enable
2. Paste Client ID and Client Secret
3. Save

---

## Error Handling

- If OAuth fails or user cancels: redirect to `/auth?error=oauth_failed` and show an inline error message
- If `exchangeCodeForSession` fails: same redirect
- No silent failures — all errors surface to the user

---

## Out of Scope

- Facebook, Apple, or any other provider
- Account linking (Google + existing email account merge)
- MFA
