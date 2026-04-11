import { TrendingUp, Package, ShoppingBag } from "lucide-react";

export default function AdminDashboard() {
    const stats = [
        { label: "Total Sales", value: "£12,345.00", note: "+12.5% from last month", tone: "leaf" },
        { label: "Active Orders", value: "24", note: "8 pending shipment", tone: "haldi" },
        { label: "Total Products", value: "65", note: "Across 8 categories", tone: "ink-mute" },
    ];

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
                            <TrendingUp size={12} className="text-leaf" /> {s.note}
                        </span>
                    </div>
                ))}
            </div>

            <div className="bg-cream-soft border border-cream-deep rounded-3xl p-7">
                <h2 className="font-display text-2xl text-ink mb-5">Recent activity</h2>
                <div className="space-y-1">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between py-4 border-b border-cream-deep last:border-0">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-2xl bg-accent-soft flex items-center justify-center text-accent">
                                    <ShoppingBag size={18} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-ink">New Order #102{i}</p>
                                    <p className="text-xs text-ink-mute">2 minutes ago</p>
                                </div>
                            </div>
                            <span className="font-display text-lg text-accent">£45.20</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
