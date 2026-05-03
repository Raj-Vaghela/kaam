import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Package, Truck, MapPin, User, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getStatusConfig } from "@/lib/order-status";
import { calculateVAT } from "@/lib/invoice";
import { updateOrderStatus, updateOrderTracking, processRefund, rejectReturn } from "../actions";

const ALL_STATUSES = [
    { value: "pending", label: "Pending" },
    { value: "payment_failed", label: "Payment Failed" },
    { value: "payment_received", label: "Payment Received" },
    { value: "paid", label: "Paid" },
    { value: "processing", label: "Processing" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
];

function formatGBP(n: number): string {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

interface ShippingAddress {
    fullName?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    postcode?: string;
    country?: string;
}

interface OrderItemRow {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
}

interface OrderRow {
    id: string;
    status: string | null;
    total: number | null;
    created_at: string;
    guest_email: string | null;
    user_id: string | null;
    shipping_address: ShippingAddress | null;
    billing_address: ShippingAddress | null;
    tracking_number: string | null;
    tracking_url: string | null;
    invoice_id: string | null;
    stripe_session_id: string | null;
    order_items: OrderItemRow[];
}

interface ReturnRequest {
    id: string;
    reason: string;
    status: string;
    admin_notes: string | null;
    stripe_refund_id: string | null;
    refund_amount: number | null;
    created_at: string;
}

export default async function AdminOrderDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const supabase = await createClient();
    const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", id)
        .single();

    if (error || !data) notFound();

    const order = data as OrderRow;
    const statusCfg = getStatusConfig(order.status ?? "");
    const items = order.order_items ?? [];

    // Fetch any return request for this order
    const { data: returnData } = await supabase
        .from("return_requests")
        .select("id, reason, status, admin_notes, stripe_refund_id, refund_amount, created_at")
        .eq("order_id", id)
        .maybeSingle();
    const returnRequest = returnData as ReturnRequest | null;

    // Compute totals
    const subtotal = items.reduce((sum, i) => sum + Number(i.unit_price) * i.quantity, 0);
    const freeDeliveryThreshold = 40;
    const deliveryFee = subtotal >= freeDeliveryThreshold ? 0 : 3.99;
    const { vatAmount } = calculateVAT(subtotal + deliveryFee);

    const addr = order.shipping_address;
    const customer = order.guest_email ?? (order.user_id ? "Account holder" : "Guest");

    return (
        <div>
            {/* Header */}
            <div className="mb-8 flex items-start gap-4">
                <Link
                    href="/admin/orders"
                    className="mt-1 p-2 rounded-2xl bg-cream-soft border border-cream-deep hover:border-accent text-ink-mute hover:text-accent transition-colors"
                >
                    <ArrowLeft size={18} />
                </Link>
                <div>
                    <h1 className="font-display text-5xl text-ink mb-1">
                        Order #{order.id.slice(0, 8).toUpperCase()}
                    </h1>
                    <div className="flex items-center gap-3">
                        <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.text}`}
                        >
                            {statusCfg.label}
                        </span>
                        <span className="text-sm text-ink-mute">
                            {new Date(order.created_at).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                            })}
                            {" · "}
                            {new Date(order.created_at).toLocaleTimeString("en-GB", {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column — items + totals */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order items */}
                    <div className="bg-cream-soft border border-cream-deep rounded-3xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-cream-deep flex items-center gap-2">
                            <Package size={16} className="text-accent" />
                            <h2 className="font-semibold text-ink text-sm uppercase tracking-wide">Items</h2>
                        </div>
                        <table className="w-full text-sm">
                            <thead className="bg-cream text-ink-mute text-xs font-semibold uppercase tracking-wider">
                                <tr>
                                    <th className="text-left px-6 py-3">Product</th>
                                    <th className="text-center px-4 py-3">Qty</th>
                                    <th className="text-right px-4 py-3">Unit</th>
                                    <th className="text-right px-6 py-3">Line</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-cream-deep">
                                {items.map((item) => (
                                    <tr key={item.id} className="hover:bg-cream/60 transition-colors">
                                        <td className="px-6 py-4 font-medium text-ink">{item.product_name}</td>
                                        <td className="px-4 py-4 text-center text-ink-mute">{item.quantity}</td>
                                        <td className="px-4 py-4 text-right text-ink-mute">
                                            {formatGBP(Number(item.unit_price))}
                                        </td>
                                        <td className="px-6 py-4 text-right font-semibold text-ink">
                                            {formatGBP(Number(item.unit_price) * item.quantity)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Totals */}
                        <div className="px-6 py-5 bg-cream border-t border-cream-deep space-y-2 text-sm">
                            <div className="flex justify-between text-ink-mute">
                                <span>Subtotal</span>
                                <span>{formatGBP(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-ink-mute">
                                <span>Delivery</span>
                                <span>{deliveryFee === 0 ? "Free" : formatGBP(deliveryFee)}</span>
                            </div>
                            <div className="flex justify-between text-ink-mute">
                                <span>VAT (incl.)</span>
                                <span>{formatGBP(vatAmount)}</span>
                            </div>
                            <div className="flex justify-between font-display text-xl text-ink pt-2 border-t border-cream-deep">
                                <span>Total</span>
                                <span className="text-accent">{formatGBP(Number(order.total) || 0)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Status management */}
                    <div className="bg-cream-soft border border-cream-deep rounded-3xl p-6">
                        <h2 className="font-semibold text-ink text-sm uppercase tracking-wide mb-4">
                            Update Status
                        </h2>
                        <form action={updateOrderStatus} className="flex items-center gap-3">
                            <input type="hidden" name="orderId" value={order.id} />
                            <select
                                name="status"
                                defaultValue={order.status ?? "pending"}
                                className="flex-1 px-4 py-2.5 text-sm bg-cream border border-cream-deep rounded-full focus:outline-none focus:border-accent text-ink"
                            >
                                {ALL_STATUSES.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="submit"
                                className="px-5 py-2.5 text-sm font-semibold text-white bg-[var(--gajju-teal-deep)] rounded-full hover:opacity-90 transition-opacity"
                            >
                                Update Status
                            </button>
                        </form>
                    </div>

                    {/* Tracking */}
                    <div className="bg-cream-soft border border-cream-deep rounded-3xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Truck size={16} className="text-accent" />
                            <h2 className="font-semibold text-ink text-sm uppercase tracking-wide">Tracking</h2>
                        </div>
                        <form action={updateOrderTracking} className="space-y-3">
                            <input type="hidden" name="orderId" value={order.id} />
                            <div>
                                <label className="block text-xs font-semibold text-ink-mute uppercase tracking-wide mb-1.5">
                                    Tracking Number
                                </label>
                                <input
                                    type="text"
                                    name="trackingNumber"
                                    defaultValue={order.tracking_number ?? ""}
                                    placeholder="e.g. JD123456789GB"
                                    className="w-full px-4 py-2.5 text-sm bg-cream border border-cream-deep rounded-2xl focus:outline-none focus:border-accent text-ink font-mono placeholder:font-sans placeholder:text-ink-mute"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-ink-mute uppercase tracking-wide mb-1.5">
                                    Tracking URL
                                </label>
                                <input
                                    type="url"
                                    name="trackingUrl"
                                    defaultValue={order.tracking_url ?? ""}
                                    placeholder="https://track.royalmail.com/..."
                                    className="w-full px-4 py-2.5 text-sm bg-cream border border-cream-deep rounded-2xl focus:outline-none focus:border-accent text-ink placeholder:text-ink-mute"
                                />
                            </div>
                            <div className="flex justify-end pt-1">
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 text-sm font-semibold text-accent bg-accent-soft rounded-full hover:bg-accent hover:text-white transition-colors"
                                >
                                    Save Tracking
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Returns */}
                    {returnRequest && (
                        <div className="bg-cream-soft border border-cream-deep rounded-3xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <RotateCcw size={16} className="text-accent" />
                                <h2 className="font-semibold text-ink text-sm uppercase tracking-wide">Return Request</h2>
                                <span className={`ml-auto text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide ${
                                    returnRequest.status === "pending"
                                        ? "bg-amber-100 text-amber-800"
                                        : returnRequest.status === "refunded"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : returnRequest.status === "approved"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-rose-100 text-rose-800"
                                }`}>
                                    {returnRequest.status}
                                </span>
                            </div>

                            <div className="mb-4">
                                <p className="text-xs font-semibold text-ink-mute uppercase tracking-wide mb-1">
                                    Reason
                                </p>
                                <p className="text-sm text-ink">{returnRequest.reason}</p>
                            </div>

                            <p className="text-xs text-ink-mute mb-4">
                                Requested{" "}
                                {new Date(returnRequest.created_at).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                })}
                            </p>

                            {returnRequest.status === "pending" && (
                                <div className="flex items-center gap-3">
                                    <form action={processRefund}>
                                        <input type="hidden" name="returnRequestId" value={returnRequest.id} />
                                        <input type="hidden" name="orderId" value={order.id} />
                                        <button
                                            type="submit"
                                            className="px-5 py-2.5 text-sm font-semibold text-white bg-[var(--gajju-teal-deep)] rounded-full hover:opacity-90 transition-opacity"
                                        >
                                            Approve &amp; Refund
                                        </button>
                                    </form>
                                    <form action={rejectReturn}>
                                        <input type="hidden" name="returnRequestId" value={returnRequest.id} />
                                        <input type="hidden" name="orderId" value={order.id} />
                                        <button
                                            type="submit"
                                            className="px-5 py-2.5 text-sm font-semibold text-rose-700 bg-rose-50 rounded-full hover:bg-rose-100 transition-colors"
                                        >
                                            Reject
                                        </button>
                                    </form>
                                </div>
                            )}

                            {returnRequest.status === "refunded" && returnRequest.refund_amount && (
                                <p className="text-sm text-emerald-700 font-medium">
                                    Refunded {formatGBP(Number(returnRequest.refund_amount))}
                                    {returnRequest.stripe_refund_id && (
                                        <span className="text-xs text-ink-mute ml-2 font-normal font-mono">
                                            ({returnRequest.stripe_refund_id})
                                        </span>
                                    )}
                                </p>
                            )}

                            {returnRequest.admin_notes && (
                                <div className="mt-3 pt-3 border-t border-cream-deep">
                                    <p className="text-xs font-semibold text-ink-mute uppercase tracking-wide mb-1">Admin Notes</p>
                                    <p className="text-sm text-ink">{returnRequest.admin_notes}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right column — customer + meta */}
                <div className="space-y-6">
                    {/* Customer */}
                    <div className="bg-cream-soft border border-cream-deep rounded-3xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <User size={16} className="text-accent" />
                            <h2 className="font-semibold text-ink text-sm uppercase tracking-wide">Customer</h2>
                        </div>
                        <p className="text-sm font-semibold text-ink mb-0.5">{customer}</p>
                        {order.user_id && (
                            <p className="text-xs text-ink-mute">Registered account</p>
                        )}
                    </div>

                    {/* Shipping address */}
                    {addr && Object.keys(addr).length > 0 && (
                        <div className="bg-cream-soft border border-cream-deep rounded-3xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <MapPin size={16} className="text-accent" />
                                <h2 className="font-semibold text-ink text-sm uppercase tracking-wide">
                                    Shipping Address
                                </h2>
                            </div>
                            <address className="not-italic text-sm text-ink space-y-0.5">
                                {addr.fullName && <p className="font-semibold">{addr.fullName}</p>}
                                {addr.phone && <p className="text-ink-mute text-xs">{addr.phone}</p>}
                                {addr.addressLine1 && <p>{addr.addressLine1}</p>}
                                {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                                {(addr.city || addr.postcode) && (
                                    <p>
                                        {[addr.city, addr.postcode].filter(Boolean).join(", ")}
                                    </p>
                                )}
                                {addr.country && (
                                    <p className="text-ink-mute text-xs">{addr.country}</p>
                                )}
                            </address>
                        </div>
                    )}

                    {/* Tracking summary (read-only) */}
                    {order.tracking_number && (
                        <div className="bg-cream-soft border border-cream-deep rounded-3xl p-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Truck size={16} className="text-accent" />
                                <h2 className="font-semibold text-ink text-sm uppercase tracking-wide">
                                    Tracking Info
                                </h2>
                            </div>
                            <p className="text-xs text-ink-mute mb-1">Tracking number</p>
                            {order.tracking_url ? (
                                <a
                                    href={order.tracking_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-mono text-accent hover:underline"
                                >
                                    {order.tracking_number}
                                </a>
                            ) : (
                                <p className="text-sm font-mono text-ink">{order.tracking_number}</p>
                            )}
                        </div>
                    )}

                    {/* Invoice link */}
                    {order.invoice_id && (
                        <div className="bg-cream-soft border border-cream-deep rounded-3xl p-6">
                            <div className="flex items-center gap-2 mb-3">
                                <FileText size={16} className="text-accent" />
                                <h2 className="font-semibold text-ink text-sm uppercase tracking-wide">Invoice</h2>
                            </div>
                            <Link
                                href="/admin/invoices"
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
                            >
                                <FileText size={14} />
                                View invoice
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
