import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { User, Package, MapPin, LogOut, Download, Trash2 } from "lucide-react";

export default async function AccountPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth?redirect=/account");

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-10">
                <p className="text-xs font-semibold tracking-widest uppercase text-accent mb-2">
                    Welcome back
                </p>
                <h1 className="font-display text-5xl text-ink">My account</h1>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
                {/* Sidebar */}
                <nav className="md:col-span-1 space-y-1">
                    <Link href="/account" className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-accent-soft text-accent-deep font-semibold">
                        <User size={18} /> Profile
                    </Link>
                    <Link href="/account/orders" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-ink-soft hover:bg-cream-soft transition-colors">
                        <Package size={18} /> Orders
                    </Link>
                    <Link href="/auth/signout" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-rose hover:bg-cream-soft transition-colors">
                        <LogOut size={18} /> Sign Out
                    </Link>
                </nav>

                {/* Main */}
                <div className="md:col-span-3 space-y-6">
                    <div className="bg-cream-soft border border-cream-deep rounded-3xl p-8">
                        <h2 className="font-display text-2xl text-ink mb-5">Profile</h2>
                        <dl className="space-y-4">
                            <div>
                                <dt className="text-xs uppercase tracking-wider text-ink-mute mb-1">Email</dt>
                                <dd className="text-ink font-medium">{user.email}</dd>
                            </div>
                            <div>
                                <dt className="text-xs uppercase tracking-wider text-ink-mute mb-1">Full name</dt>
                                <dd className="text-ink font-medium">{profile?.full_name || "Not set"}</dd>
                            </div>
                            <div>
                                <dt className="text-xs uppercase tracking-wider text-ink-mute mb-1">Phone</dt>
                                <dd className="text-ink font-medium">{profile?.phone || "Not set"}</dd>
                            </div>
                        </dl>
                    </div>

                    <div className="bg-cream-soft border border-cream-deep rounded-3xl p-8">
                        <h2 className="font-display text-2xl text-ink mb-5 flex items-center gap-2">
                            <MapPin size={20} className="text-accent" /> Saved address
                        </h2>
                        {profile?.address_line1 ? (
                            <address className="not-italic text-ink leading-relaxed">
                                {profile.address_line1}<br />
                                {profile.address_line2 && <>{profile.address_line2}<br /></>}
                                {profile.city}, {profile.postcode}
                            </address>
                        ) : (
                            <p className="text-ink-mute">No address saved yet.</p>
                        )}
                    </div>

                    <div className="bg-cream-soft border border-cream-deep rounded-3xl p-8">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="font-display text-2xl text-ink">Recent orders</h2>
                            <Link href="/account/orders" className="text-sm font-semibold text-accent hover:text-accent-deep">
                                View all →
                            </Link>
                        </div>
                        {orders && orders.length > 0 ? (
                            <ul className="divide-y divide-cream-deep">
                                {orders.map((order) => (
                                    <li key={order.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                                        <div>
                                            <p className="font-display text-lg text-ink">
                                                #{order.id.slice(-8).toUpperCase()}
                                            </p>
                                            <p className="text-xs text-ink-mute">
                                                {new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-display text-lg text-ink">£{Number(order.total).toFixed(2)}</p>
                                            <span className={`inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold ${
                                                order.status === "paid" ? "bg-leaf-soft text-leaf" :
                                                order.status === "pending" ? "bg-haldi-soft text-haldi" :
                                                "bg-cream-deep text-ink-mute"
                                            }`}>{order.status}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-ink-mute">No orders yet.</p>
                        )}
                    </div>

                    {/* GDPR: Data Rights */}
                    <div className="bg-cream-soft border border-cream-deep rounded-3xl p-8">
                        <h2 className="font-display text-2xl text-ink mb-5">Your data</h2>
                        <div className="space-y-3">
                            <a
                                href="/api/account/export"
                                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-ink-soft hover:bg-cream transition-colors"
                            >
                                <Download size={18} className="text-accent" />
                                <div>
                                    <p className="font-medium text-sm text-ink">Download my data</p>
                                    <p className="text-xs text-ink-mute">Get a copy of everything we hold about you</p>
                                </div>
                            </a>
                            <Link
                                href="/account/delete"
                                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-ink-soft hover:bg-red-50 transition-colors"
                            >
                                <Trash2 size={18} className="text-rose" />
                                <div>
                                    <p className="font-medium text-sm text-rose">Delete my account</p>
                                    <p className="text-xs text-ink-mute">Permanently remove your account and anonymise order history</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
