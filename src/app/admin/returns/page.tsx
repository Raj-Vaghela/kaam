import Link from "next/link";
import { RotateCcw, ChevronRight, Clock, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

// Admin views must always reflect current DB state.
export const dynamic = "force-dynamic";

const STATUS_FILTERS = [
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved_pending_webhook" },
    { label: "Refunded", value: "refunded" },
    { label: "Rejected", value: "rejected" },
    { label: "All", value: "" },
];

function formatGBP(n: number | null): string {
    if (n == null) return "—";
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

function statusPill(status: string): { label: string; classes: string; Icon: typeof Clock } {
    switch (status) {
        case "pending":
            return {
                label: "Pending",
                classes: "bg-amber-50 text-amber-800 border-amber-200",
                Icon: Clock,
            };
        case "approved_pending_webhook":
            return {
                label: "Refund processing",
                classes: "bg-sky-50 text-sky-800 border-sky-200",
                Icon: RefreshCw,
            };
        case "refunded":
            return {
                label: "Refunded",
                classes: "bg-emerald-50 text-emerald-800 border-emerald-200",
                Icon: CheckCircle2,
            };
        case "rejected":
            return {
                label: "Rejected",
                classes: "bg-rose-50 text-rose-800 border-rose-200",
                Icon: XCircle,
            };
        default:
            return {
                label: status,
                classes: "bg-cream-soft text-ink-mute border-cream-deep",
                Icon: Clock,
            };
    }
}

interface ReturnRow {
    id: string;
    order_id: string;
    user_id: string;
    reason: string;
    status: string;
    admin_notes: string | null;
    refund_amount: number | null;
    created_at: string;
    updated_at: string | null;
    orders: {
        id: string;
        total: number;
        status: string | null;
        guest_email: string | null;
        shipping_address: { fullName?: string } | null;
    } | null;
}

export default async function AdminReturnsPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string }>;
}) {
    const params = await searchParams;
    const statusFilter = params.status ?? "pending";

    const supabase = await createClient();

    let query = supabase
        .from("return_requests")
        .select(
            `
            id, order_id, user_id, reason, status, admin_notes, refund_amount, created_at, updated_at,
            orders!return_requests_order_id_fkey ( id, total, status, guest_email, shipping_address )
            `
        )
        .order("created_at", { ascending: false });

    if (statusFilter) {
        query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    const returns = (data as ReturnRow[] | null) ?? [];

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <RotateCcw className="text-accent" size={28} strokeWidth={1.8} />
                    <h1 className="font-display text-5xl text-ink">Returns</h1>
                </div>
                <p className="text-ink-mute">Pending requests and refund history.</p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
                {STATUS_FILTERS.map((s) => {
                    const active = s.value === statusFilter;
                    const href = s.value ? `/admin/returns?status=${s.value}` : "/admin/returns?status=";
                    return (
                        <Link
                            key={s.value || "all"}
                            href={href}
                            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                                active
                                    ? "bg-[var(--gajju-teal-deep)] text-cream"
                                    : "bg-cream-soft border border-cream-deep text-ink-soft hover:border-ink-mute"
                            }`}
                        >
                            {s.label}
                        </Link>
                    );
                })}
            </div>

            {/* Error state */}
            {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-800 px-4 py-3 rounded-2xl text-sm mb-6">
                    Failed to load return requests: {error.message}
                </div>
            )}

            {/* Empty state */}
            {!error && returns.length === 0 && (
                <div className="bg-cream-soft border border-cream-deep rounded-3xl p-12 text-center">
                    <RotateCcw size={48} className="mx-auto text-cream-deep mb-4" strokeWidth={1.4} />
                    <h2 className="font-display text-2xl text-ink mb-2">No return requests here</h2>
                    <p className="text-ink-mute">
                        {statusFilter === "pending"
                            ? "Nothing waiting on a decision right now."
                            : "No requests match this filter."}
                    </p>
                </div>
            )}

            {/* Rows */}
            {returns.length > 0 && (
                <div className="space-y-3">
                    {returns.map((r) => {
                        const pill = statusPill(r.status);
                        const customerName =
                            r.orders?.shipping_address?.fullName || r.orders?.guest_email || "Customer";
                        const refund = r.refund_amount ?? r.orders?.total ?? null;
                        return (
                            <Link
                                key={r.id}
                                href={`/admin/orders/${r.order_id}`}
                                className="block bg-white border border-cream-deep rounded-3xl p-5 hover:border-ink-mute hover:shadow-sm transition-all group"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    {/* Left: customer + reason */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border ${pill.classes}`}
                                            >
                                                <pill.Icon size={12} />
                                                {pill.label}
                                            </span>
                                            <span className="text-xs font-mono text-ink-mute">
                                                #{r.order_id.slice(0, 8).toUpperCase()}
                                            </span>
                                            <span className="text-xs text-ink-mute">
                                                ·{" "}
                                                {new Date(r.created_at).toLocaleDateString("en-GB", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </span>
                                        </div>
                                        <p className="font-semibold text-ink mb-1">{customerName}</p>
                                        <p className="text-sm text-ink-soft line-clamp-2 italic">
                                            &ldquo;{r.reason}&rdquo;
                                        </p>
                                        {r.admin_notes && (
                                            <p className="text-xs text-ink-mute mt-2">
                                                <span className="font-semibold">Admin note:</span> {r.admin_notes}
                                            </p>
                                        )}
                                    </div>

                                    {/* Right: refund + chevron */}
                                    <div className="text-right shrink-0">
                                        <p className="text-xs font-semibold tracking-wide uppercase text-ink-mute mb-1">
                                            Refund
                                        </p>
                                        <p className="text-lg font-semibold text-ink">{formatGBP(refund)}</p>
                                        <ChevronRight
                                            size={18}
                                            className="text-ink-mute group-hover:text-accent transition-colors mt-2 ml-auto"
                                        />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
