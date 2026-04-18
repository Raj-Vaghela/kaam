import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Audit logging.
 *
 * Two entry points:
 * - `logAdminAction(supabase, …)` — preferred. Uses the caller's session
 *   via the `log_admin_action` SECURITY DEFINER RPC. The actor is taken
 *   from auth.uid() server-side, so callers cannot forge it.
 * - `logSystemAction(…)` — for contexts with no user session (Stripe
 *   webhooks, scheduled jobs). Uses the service role to insert directly.
 *
 * All failures are logged but never thrown: audit logging must not
 * break the user-facing flow.
 */

interface AdminActionEntry {
    action: string;
    resourceType?: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
}

interface SystemActionEntry extends AdminActionEntry {
    /** Actor for system events. Use null for anonymous/system-originated events. */
    userId: string | null;
    ipAddress?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function logAdminAction(supabase: SupabaseClient<any, "public", any>, entry: AdminActionEntry): Promise<void> {
    try {
        const { error } = await supabase.rpc("log_admin_action", {
            action_name: entry.action,
            resource_type: entry.resourceType ?? null,
            resource_id: entry.resourceId ?? null,
            metadata: entry.metadata ?? {},
        });
        if (error) {
            console.error("Audit RPC failed:", error.message);
        }
    } catch (err) {
        console.error("Audit RPC error:", err);
    }
}

// ------------ service-role path (webhooks, system events) ------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _service: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serviceClient(): any {
    if (!_service) {
        _service = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        );
    }
    return _service;
}

export async function logSystemAction({
    userId,
    action,
    resourceType,
    resourceId,
    metadata,
    ipAddress,
}: SystemActionEntry): Promise<void> {
    try {
        const { error } = await serviceClient().from("audit_logs").insert({
            user_id: userId,
            action,
            resource_type: resourceType,
            resource_id: resourceId,
            metadata: metadata || {},
            ip_address: ipAddress,
        });
        if (error) {
            console.error("System audit insert failed:", error.message);
        }
    } catch (err) {
        console.error("System audit error:", err);
    }
}
