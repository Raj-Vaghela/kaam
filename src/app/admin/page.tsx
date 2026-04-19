import Link from "next/link";
import { TrendingUp, ShoppingBag, Package, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

interface OrderRow {
    id: string;
    total: number | null;
    status: string | null;
    created_at: string;
    guest_email: string | null;
    user_id: string | null;
}

function formatGBP(n: number): string {
    return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
    }).format(n);
}

function timeAgo(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} min${min === 1 ? "" : "s"} ago`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default async function AdminDashboard() {
    const supabase = await createClient();

    // Run queries in parallel
    const [paidOrdersRes, activeOrdersRes, productsCountRes, recentOrdersRes] = await Promise.all([
        supabase
            .from("orders")
            .select("total")
            .in("status", ["paid", "fulfilled", "shipped", "delivered"]),
        supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .in("status", ["paid", "processing", "pending"]),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase
            .from("orders")
            .select("id, total, status, created_at, guest_email, user_id")
            .order("created_at", { ascending: false })
            .limit(5),
    ]);

    const paidOrders = (paidOrdersRes.data as { total: number | null }[] | null) ?? [];
    const totalSales = paidOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const activeOrders = activeOrdersRes.count ?? 0;
    const productsCount = productsCountRes.count ?? 0;
    const recentOrders = (recentOrdersRes.data as OrderRow[] | null) ?? [];

    const stats = [
        {
            label: "Total Sales",
            value: formatGBP(totalSales),
            note: `${paidOrders.length} paid order${paidOrders.length === 1 ? "" : "s"}`,
            tone: "leaf",
        },
        {
            label: "Active Orders",
            value: String(activeOrders),
            note: "Awaiting fulfillment",
            tone: "haldi",
        },
        {
            label: "Total Products",
            value: String(productsCount),
            note: "In catalogue",
            tone: "ink-mute",
        },
    ];

    const toneClass: Record<string, string> = {
        leaf: "text-leaf",
        haldi: "text-haldi",
        "ink-mute": "text-ink-mute",
    };

    return (
        <div>
            <div className="mb-10">
                <h1 className="font-display text-5xl text-ink mb-2">Dashboard</h1>
                <p className="text-ink-mute">A quick look at the shop today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {stats.map((s) => (
                    <div key={s.label} className="bg-cream-soft border border-cream-deep rounded-3xl p-7">
                        <h3 className="text-ink-mute text-xs font-semibold uppercase tracking-wider mb-3">{s.label}</h3>
                        <p className="font-display text-4xl text-ink mb-2">{s.value}</p>
                        <span className="text-xs text-ink-mute flex items-center gap-1">
                            <TrendingUp size={12} className={toneClass[s.tone] || "text-ink-mute"} /> {s.note}
                        </span>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Link
                    href="/admin/products/new"
                    className="group bg-cream-soft border border-cream-deep rounded-3xl p-5 hover:border-accent transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-accent-soft flex items-center justify-center text-accent">
                            <Package size={18} />
                        </div>
                        <div>
                            <p className="font-semibold text-ink text-sm">Add a product</p>
                            <p className="text-xs text-ink-mute">Grow the catalogue</p>
                        </div>
                    </div>
                </Link>
                <Link
                    href="/admin/invoices"
                    className="group bg-cream-soft border border-cream-deep rounded-3xl p-5 hover:border-accent transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-accent-soft flex items-center justify-center text-accent">
                            <FileText size={18} />
                        </div>
                        <div>
                            <p className="font-semibold text-ink text-sm">Invoices</p>
                            <p className="text-xs text-ink-mute">Receipts & resends</p>
                        </div>
                    </div>
                </Link>
                <Link
                    href="/admin/audit-log"
                    className="group bg-cream-soft border border-cream-deep rounded-3xl p-5 hover:border-accent transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-accent-soft flex items-center justify-center text-accent">
                            <ShoppingBag size={18} />
                        </div>
                        <div>
                            <p className="font-semibold text-ink text-sm">Audit log</p>
                            <p className="text-xs text-ink-mute">Who did what</p>
                        </div>
                    </div>
                </Link>
            </div>

            <div className="bg-cream-soft border border-cream-deep rounded-3xl p-7">
                <h2 className="font-display text-2xl text-ink mb-5">Recent orders</h2>
                {recentOrders.length === 0 ? (
                    <p className="text-ink-mute text-sm py-6 text-center">No orders yet.</p>
                ) : (
                    <div className="space-y-1">
                        {recentOrders.map((o) => (
                            <div
                                key={o.id}
                                className="flex items-center justify-between py-4 border-b border-cream-deep last:border-0"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 rounded-2xl bg-accent-soft flex items-center justify-center text-accent">
                                        <ShoppingBag size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-ink">
                                            Order #{o.id.slice(0, 8).toUpperCase()}
                                            <span className="ml-2 text-xs font-normal text-ink-mute">
                                                {o.status ?? "—"}
                                            </span>
                                        </p>
                                        <p className="text-xs text-ink-mute">
                                            {o.guest_email ?? (o.user_id ? "account" : "guest")} · {timeAgo(o.created_at)}
                                        </p>
                                    </div>
                                </div>
                                <span className="font-display text-lg text-accent">
                                    {formatGBP(Number(o.total) || 0)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
