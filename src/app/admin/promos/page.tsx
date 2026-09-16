import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { createPromo, togglePromo, deletePromo } from "./actions";
import { Tag, Trash2, ToggleLeft, ToggleRight, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPromosPage() {
    await requireAdmin();
    const supabase = await createClient();

    const { data: promos } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });

    return (
        <div>
            <div className="mb-10">
                <h1 className="font-display text-5xl text-ink mb-2">Promo Codes</h1>
                <p className="text-ink-mute">Create and manage discount codes for customers.</p>
            </div>

            {/* Create form */}
            <div className="bg-cream-soft border border-cream-deep rounded-3xl p-8 mb-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-accent-soft flex items-center justify-center">
                        <Plus size={18} className="text-accent" />
                    </div>
                    <h2 className="font-display text-2xl text-ink">New promo code</h2>
                </div>
                <form action={createPromo}>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">Code *</label>
                            <input
                                name="code"
                                required
                                placeholder="SUMMER20"
                                className="w-full px-4 py-3 rounded-2xl border border-cream-deep bg-white focus:outline-none focus:border-accent text-sm uppercase font-semibold tracking-wider"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">Description</label>
                            <input
                                name="description"
                                placeholder="20% off orders over £30"
                                className="w-full px-4 py-3 rounded-2xl border border-cream-deep bg-white focus:outline-none focus:border-accent text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">Type *</label>
                            <select
                                name="discount_type"
                                required
                                className="w-full px-4 py-3 rounded-2xl border border-cream-deep bg-white focus:outline-none focus:border-accent text-sm"
                            >
                                <option value="percent">Percentage (%)</option>
                                <option value="fixed">Fixed amount (£)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">Value *</label>
                            <input
                                name="discount_value"
                                type="number"
                                step="0.01"
                                min="0.01"
                                required
                                placeholder="20"
                                className="w-full px-4 py-3 rounded-2xl border border-cream-deep bg-white focus:outline-none focus:border-accent text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">Min. order (£)</label>
                            <input
                                name="min_order_value"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0"
                                defaultValue="0"
                                className="w-full px-4 py-3 rounded-2xl border border-cream-deep bg-white focus:outline-none focus:border-accent text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">Max uses (blank = unlimited)</label>
                            <input
                                name="max_uses"
                                type="number"
                                min="1"
                                placeholder="∞"
                                className="w-full px-4 py-3 rounded-2xl border border-cream-deep bg-white focus:outline-none focus:border-accent text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">Expires (blank = never)</label>
                            <input
                                name="expires_at"
                                type="datetime-local"
                                className="w-full px-4 py-3 rounded-2xl border border-cream-deep bg-white focus:outline-none focus:border-accent text-sm"
                            />
                        </div>
                    </div>
                    <button type="submit" className="btn-primary mt-6 px-8 py-3 text-sm">
                        Create code
                    </button>
                </form>
            </div>

            {/* Codes table */}
            <div className="bg-cream-soft border border-cream-deep rounded-3xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-cream text-ink-mute text-xs font-semibold uppercase tracking-wider">
                        <tr>
                            <th className="text-left px-6 py-4">Code</th>
                            <th className="text-left px-6 py-4">Discount</th>
                            <th className="text-left px-6 py-4">Min order</th>
                            <th className="text-left px-6 py-4">Uses</th>
                            <th className="text-left px-6 py-4">Expires</th>
                            <th className="text-left px-6 py-4">Status</th>
                            <th className="text-right px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-deep">
                        {promos && promos.length > 0 ? promos.map((p) => (
                            <tr key={p.id} className="hover:bg-cream/60 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Tag size={14} className="text-accent shrink-0" />
                                        <span className="font-semibold text-ink font-mono tracking-wider">{p.code}</span>
                                    </div>
                                    {p.description && <p className="text-xs text-ink-mute mt-0.5">{p.description}</p>}
                                </td>
                                <td className="px-6 py-4 font-semibold text-ink">
                                    {p.discount_type === "percent"
                                        ? `${p.discount_value}% off`
                                        : `£${parseFloat(p.discount_value).toFixed(2)} off`
                                    }
                                </td>
                                <td className="px-6 py-4 text-ink-soft">
                                    {p.min_order_value > 0 ? `£${parseFloat(p.min_order_value).toFixed(2)}` : "—"}
                                </td>
                                <td className="px-6 py-4 text-ink-soft">
                                    {p.uses_count}{p.max_uses ? ` / ${p.max_uses}` : ""}
                                </td>
                                <td className="px-6 py-4 text-ink-soft">
                                    {p.expires_at
                                        ? new Date(p.expires_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                                        : "Never"
                                    }
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${p.active ? "bg-leaf-soft text-leaf" : "bg-cream text-ink-mute"}`}>
                                        {p.active ? "Active" : "Inactive"}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <form action={togglePromo.bind(null, p.id, !p.active)}>
                                            <button type="submit" title={p.active ? "Deactivate" : "Activate"} className="p-2 rounded-xl hover:bg-cream text-ink-mute hover:text-accent transition-colors">
                                                {p.active ? <ToggleRight size={18} className="text-leaf" /> : <ToggleLeft size={18} />}
                                            </button>
                                        </form>
                                        <form action={deletePromo.bind(null, p.id)}>
                                            <button type="submit" title="Delete" className="p-2 rounded-xl hover:bg-red-50 text-ink-mute hover:text-rose transition-colors"
                                                onClick={(e) => { if (!confirm(`Delete code ${p.code}?`)) e.preventDefault(); }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={7} className="px-6 py-16 text-center">
                                    <Tag size={40} className="mx-auto text-cream-deep mb-3" />
                                    <p className="text-ink-mute">No promo codes yet. Create one above.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
