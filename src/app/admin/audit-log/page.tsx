import { createClient } from "@/lib/supabase/server";
import { Clock, User, Activity } from "lucide-react";

export default async function AuditLogPage() {
    const supabase = await createClient();

    const { data: logs, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

    return (
        <div>
            <div className="mb-10">
                <h1 className="font-display text-5xl text-ink mb-2">Audit Log</h1>
                <p className="text-ink-mute">Who did what, and when.</p>
            </div>

            <div className="bg-cream-soft border border-cream-deep rounded-3xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-cream text-ink-mute text-xs font-semibold uppercase tracking-wider">
                        <tr>
                            <th className="text-left px-6 py-4">Timestamp</th>
                            <th className="text-left px-6 py-4">User</th>
                            <th className="text-left px-6 py-4">Action</th>
                            <th className="text-left px-6 py-4">Resource</th>
                            <th className="text-left px-6 py-4">IP</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-deep">
                        {logs && logs.length > 0 ? (
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            logs.map((log: any) => (
                                <tr key={log.id} className="hover:bg-cream/60 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-ink-soft">
                                            <Clock size={14} className="text-ink-mute" />
                                            {new Date(log.created_at).toLocaleString("en-GB", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5">
                                            <User size={14} className="text-ink-mute" />
                                            <span className="text-ink font-medium font-mono text-xs">
                                                {log.user_id?.slice(0, 8)}...
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent-soft text-accent">
                                            <Activity size={12} />
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-ink-soft">
                                        {log.resource_type && (
                                            <span>
                                                {log.resource_type}
                                                {log.resource_id && (
                                                    <span className="font-mono text-xs text-ink-mute ml-1">
                                                        #{log.resource_id.slice(0, 8)}
                                                    </span>
                                                )}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-ink-mute">
                                        {log.ip_address || "—"}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-16 text-center">
                                    <Activity size={40} className="mx-auto text-cream-deep mb-3" />
                                    <p className="text-ink-mute">
                                        {error ? "Failed to load audit logs." : "No audit entries yet."}
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
