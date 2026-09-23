# Admin access

How staff accounts are created, revoked, and how the deployed app enforces them.

## TL;DR

```bash
cd ~/Desktop/Projects/kaam

node --env-file=.env.local scripts/admin.mjs list
node --env-file=.env.local scripts/admin.mjs create admin@gajjuexpress.co.uk
node --env-file=.env.local scripts/admin.mjs revoke-all
```

**No redeploy is required.** See [Why no redeploy](#why-no-redeploy).

---

## Why a CLI and not an admin page

Any HTTP endpoint capable of minting an admin is a privilege-escalation
target. However well guarded, it is reachable from the internet and one
auth bug away from being abused.

`scripts/admin.mjs` has no route and no handler. It is not imported by any
page, API route, or middleware, so Next.js never bundles it — it does not
exist in the deployed output. It talks to Supabase directly using
`SUPABASE_SERVICE_ROLE_KEY`, which lives only in:

- `.env.local` on a developer machine (gitignored)
- Vercel's encrypted environment store (server-side only)

It is never prefixed `NEXT_PUBLIC_`, so it never reaches the browser
bundle. There is no attack surface because nothing is listening.

---

## Commands

| Command | Effect |
| --- | --- |
| `list` | Every user with their role and last sign-in |
| `create <email> [password]` | Creates the account or promotes an existing one to `admin`. Generates a strong password when omitted and prints it once. |
| `revoke-all` | Demotes every `admin` and `staff` account to `customer` |
| `delete <email>` | Permanently removes the auth user |

Always invoke with `--env-file=.env.local` so the service-role key is read
from disk rather than typed into your shell history.

### `revoke-all` demotes, it does not delete

`orders` and `audit_log` hold foreign keys to `auth.users`. Hard-deleting an
account that has placed orders or performed admin actions breaks order
history and the audit trail.

`revoke-all` therefore sets `profiles.role = 'customer'`. The account still
exists and can still sign in as a normal customer, but every admin surface
rejects it. Use `delete` only for accounts with no history — test accounts,
typos.

---

## Why no redeploy

Roles are read from Supabase **on every request**, not baked into the build.

```
request → src/proxy.ts → supabase.auth.getUser()
                       → select role from profiles
                       → allow / redirect
```

`src/proxy.ts` looks up `profiles.role` per request, and server components
call `requireAdmin()` which does the same. Nothing about role membership is
compiled in, cached at build time, or stored in an env var.

So a change made by the CLI is live on the next page load. Concretely:

- **Promote someone** → they can reach `/admin` immediately.
- **Revoke someone mid-session** → their session cookie is still
  cryptographically valid, but the very next request re-reads their role,
  sees `customer`, and redirects them out. No need to force a sign-out.

A redeploy is only needed when you change *code* — the proxy logic, a route,
an env var.

---

## Where admins sign in

Production admin lives on the `ops.` subdomain:

```
https://ops.gajjuexpress.co.uk/admin/auth
```

In local development, `/admin/*` on `localhost` is treated as the admin
subdomain, so `http://localhost:3000/admin/auth` works without extra setup.

### The pre-launch gate does not apply to admin

While `SITE_PASSWORD` is set, the retail storefront sits behind a
"Coming Soon" gate. Admin surfaces are exempt — `ops.*`, `/admin/*` and
`/api/admin/*` bypass it (`src/proxy.ts`).

This was a real lockout: the gate previously wrapped `/api/admin/login`,
which returned a 307 to the gate, so staff could never authenticate. Admin
routes enforce their own session and role checks, so gating them added no
security — only a lockout.

---

## Guardrails on the login route

`src/app/api/admin/login/route.ts`:

- **Rate limited** to 5 attempts per 15 minutes per IP, backed by Upstash
  Redis. In production the app refuses to boot without Redis configured —
  an in-memory counter is useless across Vercel's many instances.
- **Uniform errors.** A wrong password, a non-existent account, and a valid
  non-admin account all return the same `Invalid credentials`, so the
  endpoint cannot be used to enumerate which emails are admins.
- **Signs out non-admins.** A valid customer who authenticates here has
  their session torn down immediately rather than being left partially
  logged in.

If you lock yourself out, the Redis key expires on its own after 15 minutes.

---

## Recovering from zero admins

`revoke-all` will happily leave the store with no admins. That is not a
lockout — the CLI does not authenticate as an admin, it uses the service
role key. Run `create` and you are back in.

The only true lockout is losing `SUPABASE_SERVICE_ROLE_KEY`. It can be
rotated from the Supabase dashboard under Settings → API.
