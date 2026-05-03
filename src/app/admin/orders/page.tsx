import Link from "next/link";
import { ShoppingBag, Calendar, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getStatusConfig } from "@/lib/order-status";

const STATUS_FILTERS = [
    { label: "All", value: "" },
    { label: "Pending", value: "pending" },
    { label: "Paid", value: "paid" },
    { label: "Processing", value: "processing" },
    { label: "Shipped", value: "shipped" },
    { label: "Delivered", value: "delivered" },
    { label: "Cancelled", value: "cancelled" },
];

function formatGBP(n: number): string {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

interface OrderRow {
    id: string;
    status: string | null;
    total: number | null;
    created_at: string;
    guest_email: string | null;
    user_id: string | null;
    shipping_address: { fullName?: string } | null;
    tracking_number: string | null;
    tracking_url: string | null;
    order_items: { product_name: string; quantity: number; unit_price: number }[];
}

export default async function AdminOrdersPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string }>;
}) {
    const params = await searchParams;
    const statusFilter = params.status ?? "";

    const supabase = await createClient();

    let query = supabase
        .from("orders")
        .select(
            "id, status, total, created_at, guest_email, user_id, shipping_address, tracking_number, tracking_url, order_items(product_name, quantity, unit_price)"
        )
        .order("created_at", { ascending: false })
        .limit(100);

    if (statusFilter) {
        query = query.eq("status", statusFilter);
    }

    const { data: orders, error } = await query;

    if (error) {
        return (
            <div>
                <div className="mb-10">
                    <h1 className="font-display text-5xl text-ink mb-2">Orders</h1>
                    <p className="text-rose">Failed to load orders. Please try again.</p>
                </div>
            </div>
        );
    }

    const rows = (orders as OrderRow[] | null) ?? [];

    return (
        <div>
            <div className="mb-10">
                <h1 className="font-display text-5xl text-ink mb-2">Orders</h1>
                <p className="text-ink-mute">Every order, in one place.</p>
            </div>

            {/* Status filter tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                {STATUS_FILTERS.map((f) => {
                    const active = statusFilter === f.value;
                    return (
                        <Link
                            key={f.value}
                            href={f.value ? `/admin/orders?status=${f.value}` : "/admin/orders"}
                            className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                                active
                                    ? "bg-[var(--gajju-teal-deep)] text-white"
                                    : "bg-cream-soft border border-cream-deep text-ink-mute hover:border-accent hover:text-accent"
                            }`}
                        >
                            {f.label}
                        </Link>
                    );
                })}
            </div>

            <div className="bg-cream-soft border border-cream-deep rounded-3xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-cream text-ink-mute text-xs font-semibold uppercase tracking-wider">
                        <tr>
                            <th className="text-left px-6 py-4">Order</th>
                            <th className="text-left px-6 py-4">Customer</th>
                            <th className="text-left px-6 py-4">Date</th>
                            <th className="text-left px-6 py-4">Total</th>
                            <th className="text-left px-6 py-4">Status</th>
                            <th className="text-left px-6 py-4">Tracking</th>
                            <th className="text-right px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-deep">
                        {rows.length > 0 ? (
                            rows.map((order) => {
                                const statusCfg = getStatusConfig(order.status ?? "");
                                const customer =
                                    order.guest_email ??
                                    (order.shipping_address?.fullName ?? null) ??
                                    (order.user_id ? "Account" : "Guest");

                                return (
                                    <tr key={order.id} className="hover:bg-cream/60 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-11 h-11 bg-accent-soft rounded-2xl flex items-center justify-center shrink-0">
                                                    <ShoppingBag size={18} className="text-accent" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-ink">
                                                        #{order.id.slice(0, 8).toUpperCase()}
                                                    </p>
                                                    <p className="text-xs text-ink-mute">
                                                        {order.order_items?.length ?? 0} item
                                                        {(order.order_items?.length ?? 0) !== 1 ? "s" : ""}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-ink truncate max-w-[180px]">
                                                {customer}
                                            </p>
                                            {order.user_id && !order.guest_email && (
                                                <p className="text-xs text-ink-mute">Account holder</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-ink-soft">
                                                <Calendar size={14} className="text-ink-mute" />
                                                {new Date(order.created_at).toLocaleDateString("en-GB", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-ink">
                                                {formatGBP(Number(order.total) || 0)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.text}`}
                                            >
                                                {statusCfg.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {order.tracking_number ? (
                                                order.tracking_url ? (
                                                    <a
                                                        href={order.tracking_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-accent font-semibold hover:underline"
                                                    >
                                                        {order.tracking_number}
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-ink font-mono">
                                                        {order.tracking_number}
                                                    </span>
                                                )
                                            ) : (
                                                <span className="text-xs text-ink-mute">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end">
                                                <Link
                                                    href={`/admin/orders/${order.id}`}
                                                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-accent bg-accent-soft rounded-full hover:bg-accent hover:text-white transition-colors"
                                                >
                                                    View <ChevronRight size={14} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-6 py-16 text-center">
                                    <ShoppingBag size={40} className="mx-auto text-cream-deep mb-3" />
                                    <p className="text-ink-mute">
                                        {statusFilter ? `No ${statusFilter} orders found.` : "No orders yet."}
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
