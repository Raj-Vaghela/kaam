import { Users, Shield, UserCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

interface UserRow {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    created_at: string;
}

export default async function AdminUsersPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string; success?: string }>;
}) {
    const currentAdmin = await requireAdmin();
    const params = await searchParams;

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("list_admin_users");

    if (error) {
        console.error("list_admin_users failed:", error);
    }

    const users: UserRow[] = (data as UserRow[] | null ?? []).map((u) => ({
        id: u.id,
        email: u.email ?? "—",
        full_name: u.full_name,
        role: u.role,
        created_at: u.created_at,
    }));

    const errorMessages: Record<string, string> = {
        missing_fields: "Missing required fields.",
        invalid_role: "Invalid role.",
        self_demote: "You cannot demote yourself.",
        last_admin: "Cannot remove the last admin.",
        rate_limited: "Too many role changes. Try again later.",
        forbidden: "Not permitted.",
        unauthorized: "Session expired. Please sign in again.",
        update_failed: "Failed to update role.",
    };

    return (
        <div>
            <div className="mb-10">
                <h1 className="font-display text-5xl text-ink mb-2">Users</h1>
                <p className="text-ink-mute">Manage roles and permissions.</p>
            </div>

            {params.success === "role_updated" && (
                <div className="mb-6 flex items-center gap-2 bg-leaf-soft border border-leaf/30 text-leaf px-4 py-3 rounded-2xl text-sm">
                    <CheckCircle2 size={18} /> Role updated.
                </div>
            )}
            {params.error && errorMessages[params.error] && (
                <div className="mb-6 flex items-center gap-2 bg-red-50 border border-red-100 text-rose px-4 py-3 rounded-2xl text-sm">
                    <AlertCircle size={18} /> {errorMessages[params.error]}
                </div>
            )}

            <div className="bg-cream-soft border border-cream-deep rounded-3xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-cream text-ink-mute text-xs font-semibold uppercase tracking-wider">
                        <tr>
                            <th className="text-left px-6 py-4">User</th>
                            <th className="text-left px-6 py-4">Role</th>
                            <th className="text-left px-6 py-4">Joined</th>
                            <th className="text-right px-6 py-4">Change Role</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-deep">
                        {users.length > 0 ? (
                            users.map((u) => {
                                const isSelf = u.id === currentAdmin.id;
                                return (
                                    <tr key={u.id} className="hover:bg-cream/60 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-11 h-11 bg-accent-soft rounded-2xl flex items-center justify-center">
                                                    {u.role === "admin" ? (
                                                        <Shield size={18} className="text-accent" />
                                                    ) : (
                                                        <UserCircle size={18} className="text-ink-mute" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-ink">
                                                        {u.full_name || "—"}
                                                        {isSelf && (
                                                            <span className="ml-2 text-xs text-ink-mute font-normal">(you)</span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-ink-mute">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                                                    u.role === "admin"
                                                        ? "bg-accent-soft text-accent"
                                                        : u.role === "staff"
                                                        ? "bg-haldi/20 text-ink"
                                                        : "bg-cream text-ink-mute"
                                                }`}
                                            >
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-ink-soft">
                                            {new Date(u.created_at).toLocaleDateString("en-GB", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <form
                                                action="/api/admin/set-role"
                                                method="POST"
                                                className="flex items-center justify-end gap-2"
                                            >
                                                <input type="hidden" name="userId" value={u.id} />
                                                <select
                                                    name="role"
                                                    defaultValue={u.role}
                                                    disabled={isSelf}
                                                    className="px-3 py-2 text-xs font-semibold bg-cream border border-cream-deep rounded-full focus:outline-none focus:border-accent disabled:opacity-60"
                                                >
                                                    <option value="customer">customer</option>
                                                    <option value="staff">staff</option>
                                                    <option value="admin">admin</option>
                                                </select>
                                                <button
                                                    type="submit"
                                                    disabled={isSelf}
                                                    className="px-3 py-2 text-xs font-semibold text-accent bg-accent-soft rounded-full hover:bg-accent hover:text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                                >
                                                    Save
                                                </button>
                                            </form>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-16 text-center">
                                    <Users size={40} className="mx-auto text-cream-deep mb-3" />
                                    <p className="text-ink-mute">No users yet</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
