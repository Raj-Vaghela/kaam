import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Package, MapPin, Receipt, ArrowLeft, CheckCircle, Clock, Truck, XCircle } from "lucide-react";

interface Props {
    params: { token: string };
}

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
    pending: { icon: Clock, color: "text-amber-600 bg-amber-100", label: "Pending Payment" },
    paid: { icon: CheckCircle, color: "text-emerald-600 bg-emerald-100", label: "Order Confirmed" },
    processing: { icon: Package, color: "text-blue-600 bg-blue-100", label: "Processing" },
    shipped: { icon: Truck, color: "text-indigo-600 bg-indigo-100", label: "Shipped" },
    delivered: { icon: CheckCircle, color: "text-emerald-600 bg-emerald-100", label: "Delivered" },
    cancelled: { icon: XCircle, color: "text-red-600 bg-red-100", label: "Cancelled" },
};

export default async function OrderTrackingPage({ params }: Props) {
    const { token } = params;
    const supabase = await createClient();

    // Fetch order by guest token
    const { data: order, error } = await supabase
        .from("orders")
        .select(`
            *,
            order_items (*),
            invoices (*)
        `)
        .eq("guest_token", token)
        .single();

    if (error || !order) {
        notFound();
    }

    const status = statusConfig[order.status] || statusConfig.pending;
    const StatusIcon = status.icon;

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <Link
                href="/"
                className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium mb-8"
            >
                <ArrowLeft size={16} />
                Back to Store
            </Link>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Order Tracking</h1>
                            <p className="text-sm text-slate-500">
                                Order #{order.id.slice(0, 8).toUpperCase()}
                            </p>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${status.color}`}>
                            <StatusIcon size={16} />
                            <span className="text-sm font-medium">{status.label}</span>
                        </div>
                    </div>
                </div>

                {/* Order Details */}
                <div className="p-6 space-y-6">
                    {/* Delivery Address */}
                    <div>
                        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                            <MapPin size={16} className="text-emerald-600" />
                            Delivery Address
                        </h2>
                        <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700">
                            <p className="font-medium">{order.shipping_address?.fullName}</p>
                            <p>{order.shipping_address?.addressLine1}</p>
                            {order.shipping_address?.addressLine2 && (
                                <p>{order.shipping_address.addressLine2}</p>
                            )}
                            <p>
                                {order.shipping_address?.city}, {order.shipping_address?.postcode}
                            </p>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div>
                        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                            <Package size={16} className="text-emerald-600" />
                            Order Items
                        </h2>
                        <div className="space-y-3">
                            {order.order_items.map((item: any) => (
                                <div
                                    key={item.id}
                                    className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0"
                                >
                                    <div>
                                        <p className="font-medium text-slate-900">{item.product_name}</p>
                                        <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                                    </div>
                                    <p className="font-medium text-slate-900">
                                        £{(item.unit_price * item.quantity).toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Total */}
                    <div className="border-t border-slate-200 pt-4">
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total</span>
                            <span className="text-emerald-700">£{order.total.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Invoice Link */}
                    {order.invoices && order.invoices.length > 0 && (
                        <div className="bg-slate-50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Receipt size={20} className="text-emerald-600" />
                                    <div>
                                        <p className="font-medium text-slate-900">Invoice</p>
                                        <p className="text-sm text-slate-500">
                                            {order.invoices[0].invoice_number}
                                        </p>
                                    </div>
                                </div>
                                {order.invoices[0].pdf_url && (
                                    <a
                                        href={order.invoices[0].pdf_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                                    >
                                        Download PDF
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Account CTA */}
            <div className="mt-8 bg-slate-50 rounded-xl border border-slate-200 p-6 text-center">
                <h2 className="font-bold text-slate-900 mb-2">Want to track all your orders?</h2>
                <p className="text-sm text-slate-600 mb-4">
                    Create an account to manage orders, re-order favourites, and get exclusive offers.
                </p>
                <Link
                    href={`/orders/${token}/create-account`}
                    className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                >
                    Create Account
                </Link>
            </div>
        </div>
    );
}
