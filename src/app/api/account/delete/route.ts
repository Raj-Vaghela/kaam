import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { logSystemAction } from "@/lib/audit";

/**
 * POST /api/account/delete
 *
 * Deletes the authenticated user's account.
 *
 * Flow:
 *  1. Verify session — 401 if unauthenticated.
 *  2. Re-authenticate with password to prevent CSRF-style deletions.
 *  3. Call delete_self_account() SECURITY DEFINER RPC — anonymises orders and
 *     profile data for the calling auth.uid() (GDPR Art. 17 compliance).
 *  4. Call auth.admin.deleteUser() via service-role client to remove the
 *     auth.users row (the RPC cannot do this from within Postgres).
 *  5. Write an audit log entry (fire-and-forget).
 *  6. Return { ok: true } on success or { ok: false, error } on failure.
 */
export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => ({}));
    const { password } = body as { password?: string };

    if (!password) {
        return NextResponse.json({ ok: false, error: "Password is required." }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Verify the caller has an active session.
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
        return NextResponse.json({ ok: false, error: "Not authenticated." }, { status: 401 });
    }

    // 2. Verify password by re-authenticating.
    const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
    });

    if (authError) {
        return NextResponse.json({ ok: false, error: "Incorrect password." }, { status: 403 });
    }

    // 3. Call the SECURITY DEFINER RPC that anonymises orders and profile data.
    //    The RPC identifies the caller via auth.uid() — no user ID arg is needed.
    const { error: rpcError } = await supabase.rpc("delete_self_account");

    if (rpcError) {
        console.error("[account/delete] delete_self_account RPC failed:", rpcError.message);
        return NextResponse.json(
            { ok: false, error: "Failed to anonymise account data. Contact support." },
            { status: 500 }
        );
    }

    // 4. Remove the auth.users row via service-role client.
    //    This must happen server-side; the RPC cannot delete from auth.users.
    const serviceSupabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    const { error: deleteError } = await serviceSupabase.auth.admin.deleteUser(user.id);

    if (deleteError) {
        console.error("[account/delete] auth.admin.deleteUser failed:", deleteError.message);
        // Data is already anonymised by the RPC; only the auth row remains.
        return NextResponse.json(
            {
                ok: false,
                error: "Account data anonymised but auth record removal failed. Contact support.",
            },
            { status: 500 }
        );
    }

    // 5. Audit log — fire-and-forget; logSystemAction never throws.
    //    We intentionally omit the user ID and email from the log post-deletion.
    await logSystemAction({
        userId: null,
        action: "account.self_deleted",
        resourceType: "user",
        metadata: { email_domain: user.email.split("@")[1] ?? "unknown" },
    });

    return NextResponse.json({ ok: true });
}
