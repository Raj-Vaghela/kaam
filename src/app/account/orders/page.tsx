import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { User, Package, LogOut, ArrowLeft } from "lucide-react";

export default async function OrdersPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth?redirect=/account/orders");
    }

    // Get all orders with items
    const { data: orders } = await supabase
        .from("orders")
        .select(`
            *,
            order_items (*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <Link
                href="/account"
                className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium mb-6"
            >
                <ArrowLeft size={16} />
                Back to Account
            </Link>

            <h1 className="text-3xl font-serif font-bold text-slate-900 mb-8">
                My Orders
            </h1>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Sidebar */}
                <div className="space-y-2">
                    <Link
                        href="/account"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        <User size={20} />
                        Profile
                    </Link>
                    <Link
                        href="/account/orders"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-50 text-emerald-700 font-medium"
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

                {/* Orders List */}
                <div className="md:col-span-2 space-y-4">
                    {orders && orders.length > 0 ? (
                        orders.map((order) => (
                            <div
                                key={order.id}
                                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                            >
                                {/* Order Header */}
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm text-slate-500">Order ID</p>
                                        <p className="font-mono font-bold text-slate-900">
                                            #{order.id.slice(-8).toUpperCase()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Date</p>
                                        <p className="font-medium text-slate-900">
                                            {new Date(order.created_at).toLocaleDateString("en-GB", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Total</p>
                                        <p className="font-bold text-emerald-700">
                                            £{Number(order.total).toFixed(2)}
                                        </p>
                                    </div>
                                    <div>
                                        <span
                                            className={`text-sm px-3 py-1 rounded-full font-medium ${order.status === "paid"
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : order.status === "pending"
                                                        ? "bg-amber-100 text-amber-700"
                                                        : order.status === "cancelled"
                                                            ? "bg-red-100 text-red-700"
                                                            : "bg-slate-100 text-slate-600"
                                                }`}
                                        >
                                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                        </span>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="p-6">
                                    <div className="space-y-3">
                                        {order.order_items?.map((item: any) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                                                        <Package size={20} className="text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900">
                                                            {item.product_name}
                                                        </p>
                                                        <p className="text-sm text-slate-500">
                                                            Qty: {item.quantity} × £{Number(item.unit_price).toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="font-bold text-slate-900">
                                                    £{(item.quantity * Number(item.unit_price)).toFixed(2)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Shipping Address */}
                                    {order.shipping_address && (
                                        <div className="mt-4 pt-4 border-t border-slate-100">
                                            <p className="text-sm text-slate-500 mb-1">Shipped to:</p>
                                            <p className="text-sm text-slate-700">
                                                {order.shipping_address.fullName}, {order.shipping_address.addressLine1}
                                                {order.shipping_address.addressLine2 && `, ${order.shipping_address.addressLine2}`}
                                                , {order.shipping_address.city}, {order.shipping_address.postcode}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                            <Package size={48} className="mx-auto text-slate-300 mb-4" />
                            <h2 className="text-lg font-bold text-slate-900 mb-2">No orders yet</h2>
                            <p className="text-slate-500 mb-6">
                                When you place orders, they will appear here.
                            </p>
                            <Link
                                href="/products"
                                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-emerald-700 transition-colors"
                            >
                                Start Shopping
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
