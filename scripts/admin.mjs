/**
 * Admin account management — LOCAL ONLY.
 *
 * Why a CLI and not an API route: any HTTP endpoint that can mint an admin
 * is an escalation target, however well guarded. This script has no route,
 * no handler and is never bundled into the Next.js build. It runs on a
 * developer machine and needs SUPABASE_SERVICE_ROLE_KEY, which lives only
 * in .env.local (gitignored) and in Vercel's encrypted env — never in the
 * client bundle. Nothing here is reachable from the deployed site.
 *
 * Usage (always via --env-file so the key is never typed on the CLI):
 *   node --env-file=.env.local scripts/admin.mjs list
 *   node --env-file=.env.local scripts/admin.mjs create <email> [password]
 *   node --env-file=.env.local scripts/admin.mjs revoke-all
 *   node --env-file=.env.local scripts/admin.mjs delete <email>
 */

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL_ || !KEY) {
  console.error('\nMissing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  console.error('Run with:  node --env-file=.env.local scripts/admin.mjs <cmd>\n');
  process.exit(1);
}

const H = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
};

async function auth(path, init = {}) {
  const r = await fetch(`${URL_}/auth/v1/admin${path}`, {...init, headers: H});
  const body = await r.text();
  const json = body ? JSON.parse(body) : {};
  if (!r.ok) throw new Error(json.msg || json.message || `HTTP ${r.status}`);
  return json;
}

async function rest(path, init = {}) {
  const r = await fetch(`${URL_}/rest/v1${path}`, {
    ...init,
    headers: {...H, Prefer: 'return=representation'},
  });
  const body = await r.text();
  const json = body ? JSON.parse(body) : [];
  if (!r.ok) throw new Error(json.message || `HTTP ${r.status}`);
  return json;
}

const listUsers = async () => (await auth('/users?per_page=200')).users ?? [];

async function withRoles() {
  const users = await listUsers();
  const profiles = await rest('/profiles?select=id,role,full_name');
  const byId = Object.fromEntries(profiles.map((p) => [p.id, p]));
  return users.map((u) => ({
    id: u.id,
    email: u.email,
    role: byId[u.id]?.role ?? '(no profile)',
    lastSignIn: u.last_sign_in_at,
  }));
}

function randomPassword() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  return Array.from(bytes, (b) => c[b % c.length]).join('') + '!7';
}

const [cmd, arg1, arg2] = process.argv.slice(2);

switch (cmd) {
  case 'list': {
    const rows = await withRoles();
    console.log('');
    for (const r of rows.sort((a, b) => (a.role === 'admin' ? -1 : 1))) {
      const tag = r.role === 'admin' ? 'ADMIN ' : r.role === 'staff' ? 'STAFF ' : '      ';
      console.log(`  ${tag} ${r.email.padEnd(34)} ${r.lastSignIn?.slice(0, 10) ?? 'never'}`);
    }
    console.log(`\n  ${rows.filter((r) => r.role === 'admin').length} admin(s), ${rows.length} user(s)\n`);
    break;
  }

  case 'revoke-all': {
    const admins = (await withRoles()).filter((r) => r.role === 'admin' || r.role === 'staff');
    if (!admins.length) {
      console.log('\nNo admins to revoke.\n');
      break;
    }
    for (const a of admins) {
      await rest(`/profiles?id=eq.${a.id}`, {
        method: 'PATCH',
        body: JSON.stringify({role: 'customer'}),
      });
      console.log(`  revoked ${a.email}`);
    }
    console.log(`\n${admins.length} account(s) demoted to customer. Accounts kept — order\nhistory and audit-log references stay intact.\n`);
    break;
  }

  case 'create': {
    if (!arg1) {
      console.error('\nUsage: create <email> [password]\n');
      process.exit(1);
    }
    const password = arg2 || randomPassword();

    const existing = (await listUsers()).find((u) => u.email === arg1);
    let id;

    if (existing) {
      await auth(`/users/${existing.id}`, {
        method: 'PUT',
        body: JSON.stringify({password, email_confirm: true}),
      });
      id = existing.id;
      console.log(`\n  existing account found — password reset`);
    } else {
      const created = await auth('/users', {
        method: 'POST',
        body: JSON.stringify({
          email: arg1,
          password,
          email_confirm: true,
          user_metadata: {full_name: 'GajjuExpress Admin'},
        }),
      });
      id = created.id;
      console.log(`\n  account created`);
    }

    // A DB trigger may have already inserted the profile row; PATCH first and
    // fall back to POST so this works either way.
    const patched = await rest(`/profiles?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({role: 'admin'}),
    });
    if (!patched.length) {
      await rest('/profiles', {
        method: 'POST',
        body: JSON.stringify({id, role: 'admin', full_name: 'GajjuExpress Admin'}),
      });
    }

    console.log(`  role set to admin\n`);
    console.log(`  email:    ${arg1}`);
    console.log(`  password: ${password}`);
    console.log(`\n  Sign in at https://ops.gajjuexpress.co.uk/admin/auth`);
    console.log(`  Change this password after first login.\n`);
    break;
  }

  case 'delete': {
    if (!arg1) {
      console.error('\nUsage: delete <email>\n');
      process.exit(1);
    }
    const u = (await listUsers()).find((x) => x.email === arg1);
    if (!u) {
      console.error(`\nNo user with email ${arg1}\n`);
      process.exit(1);
    }
    await auth(`/users/${u.id}`, {method: 'DELETE'});
    console.log(`\n  deleted ${arg1}\n`);
    break;
  }

  default:
    console.log(`
  Admin management (local only — no deployed surface)

    list         show every user and their role
    create       create/promote an admin, print credentials
    revoke-all   demote all admins and staff to customer
    delete       permanently remove a user

  node --env-file=.env.local scripts/admin.mjs list
`);
}
