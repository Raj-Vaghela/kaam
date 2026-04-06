import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { User, Package, MapPin, LogOut } from "lucide-react";

export default async function AccountPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth?redirect=/account");
    }

    // Get user profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    // Get recent orders
    const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-serif font-bold text-slate-900 mb-8">
                My Account
            </h1>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Sidebar */}
                <div className="space-y-2">
                    <Link
                        href="/account"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-50 text-emerald-700 font-medium"
                    >
                        <User size={20} />
                        Profile
                    </Link>
                    <Link
                        href="/account/orders"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        <Package size={20} />
                        Orders
                    </Link>
                    <Link
                        href="/auth/signout"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <LogOut size={20} />
                        Sign Out
                    </Link>
                </div>

                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    {/* Profile Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">
                            Profile Information
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-500 mb-1">Email</label>
                                <p className="font-medium text-slate-900">{user.email}</p>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-500 mb-1">
                                    Full Name
                                </label>
                                <p className="font-medium text-slate-900">
                                    {profile?.full_name || "Not set"}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-500 mb-1">Phone</label>
                                <p className="font-medium text-slate-900">
                                    {profile?.phone || "Not set"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Address Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <MapPin size={20} className="text-emerald-600" />
                            Saved Address
                        </h2>
                        {profile?.address_line1 ? (
                            <div className="text-slate-700">
                                <p>{profile.address_line1}</p>
                                {profile.address_line2 && <p>{profile.address_line2}</p>}
                                <p>
                                    {profile.city}, {profile.postcode}
                                </p>
                            </div>
                        ) : (
                            <p className="text-slate-500">No address saved yet.</p>
                        )}
                    </div>

                    {/* Recent Orders */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-slate-900">Recent Orders</h2>
                            <Link
                                href="/account/orders"
                                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                                View All
                            </Link>
                        </div>
                        {orders && orders.length > 0 ? (
                            <div className="space-y-3">
                                {orders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                                    >
                                        <div>
                                            <p className="font-medium text-slate-900">
                                                Order #{order.id.slice(-8).toUpperCase()}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-slate-900">
                                                £{Number(order.total).toFixed(2)}
                                            </p>
                                            <span
                                                className={`text-xs px-2 py-1 rounded-full ${order.status === "paid"
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : order.status === "pending"
                                                            ? "bg-amber-100 text-amber-700"
                                                            : "bg-slate-100 text-slate-600"
                                                    }`}
                                            >
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500">No orders yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
