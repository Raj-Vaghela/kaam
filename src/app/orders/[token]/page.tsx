import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Package, MapPin, Receipt, ArrowLeft, CheckCircle, Clock, Truck, XCircle } from "lucide-react";

interface Props {
    params: { token: string };
}

const statusConfig: Record<string, { icon: any; tone: string; label: string }> = {
    pending: { icon: Clock, tone: "bg-haldi-soft text-haldi", label: "Pending Payment" },
    paid: { icon: CheckCircle, tone: "bg-leaf-soft text-leaf", label: "Order Confirmed" },
    processing: { icon: Package, tone: "bg-accent-soft text-accent", label: "Processing" },
    shipped: { icon: Truck, tone: "bg-[var(--gajju-teal-soft)] text-[var(--gajju-teal-deep)]", label: "Shipped" },
    delivered: { icon: CheckCircle, tone: "bg-leaf-soft text-leaf", label: "Delivered" },
    cancelled: { icon: XCircle, tone: "bg-red-100 text-rose", label: "Cancelled" },
};

export default async function OrderTrackingPage({ params }: Props) {
    const { token } = params;
    const supabase = await createClient();

    const { data: order, error } = await supabase
        .from("orders")
        .select(`*, order_items (*), invoices (*)`)
        .eq("guest_token", token)
        .single();

    if (error || !order) notFound();

    const status = statusConfig[order.status] || statusConfig.pending;
    const StatusIcon = status.icon;

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Link href="/" className="inline-flex items-center gap-2 text-ink-mute hover:text-accent text-sm font-medium mb-8">
                <ArrowLeft size={16} /> Back to {`{shop}`.replace("{shop}", "GajjuExpress")}
            </Link>

            <div className="mb-8">
                <p className="text-xs font-semibold tracking-widest uppercase text-accent mb-2">Tracking</p>
                <h1 className="font-display text-5xl text-ink">Your order</h1>
            </div>

            <div className="bg-cream-soft border border-cream-deep rounded-3xl overflow-hidden">
                <div className="px-8 py-6 border-b border-cream-deep flex items-center justify-between flex-wrap gap-4 bg-white">
                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-ink-mute">Order ID</p>
                        <p className="font-display text-2xl text-ink">#{order.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${status.tone}`}>
                        <StatusIcon size={16} />
                        <span className="text-sm font-semibold">{status.label}</span>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    <div>
                        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-mute mb-3">
                            <MapPin size={14} className="text-accent" /> Delivery address
                        </h2>
                        <address className="not-italic text-ink leading-relaxed">
                            <strong>{order.shipping_address?.fullName}</strong><br />
                            {order.shipping_address?.addressLine1}<br />
                            {order.shipping_address?.addressLine2 && <>{order.shipping_address.addressLine2}<br /></>}
                            {order.shipping_address?.city}, {order.shipping_address?.postcode}
                        </address>
                    </div>

                    <div>
                        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-mute mb-3">
                            <Package size={14} className="text-accent" /> Items
                        </h2>
                        <ul className="divide-y divide-cream-deep">
                            {order.order_items.map((item: any) => (
                                <li key={item.id} className="flex justify-between items-center py-3">
                                    <div>
                                        <p className="font-medium text-ink">{item.product_name}</p>
                                        <p className="text-xs text-ink-mute">Qty: {item.quantity}</p>
                                    </div>
                                    <p className="font-semibold text-ink">
                                        £{(item.unit_price * item.quantity).toFixed(2)}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="border-t border-cream-deep pt-5 flex justify-between font-display text-2xl text-ink">
                        <span>Total</span>
                        <span className="text-accent">£{Number(order.total).toFixed(2)}</span>
                    </div>

                    {order.invoices && order.invoices.length > 0 && (
                        <div className="bg-white rounded-2xl p-5 flex items-center justify-between border border-cream-deep">
                            <div className="flex items-center gap-3">
                                <Receipt size={22} className="text-accent" />
                                <div>
                                    <p className="font-medium text-ink">Invoice</p>
                                    <p className="text-xs text-ink-mute">{order.invoices[0].invoice_number}</p>
                                </div>
                            </div>
                            {order.invoices[0].pdf_url && (
                                <a href={order.invoices[0].pdf_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-accent hover:text-accent-deep">
                                    Download PDF
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-10 bg-[var(--gajju-teal-deep)] text-cream rounded-3xl p-8 text-center">
                <h2 className="font-display text-2xl mb-2">Track every order in one place</h2>
                <p className="text-sm text-cream/70 mb-5">Create a free account to view past orders, save addresses, and re-order in seconds.</p>
                <Link href={`/orders/${token}/create-account`} className="inline-block bg-accent hover:bg-[var(--gajju-terracotta-deep)] text-white px-7 py-3 rounded-full font-semibold text-sm transition-colors">
                    Create my account
                </Link>
            </div>
        </div>
    );
}
