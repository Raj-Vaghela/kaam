"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";

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

export async function updateOrderStatus(formData: FormData): Promise<void> {
    const { supabase, authorized } = await getAdminUser();
    if (!authorized) return;

    const orderId = formData.get("orderId") as string;
    const newStatus = formData.get("status") as string;

    if (!orderId || !isValidStatus(newStatus)) return;

    const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

    if (error) return;

    const { logAdminAction } = await import("@/lib/audit");
    await logAdminAction(supabase, {
        action: "order:status_update",
        resourceType: "order",
        resourceId: orderId,
        metadata: { newStatus },
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
}

export async function updateOrderTracking(formData: FormData): Promise<void> {
    const { supabase, authorized } = await getAdminUser();
    if (!authorized) return;

    const orderId = formData.get("orderId") as string;
    const trackingNumber = (formData.get("trackingNumber") as string | null)?.trim() || null;
    const trackingUrl = (formData.get("trackingUrl") as string | null)?.trim() || null;

    if (!orderId) return;

    const { error } = await supabase
        .from("orders")
        .update({ tracking_number: trackingNumber, tracking_url: trackingUrl })
        .eq("id", orderId);

    if (error) return;

    const { logAdminAction } = await import("@/lib/audit");
    await logAdminAction(supabase, {
        action: "order:tracking_update",
        resourceType: "order",
        resourceId: orderId,
        metadata: { trackingNumber, trackingUrl },
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
}

export async function processRefund(formData: FormData): Promise<void> {
    const returnRequestId = formData.get("returnRequestId") as string;
    const orderId = formData.get("orderId") as string;
    if (!returnRequestId || !orderId) return;

    const { supabase, authorized } = await getAdminUser();
    if (!authorized) return;

    const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("id, total, stripe_session_id")
        .eq("id", orderId)
        .single();

    if (orderError || !order || !order.stripe_session_id) return;

    try {
        const stripe = getStripe();
        const pi = await stripe.paymentIntents.retrieve(order.stripe_session_id);
        const charge = pi.latest_charge as string;
        if (!charge) return;

        const refund = await stripe.refunds.create({
            charge,
            reason: "requested_by_customer",
        });

        const { error: returnError } = await supabase
            .from("return_requests")
            .update({
                status: "refunded",
                stripe_refund_id: refund.id,
                refund_amount: order.total,
                updated_at: new Date().toISOString(),
            })
            .eq("id", returnRequestId);

        if (returnError) return;

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
    } catch {
        // Stripe errors are silent here — admin can retry
    }
}

export async function rejectReturn(formData: FormData): Promise<void> {
    const returnRequestId = formData.get("returnRequestId") as string;
    const orderId = formData.get("orderId") as string;
    if (!returnRequestId || !orderId) return;

    const { supabase, authorized } = await getAdminUser();
    if (!authorized) return;

    const { error } = await supabase
        .from("return_requests")
        .update({
            status: "rejected",
            updated_at: new Date().toISOString(),
        })
        .eq("id", returnRequestId);

    if (error) return;

    const { logAdminAction } = await import("@/lib/audit");
    await logAdminAction(supabase, {
        action: "return:rejected",
        resourceType: "order",
        resourceId: orderId,
        metadata: { returnRequestId },
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
}
