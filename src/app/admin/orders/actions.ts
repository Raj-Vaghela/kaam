"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";

// Lazy Stripe init — mirrors the pattern in src/app/actions.ts
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
    if (!_stripe) {
        _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: "2026-01-28.clover",
        });
    }
    return _stripe;
}

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
    if (!user) return { supabase, user: null, authorized: false };

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    const authorized = profile?.role === "admin" || profile?.role === "staff";
    return { supabase, user, authorized };
}

export async function updateOrderStatus(formData: FormData) {
    const { supabase, authorized } = await getAdminUser();
    if (!authorized) return { success: false, message: "Unauthorized" };

    const orderId = formData.get("orderId") as string;
    const newStatus = formData.get("status") as string;

    if (!orderId) return { success: false, message: "Missing order ID" };
    if (!isValidStatus(newStatus)) return { success: false, message: "Invalid status value" };

    const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

    if (error) return { success: false, message: error.message };

    const { logAdminAction } = await import("@/lib/audit");
    await logAdminAction(supabase, {
        action: "order:status_update",
        resourceType: "order",
        resourceId: orderId,
        metadata: { newStatus },
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);

    return { success: true };
}

export async function updateOrderTracking(formData: FormData) {
    const { supabase, authorized } = await getAdminUser();
    if (!authorized) return { success: false, message: "Unauthorized" };

    const orderId = formData.get("orderId") as string;
    const trackingNumber = (formData.get("trackingNumber") as string | null)?.trim() || null;
    const trackingUrl = (formData.get("trackingUrl") as string | null)?.trim() || null;

    if (!orderId) return { success: false, message: "Missing order ID" };

    const { error } = await supabase
        .from("orders")
        .update({ tracking_number: trackingNumber, tracking_url: trackingUrl })
        .eq("id", orderId);

    if (error) return { success: false, message: error.message };

    const { logAdminAction } = await import("@/lib/audit");
    await logAdminAction(supabase, {
        action: "order:tracking_update",
        resourceType: "order",
        resourceId: orderId,
        metadata: { trackingNumber, trackingUrl },
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);

    return { success: true };
}

export async function processRefund(formData: FormData) {
    const returnRequestId = formData.get("returnRequestId") as string;
    const orderId = formData.get("orderId") as string;
    if (!returnRequestId || !orderId) return { success: false, message: "Missing IDs" };

    const { supabase, authorized } = await getAdminUser();
    if (!authorized) return { success: false, message: "Unauthorized" };

    // Fetch the order to get total and stripe_session_id
    const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("id, total, stripe_session_id")
        .eq("id", orderId)
        .single();

    if (orderError || !order) return { success: false, message: "Order not found" };
    if (!order.stripe_session_id) return { success: false, message: "No Stripe payment found for this order" };

    try {
        const stripe = getStripe();

        // Retrieve the PaymentIntent to get the latest charge
        const pi = await stripe.paymentIntents.retrieve(order.stripe_session_id);
        const charge = pi.latest_charge as string;
        if (!charge) return { success: false, message: "No charge found on PaymentIntent" };

        // Issue refund
        const refund = await stripe.refunds.create({
            charge,
            reason: "requested_by_customer",
        });

        // Update return_requests to refunded
        const { error: returnError } = await supabase
            .from("return_requests")
            .update({
                status: "refunded",
                stripe_refund_id: refund.id,
                refund_amount: order.total,
                updated_at: new Date().toISOString(),
            })
            .eq("id", returnRequestId);

        if (returnError) return { success: false, message: returnError.message };

        // Mark order as cancelled
        await supabase
            .from("orders")
            .update({ status: "cancelled" })
            .eq("id", orderId);

        const { logAdminAction } = await import("@/lib/audit");
        await logAdminAction(supabase, {
            action: "return:refunded",
            resourceType: "order",
            resourceId: orderId,
            metadata: { returnRequestId, stripeRefundId: refund.id, refundAmount: order.total },
        });

        revalidatePath("/admin/orders");
        revalidatePath(`/admin/orders/${orderId}`);

        return { success: true };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Stripe error";
        return { success: false, message };
    }
}

export async function rejectReturn(formData: FormData) {
    const returnRequestId = formData.get("returnRequestId") as string;
    const orderId = formData.get("orderId") as string;
    if (!returnRequestId || !orderId) return { success: false, message: "Missing IDs" };

    const { supabase, authorized } = await getAdminUser();
    if (!authorized) return { success: false, message: "Unauthorized" };

    const { error } = await supabase
        .from("return_requests")
        .update({
            status: "rejected",
            updated_at: new Date().toISOString(),
        })
        .eq("id", returnRequestId);

    if (error) return { success: false, message: error.message };

    const { logAdminAction } = await import("@/lib/audit");
    await logAdminAction(supabase, {
        action: "return:rejected",
        resourceType: "order",
        resourceId: orderId,
        metadata: { returnRequestId },
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);

    return { success: true };
}
