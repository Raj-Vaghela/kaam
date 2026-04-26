import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/security/rate-limit";

// Max 20 role changes per admin per hour (in addition to per-IP limit).
const ROLE_CHANGE_USER_LIMIT = 20;
const ROLE_CHANGE_IP_LIMIT = 60;
const ROLE_CHANGE_WINDOW_MS = 60 * 60 * 1000;

type RpcError = { code?: string; message?: string };

const RPC_ERROR_TO_PARAM: Record<string, string> = {
    not_authenticated: "unauthorized",
    forbidden: "forbidden",
    invalid_role: "invalid_role",
    target_not_found: "missing_fields",
    self_demote: "self_demote",
    last_admin: "last_admin",
};

export async function POST(request: NextRequest) {
    const ip = getClientIp(request);
    const ipLimit = await rateLimit(`set-role:ip:${ip}`, ROLE_CHANGE_IP_LIMIT, ROLE_CHANGE_WINDOW_MS);
    if (!ipLimit.allowed) {
        return NextResponse.redirect(new URL("/admin/users?error=rate_limited", request.url));
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.redirect(new URL("/admin/auth", request.url));
    }

    const userLimit = await rateLimit(
        `set-role:user:${user.id}`,
        ROLE_CHANGE_USER_LIMIT,
        ROLE_CHANGE_WINDOW_MS
    );
    if (!userLimit.allowed) {
        return NextResponse.redirect(new URL("/admin/users?error=rate_limited", request.url));
    }

    const formData = await request.formData();
    const targetUserId = (formData.get("userId") as string | null)?.trim() ?? "";
    const newRole = (formData.get("role") as string | null)?.trim() ?? "";

    if (!targetUserId || !newRole) {
        return NextResponse.redirect(new URL("/admin/users?error=missing_fields", request.url));
    }

    // All auth, allow-list, self-demote, and last-admin checks happen
    // inside the SECURITY DEFINER function under the caller's session.
    // No service role needed.
    const { error } = await supabase.rpc("admin_set_user_role", {
        target_user_id: targetUserId,
        new_role: newRole,
    });

    if (error) {
        const rpcError = error as RpcError;
        const message = rpcError.message ?? "";
        // Postgres RAISE EXCEPTION surfaces as "not_authenticated", etc.
        const matched = Object.keys(RPC_ERROR_TO_PARAM).find((key) => message.includes(key));
        const errParam = matched ? RPC_ERROR_TO_PARAM[matched] : "update_failed";

        if (!matched) {
            console.error("admin_set_user_role failed:", rpcError);
        }

        return NextResponse.redirect(new URL(`/admin/users?error=${errParam}`, request.url));
    }

    return NextResponse.redirect(new URL("/admin/users?success=role_updated", request.url));
}
