import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { User, Package, LogOut, ArrowLeft, Truck } from "lucide-react";
import { getStatusConfig, type OrderItem } from "@/lib/order-status";
import ReturnRequestButton from "./ReturnRequestButton";

export default async function OrdersPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth?redirect=/account/orders");

    const { data: orders } = await supabase
        .from("orders")
        .select(`*, order_items (*), tracking_number, tracking_url`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Link href="/account" className="inline-flex items-center gap-2 text-ink-mute hover:text-accent text-sm font-medium mb-6">
                <ArrowLeft size={16} /> Back to account
            </Link>

            <div className="mb-10">
                <p className="text-xs font-semibold tracking-widest uppercase text-accent mb-2">
                    Your history
                </p>
                <h1 className="font-display text-5xl text-ink">Orders</h1>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
                <nav className="md:col-span-1 space-y-1">
                    <Link href="/account" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-ink-soft hover:bg-cream-soft transition-colors">
                        <User size={18} /> Profile
                    </Link>
                    <Link href="/account/orders" className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-accent-soft text-accent-deep font-semibold">
                        <Package size={18} /> Orders
                    </Link>
                    <Link href="/auth/signout" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-rose hover:bg-cream-soft transition-colors">
                        <LogOut size={18} /> Sign Out
                    </Link>
                </nav>

                <div className="md:col-span-3 space-y-5">
                    {orders && orders.length > 0 ? (
                        orders.map((order) => (
                            <div key={order.id} className="bg-cream-soft border border-cream-deep rounded-3xl overflow-hidden">
                                <div className="bg-white px-6 py-5 border-b border-cream-deep flex flex-wrap items-center justify-between gap-4">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-ink-mute">Order</p>
                                        <p className="font-display text-xl text-ink">
                                            #{order.id.slice(-8).toUpperCase()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-ink-mute">Date</p>
                                        <p className="font-medium text-ink">
                                            {new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-ink-mute">Total</p>
                                        <p className="font-display text-xl text-accent">£{Number(order.total).toFixed(2)}</p>
                                    </div>
                                    <span className={`text-xs px-3 py-1.5 rounded-full font-semibold uppercase tracking-wider ${getStatusConfig(order.status).bg} ${getStatusConfig(order.status).text}`}>
                                        {getStatusConfig(order.status).label}
                                    </span>
                                </div>

                                <div className="p-6 space-y-3">
                                    {order.order_items?.map((item: OrderItem) => (
                                        <div key={item.id} className="flex items-center justify-between text-sm">
                                            <div>
                                                <p className="font-medium text-ink">{item.product_name}</p>
                                                <p className="text-xs text-ink-mute">Qty: {item.quantity} × £{Number(item.unit_price).toFixed(2)}</p>
                                            </div>
                                            <p className="font-semibold text-ink">
                                                £{(item.quantity * Number(item.unit_price)).toFixed(2)}
                                            </p>
                                        </div>
                                    ))}

                                    {order.shipping_address?.fullName && (
                                        <div className="mt-4 pt-4 border-t border-cream-deep">
                                            <p className="text-[10px] uppercase tracking-wider text-ink-mute mb-1">Delivered to</p>
                                            <p className="text-sm text-ink-soft">
                                                {order.shipping_address.fullName}, {order.shipping_address.addressLine1}
                                                {order.shipping_address.addressLine2 && `, ${order.shipping_address.addressLine2}`}
                                                , {order.shipping_address.city}, {order.shipping_address.postcode}
                                            </p>
                                        </div>
                                    )}

                                    {order.tracking_number && (
                                        <div className="mt-4 pt-4 border-t border-cream-deep flex items-center gap-2 flex-wrap">
                                            <Truck size={14} className="text-emerald-600 shrink-0" />
                                            <span className="text-sm text-ink-soft">
                                                Tracking:{" "}
                                                <span className="font-mono text-ink">{order.tracking_number}</span>
                                            </span>
                                            {order.tracking_url && (
                                                <a
                                                    href={order.tracking_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm font-medium text-accent hover:underline inline-flex items-center gap-1"
                                                >
                                                    Track package →
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {order.status === "delivered" && (
                                        <ReturnRequestButton orderId={order.id} />
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-cream-soft border border-cream-deep rounded-3xl p-12 text-center">
                            <Package size={56} className="mx-auto text-cream-deep mb-5" strokeWidth={1.4} />
                            <h2 className="font-display text-2xl text-ink mb-2">No orders yet</h2>
                            <p className="text-ink-mute mb-6">When you place an order, it&apos;ll show up here.</p>
                            <Link href="/products" className="btn-primary inline-block px-8 py-3.5">
                                Start shopping
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
