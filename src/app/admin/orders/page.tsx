import Link from "next/link";
import { ShoppingBag, Calendar, ChevronRight, Search, X, ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getStatusConfig } from "@/lib/order-status";

// Admin views must always reflect current DB state.
export const dynamic = "force-dynamic";

const STATUS_FILTERS = [
    { label: "All", value: "" },
    { label: "Pending", value: "pending" },
    { label: "Paid", value: "paid" },
    { label: "Processing", value: "processing" },
    { label: "Shipped", value: "shipped" },
    { label: "Delivered", value: "delivered" },
    { label: "Cancelled", value: "cancelled" },
    { label: "Refunded", value: "refunded" },
];

const SORT_OPTIONS = [
    { value: "newest", label: "Newest first", column: "created_at", asc: false },
    { value: "oldest", label: "Oldest first", column: "created_at", asc: true },
    { value: "total_desc", label: "Total (high → low)", column: "total", asc: false },
    { value: "total_asc", label: "Total (low → high)", column: "total", asc: true },
] as const;

const PAGE_SIZE = 25;

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

interface SearchParams {
    status?: string;
    q?: string;
    sort?: string;
    from?: string;
    to?: string;
    page?: string;
}

function buildHref(base: string, params: Record<string, string | undefined>): string {
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v && v.length) usp.set(k, v);
    }
    const qs = usp.toString();
    return qs ? `${base}?${qs}` : base;
}

export default async function AdminOrdersPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const params = await searchParams;
    const statusFilter = params.status ?? "";
    const searchTerm = (params.q ?? "").trim();
    const sortKey = params.sort ?? "newest";
    const fromDate = params.from ?? "";
    const toDate = params.to ?? "";
    const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
    const sortConfig = SORT_OPTIONS.find((s) => s.value === sortKey) ?? SORT_OPTIONS[0];

    const supabase = await createClient();

    const offset = (page - 1) * PAGE_SIZE;

    let query = supabase
        .from("orders")
        .select(
            "id, status, total, created_at, guest_email, user_id, shipping_address, tracking_number, tracking_url, order_items(product_name, quantity, unit_price)",
            { count: "exact" }
        )
        .order(sortConfig.column, { ascending: sortConfig.asc })
        .range(offset, offset + PAGE_SIZE - 1);

    if (statusFilter) {
        query = query.eq("status", statusFilter);
    }

    if (fromDate) {
        // Inclusive lower bound at the start of the day
        query = query.gte("created_at", `${fromDate}T00:00:00`);
    }
    if (toDate) {
        // Inclusive upper bound at the end of the day
        query = query.lte("created_at", `${toDate}T23:59:59.999`);
    }

    if (searchTerm) {
        // Search across order ID (first 8 chars), guest email, and shipping name.
        // PostgREST `.or()` takes a comma-separated list of filter expressions.
        const sanitised = searchTerm.replace(/[(),]/g, "").trim();
        if (sanitised) {
            // shipping_address is jsonb; ilike against the ->fullName extraction.
            query = query.or(
                [
                    `id.ilike.${sanitised}%`,
                    `guest_email.ilike.%${sanitised}%`,
                    `shipping_address->>fullName.ilike.%${sanitised}%`,
                ].join(",")
            );
        }
    }

    const { data: orders, error, count } = await query;

    if (error) {
        return (
            <div>
                <div className="mb-10">
                    <h1 className="font-display text-5xl text-ink mb-2">Orders</h1>
                    <p className="text-rose">Failed to load orders: {error.message}</p>
                </div>
            </div>
        );
    }

    const rows = (orders as OrderRow[] | null) ?? [];
    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    // Filter state without page param — used when changing filters resets to page 1
    const filterParams = {
        status: statusFilter,
        q: searchTerm,
        sort: sortKey,
        from: fromDate,
        to: toDate,
    };

    const hasActiveFilters =
        statusFilter || searchTerm || fromDate || toDate || sortKey !== "newest";

    return (
        <div>
            <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
                <div>
                    <h1 className="font-display text-5xl text-ink mb-2">Orders</h1>
                    <p className="text-ink-mute">
                        {total === 0
                            ? "No orders match these filters."
                            : `${total} order${total === 1 ? "" : "s"}${hasActiveFilters ? " (filtered)" : ""}`}
                    </p>
                </div>
                {hasActiveFilters && (
                    <Link
                        href="/admin/orders"
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-ink-soft bg-cream-soft border border-cream-deep rounded-full hover:bg-cream-deep transition-colors"
                    >
                        <X size={14} />
                        Clear filters
                    </Link>
                )}
            </div>

            {/* Filter form — server-side, GET submission. Goes back to page 1 on submit. */}
            <form method="GET" action="/admin/orders" className="mb-6 bg-cream-soft border border-cream-deep rounded-2xl p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    {/* Search */}
                    <div className="md:col-span-5">
                        <label htmlFor="q" className="block text-xs font-semibold uppercase tracking-wider text-ink-mute mb-1.5">
                            Search
                        </label>
                        <div className="relative">
                            <Search
                                size={14}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute pointer-events-none"
                            />
                            <input
                                id="q"
                                type="search"
                                name="q"
                                defaultValue={searchTerm}
                                placeholder="Order ID, email, or customer name"
                                className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-cream-deep rounded-full focus:outline-none focus:border-accent text-ink placeholder:text-ink-mute"
                            />
                        </div>
                    </div>

                    {/* Sort */}
                    <div className="md:col-span-3">
                        <label htmlFor="sort" className="block text-xs font-semibold uppercase tracking-wider text-ink-mute mb-1.5">
                            Sort by
                        </label>
                        <select
                            id="sort"
                            name="sort"
                            defaultValue={sortKey}
                            className="w-full px-3 py-2.5 text-sm bg-white border border-cream-deep rounded-full focus:outline-none focus:border-accent text-ink"
                        >
                            {SORT_OPTIONS.map((s) => (
                                <option key={s.value} value={s.value}>
                                    {s.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date range */}
                    <div className="md:col-span-2">
                        <label htmlFor="from" className="block text-xs font-semibold uppercase tracking-wider text-ink-mute mb-1.5">
                            From
                        </label>
                        <input
                            id="from"
                            type="date"
                            name="from"
                            defaultValue={fromDate}
                            className="w-full px-3 py-2.5 text-sm bg-white border border-cream-deep rounded-full focus:outline-none focus:border-accent text-ink"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="to" className="block text-xs font-semibold uppercase tracking-wider text-ink-mute mb-1.5">
                            To
                        </label>
                        <input
                            id="to"
                            type="date"
                            name="to"
                            defaultValue={toDate}
                            className="w-full px-3 py-2.5 text-sm bg-white border border-cream-deep rounded-full focus:outline-none focus:border-accent text-ink"
                        />
                    </div>
                </div>
                {/* Keep status param when other filters change */}
                {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="px-5 py-2 text-xs font-semibold text-white bg-[var(--gajju-teal-deep)] rounded-full hover:opacity-90 transition-opacity"
                    >
                        Apply
                    </button>
                </div>
            </form>

            {/* Status filter tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                {STATUS_FILTERS.map((f) => {
                    const active = statusFilter === f.value;
                    return (
                        <Link
                            key={f.value || "all"}
                            href={buildHref("/admin/orders", { ...filterParams, status: f.value, page: undefined })}
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

            {/* Results table */}
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
                                            <p className="font-medium text-ink truncate max-w-[180px]">{customer}</p>
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
                                        {hasActiveFilters
                                            ? "No orders match these filters."
                                            : "No orders yet."}
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                    <p className="text-xs text-ink-mute">
                        Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
                    </p>
                    <div className="flex items-center gap-2">
                        <Link
                            href={
                                page > 1
                                    ? buildHref("/admin/orders", { ...filterParams, page: String(page - 1) })
                                    : "#"
                            }
                            aria-disabled={page <= 1}
                            className={`inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-full border transition-colors ${
                                page <= 1
                                    ? "border-cream-deep text-ink-mute opacity-50 pointer-events-none"
                                    : "border-cream-deep text-ink-soft hover:border-ink-mute"
                            }`}
                        >
                            <ChevronLeft size={14} />
                            Previous
                        </Link>
                        <span className="text-xs text-ink-soft px-2">
                            Page {page} of {totalPages}
                        </span>
                        <Link
                            href={
                                page < totalPages
                                    ? buildHref("/admin/orders", { ...filterParams, page: String(page + 1) })
                                    : "#"
                            }
                            aria-disabled={page >= totalPages}
                            className={`inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-full border transition-colors ${
                                page >= totalPages
                                    ? "border-cream-deep text-ink-mute opacity-50 pointer-events-none"
                                    : "border-cream-deep text-ink-soft hover:border-ink-mute"
                            }`}
                        >
                            Next
                            <ChevronRight size={14} />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
