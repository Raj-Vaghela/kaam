# Google Social Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Continue with Google" button to the auth page, below the email/password form, using the existing Supabase OAuth callback route.

**Architecture:** The callback route at `src/app/auth/callback/route.ts` already exists and handles `exchangeCodeForSession`. Task 1 aligns its error redirect format. Task 2 adds the Google button and error display to the auth page.

**Tech Stack:** Next.js 16 App Router, Supabase SSR (`@supabase/ssr`), Tailwind CSS, `createBrowserClient`

---

## File Map

| File | Action |
|------|--------|
| `src/app/auth/callback/route.ts` | Modify — align error redirect to `?error=oauth_failed` |
| `src/app/auth/page.tsx` | Modify — read `error` param, add Google button + OR divider |

---

### Task 1: Align callback error redirect

**Files:**
- Modify: `src/app/auth/callback/route.ts`

The existing callback redirects to `/auth?error=Could not authenticate`. Align it to the standard `?error=oauth_failed` format the auth page will use.

- [ ] **Step 1: Update the error redirect in the callback route**

Replace the entire file content of `src/app/auth/callback/route.ts` with:

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeRedirect } from "@/lib/security/redirect";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = safeRedirect(searchParams.get("next") || "/");

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    return NextResponse.redirect(`${origin}/auth?error=oauth_failed`);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/auth/callback/route.ts
git commit -m "fix(auth): align OAuth callback error redirect format"
```

---

### Task 2: Add Google button and error display to auth page

**Files:**
- Modify: `src/app/auth/page.tsx`

Three changes to `AuthPageInner`:
1. Read `error` from searchParams and show it inline
2. Add `handleGoogleSignIn` function
3. Add OR divider + Google button below the submit button

- [ ] **Step 1: Read the `error` param from searchParams**

In `AuthPageInner`, after the existing `const redirect = searchParams.get("redirect") || "/";` line, add:

```ts
const oauthError = searchParams.get("error");
```

- [ ] **Step 2: Show the OAuth error inline**

The existing error display block is:
```tsx
{error && (
    <div className="mb-5 bg-red-50 border border-red-100 text-rose px-4 py-3 rounded-2xl text-sm">{error}</div>
)}
```

Add an OAuth error block directly above it:
```tsx
{oauthError === "oauth_failed" && (
    <div className="mb-5 bg-red-50 border border-red-100 text-rose px-4 py-3 rounded-2xl text-sm">
        Google sign-in failed or was cancelled. Please try again.
    </div>
)}
{error && (
    <div className="mb-5 bg-red-50 border border-red-100 text-rose px-4 py-3 rounded-2xl text-sm">{error}</div>
)}
```

- [ ] **Step 3: Add `handleGoogleSignIn` function**

Add this function inside `AuthPageInner`, after the existing `handleSubmit` function:

```ts
const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=${encodeURIComponent(redirect)}`,
        },
    });
    if (error) {
        setError("Could not start Google sign-in. Please try again.");
        setLoading(false);
    }
};
```

- [ ] **Step 4: Add OR divider and Google button**

Find the closing `</form>` tag in the JSX (after the submit button). Add the divider and Google button immediately after it:

```tsx
</form>

<div className="flex items-center gap-3 my-6">
    <div className="flex-1 h-px bg-cream-deep" />
    <span className="text-xs font-semibold text-ink-mute uppercase tracking-wider">or</span>
    <div className="flex-1 h-px bg-cream-deep" />
</div>

<button
    type="button"
    onClick={handleGoogleSignIn}
    disabled={loading}
    className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white border border-cream-deep rounded-2xl text-sm font-semibold text-ink hover:border-accent hover:shadow-sm transition-all disabled:opacity-50"
>
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.8 2.5 30.2 0 24 0 14.6 0 6.6 5.5 2.7 13.5l7.8 6C12.4 13.4 17.7 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17z"/>
        <path fill="#FBBC05" d="M10.5 28.5A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.1.8-4.5l-7.8-6A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.9-6.2z"/>
        <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.7 2.2-6.3 0-11.6-4-13.5-9.4l-7.9 6.2C6.6 42.5 14.6 48 24 48z"/>
    </svg>
    Continue with Google
</button>
```

- [ ] **Step 5: Verify TypeScript is clean**

```bash
npx tsc --noEmit
```

Expected: no output (zero errors)

- [ ] **Step 6: Start dev server and manually verify**

```bash
npm run dev
```

Open http://localhost:3000/auth and confirm:
- Email/password form appears as before
- OR divider appears below the Sign In / Sign Up button
- "Continue with Google" button appears below the divider
- Button is present on both Sign In and Sign Up tabs
- Visiting `/auth?error=oauth_failed` shows the error message

- [ ] **Step 7: Commit**

```bash
git add src/app/auth/page.tsx
git commit -m "feat(auth): add Google OAuth sign-in button"
```

---

## Manual Setup Checklist (required before Google login works end-to-end)

These are done in dashboards, not in code:

- [ ] Google Cloud Console → create OAuth 2.0 Client ID (Web application)
- [ ] Add authorized redirect URI: `https://umlzfxbrnyftmoeayvqk.supabase.co/auth/v1/callback`
- [ ] Publish the OAuth consent screen (removes 100-user testing limit)
- [ ] Supabase Dashboard → Auth → Providers → Google → enable, paste Client ID + Secret
