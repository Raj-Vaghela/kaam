"use server";

/**
 * Customer-initiated order cancellation.
 *
 * Allowed when the order status is one of:
 *   - "pending": payment_intent not yet captured. We cancel the PI; no money moves.
 *   - "paid": money has been charged but the order has not shipped. We issue a full
 *     Stripe refund and restore stock via increment_stock_batch (mirror of the
 *     decrement done by the payment_intent.succeeded webhook).
 *   - "payment_processing": delayed-capture flows (BACS, SEPA). Same as "paid"
 *     — refund through Stripe; the bank reverses the pending debit.
 *
 * Orders already in "shipped"/"delivered"/"cancelled"/"refunded" cannot be
 * cancelled through this flow — customers must use the Returns page (legal
 * cancellation rights under Consumer Contracts Regulations 2013 are still
 * available there).
 *
 * Idempotency: relies on `.in("status", [...cancellableStatuses])` guard at
 * the status update step — concurrent clicks resolve to one winner. Stripe
 * refunds use a deterministic idempotency key per order.
 *
 * After success the page caller revalidates /account/orders.
 */

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { revalidatePath } from "next/cache";
import { sendOrderCancellationEmail } from "@/lib/email";
import { logSystemAction } from "@/lib/audit";

export interface CancelOrderResult {
    ok: boolean;
    error?: string;
    refundAmount?: number;
    paymentCaptured?: boolean;
}

const CANCELLABLE_STATUSES = ["pending", "paid", "payment_processing"] as const;
type CancellableStatus = (typeof CANCELLABLE_STATUSES)[number];

function isCancellable(status: string | null): status is CancellableStatus {
    return !!status && (CANCELLABLE_STATUSES as readonly string[]).includes(status);
}

export async function cancelOrder(orderId: string): Promise<CancelOrderResult> {
    if (!orderId || typeof orderId !== "string") {
        return { ok: false, error: "Invalid order ID." };
    }

    // 1. Auth
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return { ok: false, error: "You must be signed in to cancel an order." };
    }

    // 2. Fetch the order with all data needed for refund + email + stock restore.
    //    RLS enforces user can only read their own orders (post-migration 20260603000001).
    const { data: order, error: fetchError } = await supabase
        .from("orders")
        .select(
            "id, status, total, stripe_payment_intent_id, stripe_session_id, guest_email, shipping_address, order_items (product_id, quantity)"
        )
        .eq("id", orderId)
        .single();

    if (fetchError || !order) {
        return { ok: false, error: "Order not found." };
    }

    if (!isCancellable(order.status)) {
        return {
            ok: false,
            error:
                order.status === "cancelled" || order.status === "refunded"
                    ? "This order has already been cancelled."
                    : "Your order has shipped, so it can no longer be cancelled here. You can still request a return after delivery from this page.",
        };
    }

    // 3. Service-role client for Stripe + privileged writes (RLS allows
    //    authenticated user UPDATE on their own orders only when status was
    //    "pending" before the 20260603 hardening; service role bypasses).
    const supabaseAdmin = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2026-01-28.clover",
    });

    // Backward compat: older orders stored the PaymentIntent ID in
    // stripe_session_id (a legacy column from when Stripe Checkout was used).
    // New orders write to both columns; either is acceptable here.
    const piId = order.stripe_payment_intent_id || order.stripe_session_id;
    const paymentWasCaptured = order.status === "paid" || order.status === "payment_processing";

    // 4. Stripe operation (refund or cancel the payment intent).
    try {
        if (paymentWasCaptured) {
            if (!piId) {
                return {
                    ok: false,
                    error: "Could not locate the payment for this order. Please contact support.",
                };
            }
            const pi = await stripe.paymentIntents.retrieve(piId);
            const chargeId = pi.latest_charge as string | null;
            if (!chargeId) {
                return {
                    ok: false,
                    error: "Could not locate the charge for this order. Please contact support.",
                };
            }
            await stripe.refunds.create(
                {
                    charge: chargeId,
                    reason: "requested_by_customer",
                },
                { idempotencyKey: `cancel:${orderId}` }
            );
        } else {
            // status === "pending": payment intent should be cancellable.
            if (piId) {
                try {
                    await stripe.paymentIntents.cancel(piId, {
                        cancellation_reason: "requested_by_customer",
                    });
                } catch (innerErr) {
                    // Stripe rejects cancellation of already-succeeded intents.
                    // If that happens the order should have advanced to "paid" via
                    // webhook by now — but a race could leave it stale. Surface a
                    // gentle error so the user retries (status will now be "paid").
                    const msg = innerErr instanceof Error ? innerErr.message : String(innerErr);
                    if (msg.includes("status of canceled") || msg.includes("already cancel")) {
                        // Already cancelled at Stripe — proceed to mark our row.
                    } else if (msg.includes("succeeded") || msg.includes("captured")) {
                        return {
                            ok: false,
                            error: "Your payment just completed. Please refresh and try again to issue a refund instead.",
                        };
                    } else {
                        throw innerErr;
                    }
                }
            }
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[cancelOrder] Stripe failure for ${orderId}:`, message);
        return {
            ok: false,
            error: "We couldn't process the refund right now. Please try again in a moment, or contact support.",
        };
    }

    // 5. Atomically flip the order status to "cancelled". The .in() guard
    //    prevents a double-cancel race with the webhook or another click.
    const { data: updated, error: updateError } = await supabaseAdmin
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", orderId)
        .in("status", CANCELLABLE_STATUSES as unknown as string[])
        .select("id")
        .maybeSingle();

    if (updateError) {
        console.error(`[cancelOrder] Failed to mark ${orderId} cancelled:`, updateError.message);
        // Refund/cancel already issued at Stripe — log loudly but don't fail
        // the user response since the financial side is settled.
    } else if (!updated) {
        // Lost the race — status changed between fetch and update. Likely
        // means the webhook flipped it to "shipped" or something. Refund
        // has been issued though; admin needs to reconcile.
        console.error(
            `[cancelOrder] Race on ${orderId}: status changed between read and update. Stripe refund already issued.`
        );
    }

    // 6. Restore stock if we'd previously decremented it. "pending" orders
    //    never decrement (the webhook does that on payment_intent.succeeded)
    //    so we only restore for paid/processing orders.
    if (paymentWasCaptured && order.order_items?.length) {
        const stockItems = order.order_items
            .filter((item: { product_id: string | null }) => item.product_id)
            .map((item: { product_id: string | null; quantity: number }) => ({
                product_id: item.product_id,
                quantity: item.quantity,
            }));
        if (stockItems.length > 0) {
            const { error: stockError } = await supabaseAdmin.rpc("increment_stock_batch", {
                p_items: stockItems,
            });
            if (stockError) {
                // Non-fatal: refund is already issued and order is cancelled.
                // Admin can manually reconcile stock from the audit log.
                console.error(
                    `[cancelOrder] Failed to restore stock for ${orderId}:`,
                    stockError.message
                );
            }
        }
    }

    // 7. Email the customer. Non-fatal if it fails (admin will reach out).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shipping = order.shipping_address as { fullName?: string } | null;
    const customerEmail = user.email || order.guest_email;
    const customerName = shipping?.fullName || "there";
    if (customerEmail) {
        await sendOrderCancellationEmail({
            customerEmail,
            customerName,
            orderId: order.id.slice(0, 8).toUpperCase(),
            refundAmount: order.total,
            paymentCaptured: paymentWasCaptured,
        }).catch((e) =>
            console.error(`[cancelOrder] cancellation email failed for ${orderId}:`, e)
        );
    }

    // 8. Audit log (system action; runs under service role).
    await logSystemAction({
        userId: user.id,
        action: "order.customer_cancelled",
        resourceType: "order",
        resourceId: orderId,
        metadata: {
            previous_status: order.status,
            refund_amount: order.total,
            payment_captured: paymentWasCaptured,
        },
    });

    revalidatePath("/account/orders");
    revalidatePath(`/admin/orders`);
    revalidatePath(`/admin/orders/${orderId}`);

    return {
        ok: true,
        refundAmount: order.total,
        paymentCaptured: paymentWasCaptured,
    };
}
