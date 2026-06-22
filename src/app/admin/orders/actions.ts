"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import { createShipment, isShippingConfigured } from "@/lib/shipping";

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
    if (!_stripe) {
        _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: "2026-01-28.clover",
        });
    }
    return _stripe;
}

// Unified result type for all server actions — callers can inspect ok/error for feedback.
export type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string };

const VALID_STATUSES = [
    "pending",
    "payment_failed",
    "payment_received",
    "paid",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
] as const;

type OrderStatus = (typeof VALID_STATUSES)[number];

function isValidStatus(s: unknown): s is OrderStatus {
    return typeof s === "string" && VALID_STATUSES.includes(s as OrderStatus);
}

async function getAdminUser() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { supabase, user: null, authorized: false, isAdmin: false };

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    const isAdmin = profile?.role === "admin";
    const authorized = isAdmin || profile?.role === "staff";
    return { supabase, user, authorized, isAdmin };
}

export async function updateOrderStatus(formData: FormData): Promise<ActionResult> {
    const { supabase, authorized } = await getAdminUser();
    if (!authorized) return { ok: false, error: "Unauthorised" };

    const orderId = formData.get("orderId") as string;
    const newStatus = formData.get("status") as string;

    if (!orderId) return { ok: false, error: "Missing order ID" };
    if (!isValidStatus(newStatus)) return { ok: false, error: `Invalid status: ${newStatus}` };

    const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

    if (error) return { ok: false, error: error.message };

    const { logAdminAction } = await import("@/lib/audit");
    await logAdminAction(supabase, {
        action: "order:status_update",
        resourceType: "order",
        resourceId: orderId,
        metadata: { newStatus },
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { ok: true };
}

export async function updateOrderTracking(formData: FormData): Promise<ActionResult> {
    const { supabase, authorized } = await getAdminUser();
    if (!authorized) return { ok: false, error: "Unauthorised" };

    const orderId = formData.get("orderId") as string;
    const trackingNumber = (formData.get("trackingNumber") as string | null)?.trim() || null;
    const trackingUrl = (formData.get("trackingUrl") as string | null)?.trim() || null;

    if (!orderId) return { ok: false, error: "Missing order ID" };

    const { error } = await supabase
        .from("orders")
        .update({ tracking_number: trackingNumber, tracking_url: trackingUrl })
        .eq("id", orderId);

    if (error) return { ok: false, error: error.message };

    const { logAdminAction } = await import("@/lib/audit");
    await logAdminAction(supabase, {
        action: "order:tracking_update",
        resourceType: "order",
        resourceId: orderId,
        metadata: { trackingNumber, trackingUrl },
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { ok: true };
}

export async function processRefund(formData: FormData): Promise<ActionResult> {
    const returnRequestId = formData.get("returnRequestId") as string;
    const orderId = formData.get("orderId") as string;
    if (!returnRequestId || !orderId) return { ok: false, error: "Missing returnRequestId or orderId" };

    const { supabase, isAdmin } = await getAdminUser();
    // Only admins can process refunds — staff do not have this permission.
    if (!isAdmin) return { ok: false, error: "Refund requires admin role" };

    // Fetch and validate the return request
    const { data: returnRequest, error: rrError } = await supabase
        .from("return_requests")
        .select("id, order_id, status, refund_amount")
        .eq("id", returnRequestId)
        .single();

    if (rrError || !returnRequest) {
        return { ok: false, error: "Return request not found" };
    }
    if (returnRequest.order_id !== orderId) {
        return { ok: false, error: "Return request mismatch or already processed" };
    }
    if (returnRequest.status !== "pending") {
        return { ok: false, error: "Return request is not in pending state" };
    }

    const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("id, total, stripe_session_id, stripe_payment_intent_id, stripe_charge_id")
        .eq("id", orderId)
        .single();

    if (orderError || !order) return { ok: false, error: "Order not found" };

    // Resolve payment intent ID: prefer explicit column, fall back to stripe_session_id
    const piId = order.stripe_payment_intent_id || order.stripe_session_id;
    if (!piId) {
        return { ok: false, error: "Order has no associated Stripe payment intent" };
    }

    // Compute refund amount — use partial if refund_amount < order total.
    const refundAmountGBP = returnRequest.refund_amount ?? order.total;
    const amountPence = Math.round(refundAmountGBP * 100);

    if (amountPence <= 0) {
        return { ok: false, error: "Refund amount must be greater than zero" };
    }

    let stripeRefundId: string;
    try {
        const stripe = getStripe();

        // Resolve the charge ID if not stored directly
        let chargeId = order.stripe_charge_id || undefined;
        if (!chargeId) {
            const pi = await stripe.paymentIntents.retrieve(piId);
            chargeId = (pi.latest_charge as string) || undefined;
        }
        if (!chargeId) {
            return { ok: false, error: "Cannot resolve Stripe charge ID for this order" };
        }

        const refund = await stripe.refunds.create(
            {
                charge: chargeId,
                amount: amountPence,
                reason: "requested_by_customer",
            },
            { idempotencyKey: `refund:${returnRequestId}` }
        );
        stripeRefundId = refund.id;
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Stripe refund failed for returnRequest ${returnRequestId}:`, message);
        return { ok: false, error: `Stripe error: ${message}` };
    }

    // Optimistically set status so admin sees immediate feedback.
    // The order status itself will be updated by the charge.refunded webhook.
    const { error: returnError } = await supabase
        .from("return_requests")
        .update({
            status: "approved_pending_webhook",
            stripe_refund_id: stripeRefundId,
            refund_amount: refundAmountGBP,
            updated_at: new Date().toISOString(),
        })
        .eq("id", returnRequestId);

    if (returnError) {
        console.error("Failed to update return request after refund:", returnError.message);
        // Refund already issued — log but don't fail; the webhook will handle order status.
    }

    const { logAdminAction } = await import("@/lib/audit");
    await logAdminAction(supabase, {
        action: "return:refunded",
        resourceType: "order",
        resourceId: orderId,
        metadata: {
            returnRequestId,
            stripeRefundId,
            refundAmount: refundAmountGBP,
        },
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { ok: true };
}

export async function generateShippingLabel(orderId: string): Promise<ActionResult> {
    if (!isShippingConfigured()) {
        return {
            ok: false,
            error: "Shipping is not configured. Set the SENDCLOUD_* and SENDER_* environment variables.",
        };
    }

    const { supabase, authorized } = await getAdminUser();
    if (!authorized) return { ok: false, error: "Unauthorised" };

    const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("id, label_url, tracking_number, shipping_address, guest_email, user_id, order_items(quantity, products(weight_kg))")
        .eq("id", orderId)
        .single();

    if (orderError || !order) return { ok: false, error: "Order not found" };

    // Idempotency guard: if a label already exists, refuse to create another billed parcel.
    if (order.label_url) {
        return { ok: false, error: "Label already exists for this order. Download it from the label URL." };
    }

    const addr = order.shipping_address as {
        fullName?: string;
        phone?: string;
        addressLine1?: string;
        addressLine2?: string;
        city?: string;
        postcode?: string;
        country?: string;
    } | null;

    if (!addr?.addressLine1 || !addr?.city || !addr?.postcode) {
        return { ok: false, error: "Order is missing a complete shipping address." };
    }

    const totalWeightKg = (
        order.order_items as unknown as Array<{
            quantity: number;
            products: { weight_kg: number | null } | null;
        }>
    ).reduce((sum, item) => sum + (item.products?.weight_kg ?? 0.5) * item.quantity, 0);

    let recipientEmail = order.guest_email ?? "";
    if (!recipientEmail && order.user_id) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", order.user_id)
            .single();
        recipientEmail = (profile as { email?: string } | null)?.email ?? "";
    }

    let shipmentResult: Awaited<ReturnType<typeof createShipment>>;
    try {
        shipmentResult = await createShipment({
            orderId: order.id,
            recipientName: addr.fullName ?? "Customer",
            recipientEmail,
            addressLine1: addr.addressLine1,
            addressLine2: addr.addressLine2 ?? "",
            city: addr.city,
            postcode: addr.postcode,
            country: addr.country ?? "GB",
            phone: addr.phone ?? "",
            weightKg: Math.max(totalWeightKg, 0.1),
        });
    } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "Failed to create Sendcloud shipment." };
    }

    const { parcelId, trackingNumber, trackingUrl } = shipmentResult;

    // Persist tracking data BEFORE attempting storage upload so a retry can
    // re-download the label by parcel ID rather than creating a second billed parcel.
    await supabase
        .from("orders")
        .update({ tracking_number: trackingNumber, tracking_url: trackingUrl })
        .eq("id", orderId);

    // Upload label PDF to private storage
    const { createClient: createServiceClient } = await import("@supabase/supabase-js");
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
        return {
            ok: false,
            error: `Label created at Sendcloud (parcel ${parcelId}) but SUPABASE_SERVICE_ROLE_KEY is not set; storage upload skipped.`,
        };
    }
    const serviceSupabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey
    );

    // Safe path: base-36 encode numeric parcel ID to prevent traversal/collision.
    const safeParcelId = Number(parcelId);
    if (!Number.isInteger(safeParcelId) || safeParcelId <= 0) {
        return { ok: false, error: `Invalid parcel ID returned by Sendcloud: ${parcelId}` };
    }
    const labelPath = `${order.id}/${safeParcelId.toString(36)}.pdf`;

    const { error: uploadError } = await serviceSupabase.storage
        .from("labels")
        .upload(labelPath, shipmentResult.labelPdfBytes, {
            contentType: "application/pdf",
            // No upsert — second upload should fail so admin retries storage-only.
        });

    if (uploadError) {
        return {
            ok: false,
            error: `Label created at Sendcloud (parcel ${parcelId}) but storage upload failed: ${uploadError.message}. Retry storage-only or contact support.`,
        };
    }

    const { error: updateError } = await supabase
        .from("orders")
        .update({
            label_url: labelPath,
            status: "processing",
        })
        .eq("id", orderId);

    if (updateError) return { ok: false, error: "Label created but failed to save label URL to order." };

    const { logAdminAction } = await import("@/lib/audit");
    await logAdminAction(supabase, {
        action: "order:label_generated",
        resourceType: "order",
        resourceId: orderId,
        metadata: { trackingNumber, parcelId },
    });

    revalidatePath(`/admin/orders/${orderId}`);
    return { ok: true };
}

export async function rejectReturn(formData: FormData): Promise<ActionResult> {
    const returnRequestId = formData.get("returnRequestId") as string;
    const orderId = formData.get("orderId") as string;
    if (!returnRequestId || !orderId) return { ok: false, error: "Missing returnRequestId or orderId" };

    const { supabase, authorized } = await getAdminUser();
    if (!authorized) return { ok: false, error: "Unauthorised" };

    const { error } = await supabase
        .from("return_requests")
        .update({
            status: "rejected",
            updated_at: new Date().toISOString(),
        })
        .eq("id", returnRequestId);

    if (error) return { ok: false, error: error.message };

    const { logAdminAction } = await import("@/lib/audit");
    await logAdminAction(supabase, {
        action: "return:rejected",
        resourceType: "order",
        resourceId: orderId,
        metadata: { returnRequestId },
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { ok: true };
}

export async function approveReturn(formData: FormData): Promise<ActionResult> {
    const returnRequestId = formData.get("returnRequestId") as string;
    const orderId = formData.get("orderId") as string;
    if (!returnRequestId || !orderId) return { ok: false, error: "Missing returnRequestId or orderId" };

    const { supabase, authorized } = await getAdminUser();
    if (!authorized) return { ok: false, error: "Unauthorised" };

    const { error } = await supabase
        .from("return_requests")
        .update({
            status: "approved",
            updated_at: new Date().toISOString(),
        })
        .eq("id", returnRequestId);

    if (error) return { ok: false, error: error.message };

    const { logAdminAction } = await import("@/lib/audit");
    await logAdminAction(supabase, {
        action: "return:approved",
        resourceType: "order",
        resourceId: orderId,
        metadata: { returnRequestId },
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { ok: true };
}

/**
 * Regenerate an invoice for an order whose webhook either errored before
 * creating one or where the storage upload failed mid-flight. Mirrors the
 * happy-path of handlePaymentIntentSucceeded() in the Stripe webhook.
 *
 * Safe to call on any paid+ order: short-circuits if an invoice already
 * exists (idempotent via the UNIQUE (order_id) constraint on invoices).
 */
export async function regenerateInvoice(orderId: string): Promise<ActionResult> {
    if (!orderId) return { ok: false, error: "Missing orderId" };

    const { supabase, authorized } = await getAdminUser();
    if (!authorized) return { ok: false, error: "Unauthorised" };

    // Lazy-import the heavy modules so they're not pulled into other actions.
    const { generateInvoiceNumber, storeConfig, calculateVAT } = await import("@/lib/invoice");
    const { generateInvoicePDF, getInvoiceFilename } = await import("@/lib/pdf");

    // 1. Fetch order with line items.
    const { data: order, error: fetchError } = await supabase
        .from("orders")
        .select(
            "id, status, guest_email, shipping_address, billing_address, invoice_id, order_items (product_name, quantity, unit_price)"
        )
        .eq("id", orderId)
        .single();

    if (fetchError || !order) {
        return { ok: false, error: "Order not found" };
    }

    // Pre-payment orders shouldn't have invoices yet.
    const eligibleStatuses = ["paid", "shipped", "delivered", "refunded", "payment_processing"];
    if (!eligibleStatuses.includes(order.status ?? "")) {
        return {
            ok: false,
            error: `Cannot generate invoice while order is "${order.status}". Wait for payment to clear.`,
        };
    }

    // 2. Short-circuit if invoice already exists (idempotent admin click).
    if (order.invoice_id) {
        return { ok: true };
    }
    const { data: existing } = await supabase
        .from("invoices")
        .select("id")
        .eq("order_id", orderId)
        .maybeSingle();
    if (existing) {
        await supabase.from("orders").update({ invoice_id: existing.id }).eq("id", orderId);
        revalidatePath("/admin/invoices");
        revalidatePath(`/admin/orders/${orderId}`);
        return { ok: true };
    }

    // 3. Build invoice payload (mirrors webhook handler logic).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (order.order_items as any[] | null) ?? [];
    const subtotal = items.reduce(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (sum: number, item: any) => sum + item.unit_price * item.quantity,
        0
    );
    const { vatAmount, total } = calculateVAT(subtotal);

    const invoiceNumber = generateInvoiceNumber();
    const customerEmail = order.guest_email || "";
    const customerName = order.shipping_address?.fullName || "Customer";
    const billingAddress = order.billing_address || order.shipping_address || {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invoiceItems = items.map((item: any) => ({
        name: item.product_name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        total: item.unit_price * item.quantity,
    }));

    // 4. PDF upload (non-fatal — invoice row still gets created even if PDF fails).
    let pdfUrl: string | null = null;
    try {
        const pdfBuffer = generateInvoicePDF({
            invoiceNumber,
            date: new Date(),
            customerName,
            customerEmail,
            billingAddress: {
                line1: billingAddress?.addressLine1 || "",
                line2: billingAddress?.addressLine2,
                city: billingAddress?.city || "",
                postcode: billingAddress?.postcode || "",
            },
            items: invoiceItems,
            subtotal,
            vatRate: storeConfig.vatRate,
            vatAmount,
            total,
        });
        const filename = getInvoiceFilename(invoiceNumber);
        const { error: uploadError } = await supabase.storage
            .from("invoices")
            .upload(`${invoiceNumber}/${filename}`, pdfBuffer, {
                contentType: "application/pdf",
                upsert: true,
            });
        if (uploadError) {
            console.error(`[regenerateInvoice] PDF upload failed for ${orderId}:`, uploadError.message);
        } else {
            pdfUrl = `${invoiceNumber}/${filename}`;
        }
    } catch (pdfError) {
        console.error(`[regenerateInvoice] PDF generation failed for ${orderId}:`, pdfError);
    }

    // 5. Insert invoice row.
    const { data: invoice, error: insertError } = await supabase
        .from("invoices")
        .insert({
            invoice_number: invoiceNumber,
            order_id: orderId,
            customer_email: customerEmail,
            customer_name: customerName,
            billing_address: billingAddress,
            items: invoiceItems,
            subtotal,
            vat_rate: storeConfig.vatRate,
            vat_amount: vatAmount,
            total,
            pdf_url: pdfUrl,
        })
        .select("id")
        .single();

    if (insertError || !invoice) {
        console.error(`[regenerateInvoice] Insert failed for ${orderId}:`, insertError?.message);
        return {
            ok: false,
            error: insertError?.message || "Failed to create invoice",
        };
    }

    // 6. Link order to invoice.
    const { error: updateError } = await supabase
        .from("orders")
        .update({ invoice_id: invoice.id })
        .eq("id", orderId);
    if (updateError) {
        console.error(`[regenerateInvoice] Order update failed for ${orderId}:`, updateError.message);
    }

    // 7. Audit log.
    const { logAdminAction } = await import("@/lib/audit");
    await logAdminAction(supabase, {
        action: "invoice:regenerated",
        resourceType: "order",
        resourceId: orderId,
        metadata: { invoiceNumber, invoiceId: invoice.id },
    });

    revalidatePath("/admin/invoices");
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { ok: true };
}
