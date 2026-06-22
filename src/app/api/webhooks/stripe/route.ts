import { after, NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { generateInvoiceNumber, storeConfig, calculateVAT, InvoiceData } from "@/lib/invoice";
import { sendOrderConfirmation } from "@/lib/email";
import { generateInvoicePDF, getInvoiceFilename } from "@/lib/pdf";

// Lazy-init to avoid build-time crash when env vars are not yet set
let _stripe: Stripe | null = null;
function getStripe() {
    if (!_stripe) {
        _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: "2026-01-28.clover",
        });
    }
    return _stripe;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabase: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSupabase(): any {
    if (!_supabase) {
        _supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
    }
    return _supabase;
}

export async function POST(request: NextRequest) {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
        event = getStripe().webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Signature verification failed";
        console.error("Webhook signature verification failed:", message);
        return NextResponse.json({ error: message }, { status: 400 });
    }

    // --- Idempotency: deduplicate Stripe retries via stripe_events table ---
    // Use service-role client so the insert bypasses RLS.
    const supabase = getSupabase();
    const { error: dedupError } = await supabase
        .from("stripe_events")
        .insert({ id: event.id, type: event.type, payload: event });

    if (dedupError) {
        // Postgres unique-violation code 23505 means we already processed this event.
        if (dedupError.code === "23505") {
            console.log(`Duplicate Stripe event ${event.id} — already processed. Returning 200.`);
            return NextResponse.json({ received: true });
        }
        // Any other insert error: log but continue processing (non-fatal for the dedup table).
        console.error("Failed to record stripe event for dedup:", dedupError.message);
    }

    switch (event.type) {
        case "payment_intent.succeeded": {
            await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
            break;
        }
        case "payment_intent.payment_failed": {
            await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
            break;
        }
        case "payment_intent.canceled": {
            await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
            break;
        }
        case "payment_intent.processing": {
            await handlePaymentIntentProcessing(event.data.object as Stripe.PaymentIntent);
            break;
        }
        case "charge.refunded": {
            await handleChargeRefunded(event.data.object as Stripe.Charge);
            break;
        }
        case "charge.dispute.created": {
            await handleDisputeCreated(event.data.object as Stripe.Dispute, false);
            break;
        }
        case "charge.dispute.funds_withdrawn": {
            await handleDisputeCreated(event.data.object as Stripe.Dispute, true);
            break;
        }
        // Legacy support for any in-flight Checkout Session flows.
        case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            if (session.payment_intent) {
                const pi = await getStripe().paymentIntents.retrieve(
                    session.payment_intent as string
                );
                await handlePaymentIntentSucceeded(pi);
            }
            break;
        }
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
}

async function handlePaymentIntentSucceeded(pi: Stripe.PaymentIntent) {
    const supabase = getSupabase();
    const orderId = pi.metadata?.order_id;
    const guestToken = pi.metadata?.guest_token || null;

    if (!orderId) {
        console.error("No order_id in payment intent metadata");
        return;
    }

    const { data: order, error: orderError } = await supabase
        .from("orders")
        .select(`*, order_items (*)`)
        .eq("id", orderId)
        .single();

    if (orderError || !order) {
        console.error("Failed to fetch order:", orderError);
        return;
    }

    // Already processed?
    if (order.status === "paid") {
        console.log(`Order ${orderId} already marked paid; skipping`);
        return;
    }

    // Amount integrity check: Stripe's amount_received must match the order total stored in DB.
    // A mismatch indicates a race condition or tampering — let Stripe retry rather than marking paid.
    const expectedPence = Math.round(order.total * 100);
    if (pi.amount_received !== expectedPence) {
        console.error(
            `Amount mismatch for order ${orderId}: expected ${expectedPence}p, Stripe reports ${pi.amount_received}p`
        );
        throw new Error(
            `amount_mismatch: order ${orderId} expected ${expectedPence}, got ${pi.amount_received}`
        );
    }

    const subtotal = order.order_items.reduce(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (sum: number, item: any) => sum + item.unit_price * item.quantity,
        0
    );
    const { vatAmount, total } = calculateVAT(subtotal);

    const invoiceNumber = generateInvoiceNumber();
    const customerEmail = pi.receipt_email || order.guest_email || "";
    const customerName = order.shipping_address?.fullName || "Customer";
    const billingAddress = order.billing_address || order.shipping_address || {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invoiceItems = order.order_items.map((item: any) => ({
        name: item.product_name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        total: item.unit_price * item.quantity,
    }));

    const invoiceData: InvoiceData = {
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
    };

    let pdfUrl: string | null = null;
    try {
        const pdfBuffer = generateInvoicePDF(invoiceData);
        const filename = getInvoiceFilename(invoiceNumber);
        const { error: uploadError } = await supabase.storage
            .from("invoices")
            .upload(`${invoiceNumber}/${filename}`, pdfBuffer, {
                contentType: "application/pdf",
                upsert: true,
            });
        if (uploadError) {
            console.error("Failed to upload PDF:", uploadError);
        } else {
            // Store the path, not a public URL — generate signed URLs at display time
            pdfUrl = `${invoiceNumber}/${filename}`;
        }
    } catch (pdfError) {
        console.error("Failed to generate PDF:", pdfError);
    }

    // Idempotent insert — if an invoice already exists for this order, skip.
    // Requires UNIQUE constraint on invoices.order_id in the database.
    const { data: existingInvoice } = await supabase
        .from("invoices")
        .select("id")
        .eq("order_id", orderId)
        .maybeSingle();

    if (existingInvoice) {
        console.log(`Invoice already exists for order ${orderId}; skipping duplicate`);
        // Ensure order is marked paid even if this is a retry
        await supabase.from("orders").update({ status: "paid", invoice_id: existingInvoice.id }).eq("id", orderId);
        return;
    }

    const { data: invoice, error: invoiceError } = await supabase
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
        .select()
        .single();

    if (invoiceError) {
        console.error("Failed to create invoice:", invoiceError?.message);
        // Mark as paid even when invoice creation fails — the order status must reflect payment.
        // The inconsistency is recoverable (admin can manually regenerate the invoice); leaving it
        // as "payment_received" creates a silent inconsistency that is harder to detect and fix.
        const { error: updateError } = await supabase
            .from("orders")
            .update({ status: "paid" })
            .eq("id", orderId);
        if (updateError) console.error("Failed to update order status:", updateError);
        console.error(`Order ${orderId} paid but invoice creation failed — manual invoice follow-up required`);

        // Alert admin asynchronously so the gap is visible, not silent.
        // The admin order page also surfaces a "Generate invoice" button when invoice_id is null.
        after(async () => {
            const { sendAdminDisputeAlert } = await import("@/lib/email");
            await sendAdminDisputeAlert({
                subject: `[Action Required] Invoice creation failed — order ${orderId.slice(0, 8).toUpperCase()}`,
                body:
                    `Order ${orderId} was paid (£${total.toFixed(2)}) but no invoice was created.\n` +
                    `Reason: ${invoiceError?.message ?? "unknown"}\n\n` +
                    `Fix: open /admin/orders/${orderId} and click "Generate invoice".`,
            }).catch((e: unknown) => console.error("Failed to send invoice-failure admin alert:", e));
        });
        return;
    }

    // Atomic stock decrement — single RPC call that raises if any item would go negative.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stockItems = order.order_items
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((item: any) => item.product_id)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((item: any) => ({ product_id: item.product_id, quantity: item.quantity }));

    if (stockItems.length > 0) {
        const { error: stockError } = await supabase.rpc("decrement_stock_batch", {
            p_items: stockItems,
        });
        if (stockError) {
            const isInventoryShortfall =
                stockError.message?.toLowerCase().includes("insufficient_stock") ||
                stockError.message?.toLowerCase().includes("insufficient stock");
            if (isInventoryShortfall) {
                console.error(`Inventory shortfall for order ${orderId}:`, stockError.message);
                await supabase
                    .from("orders")
                    .update({ status: "pending_inventory_review", invoice_id: invoice?.id })
                    .eq("id", orderId);
                // Send admin alert asynchronously — do not block webhook response
                after(async () => {
                    const { sendAdminDisputeAlert } = await import("@/lib/email");
                    await sendAdminDisputeAlert({
                        subject: `[Action Required] Inventory shortfall — order ${orderId.slice(0, 8).toUpperCase()}`,
                        body: `Order ${orderId} payment succeeded but stock decrement failed (insufficient stock). Review and adjust inventory, then manually set order status to "paid".`,
                    }).catch((e: unknown) => console.error("Failed to send admin alert:", e));
                });
                return;
            }
            console.error(`Failed to decrement stock for order ${orderId}:`, stockError);
        }
    }

    const { error: updateError } = await supabase
        .from("orders")
        .update({ status: "paid", invoice_id: invoice?.id })
        .eq("id", orderId);
    if (updateError) console.error("Failed to update order status:", updateError);

    // Move promo code usage increment to here (after confirmed paid) rather than at PI creation.
    const appliedPromoCode = pi.metadata?.promo_code;
    if (appliedPromoCode) {
        const { error: promoError } = await supabase.rpc("increment_promo_code_uses", {
            p_code: appliedPromoCode,
        });
        if (promoError) {
            console.error(`Failed to increment promo code uses for ${appliedPromoCode}:`, promoError);
        }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const trackingUrl = guestToken
        ? `${baseUrl}/orders/${guestToken}`
        : `${baseUrl}/account/orders`;

    if (customerEmail) {
        // Generate a short-lived signed URL for the invoice PDF in the email
        let signedPdfUrl: string | undefined;
        if (pdfUrl) {
            const { data: signedData } = await supabase.storage
                .from("invoices")
                .createSignedUrl(pdfUrl, 7 * 24 * 60 * 60); // 7 days
            signedPdfUrl = signedData?.signedUrl;
        }

        // Fire-and-forget via after() so Stripe gets a 200 immediately after DB writes.
        after(async () => {
            await sendOrderConfirmation({
                customerEmail,
                customerName,
                orderId: orderId.slice(0, 8).toUpperCase(),
                orderTotal: total,
                trackingUrl,
                invoicePdfUrl: signedPdfUrl,
            }).catch((e: unknown) => console.error("Failed to send order confirmation email:", e));
        });

        // GDPR: Do NOT send unsolicited account creation emails.
        // The order confirmation page has a create-account CTA instead.
    }

    console.log(`Order ${orderId} paid; invoice ${invoiceNumber} created${pdfUrl ? " (PDF)" : ""}`);
}

async function handlePaymentIntentFailed(pi: Stripe.PaymentIntent) {
    const supabase = getSupabase();
    const orderId = pi.metadata?.order_id;
    if (!orderId) return;
    // payment_intent.payment_failed is not terminal — the customer can retry.
    // Only mark as cancelled on the terminal payment_intent.canceled event.
    const { error } = await supabase
        .from("orders")
        .update({ status: "payment_failed" })
        .eq("id", orderId)
        .eq("status", "pending");
    if (error) console.error("Failed to update order status:", error);
    console.log(`Order ${orderId} payment attempt failed (retryable)`);
}

async function handlePaymentIntentCanceled(pi: Stripe.PaymentIntent) {
    const supabase = getSupabase();
    const orderId = pi.metadata?.order_id;
    if (!orderId) return;
    // Only cancel if still pending — idempotent.
    const { error } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", orderId)
        .eq("status", "pending");
    if (error) console.error("Failed to cancel order:", error);
    console.log(`Order ${orderId} cancelled via payment_intent.canceled`);
}

async function handlePaymentIntentProcessing(pi: Stripe.PaymentIntent) {
    // payment_intent.processing means the bank has accepted the payment but funds not yet
    // settled (common with BACS Direct Debit). Order stays pending; send a holding email.
    const orderId = pi.metadata?.order_id;
    const customerEmail = pi.receipt_email;
    const customerName = pi.metadata?.customer_name || "Customer";
    console.log(`Payment processing for order ${orderId} (awaiting bank confirmation)`);

    if (customerEmail) {
        after(async () => {
            const { sendPaymentProcessingEmail } = await import("@/lib/email");
            await sendPaymentProcessingEmail({
                customerEmail,
                customerName,
                orderId: orderId?.slice(0, 8).toUpperCase() ?? "",
            }).catch((e: unknown) =>
                console.error("Failed to send payment-processing email:", e)
            );
        });
    }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
    const supabase = getSupabase();
    const paymentIntentId = charge.payment_intent as string | null;
    if (!paymentIntentId) {
        console.error("charge.refunded missing payment_intent field");
        return;
    }

    const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("id, total, guest_email, user_id, shipping_address")
        .eq("stripe_payment_intent_id", paymentIntentId)
        .maybeSingle();

    if (orderError || !order) {
        // Fallback: try the legacy stripe_session_id column used by older orders.
        const { data: legacyOrder, error: legacyError } = await supabase
            .from("orders")
            .select("id, total, guest_email, user_id, shipping_address")
            .eq("stripe_session_id", paymentIntentId)
            .maybeSingle();
        if (legacyError || !legacyOrder) {
            console.error("charge.refunded: order not found for PI", paymentIntentId);
            return;
        }
        return processRefundStatus(legacyOrder, charge);
    }

    return processRefundStatus(order, charge);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processRefundStatus(order: any, charge: Stripe.Charge) {
    const supabase = getSupabase();
    const totalRefunded = charge.amount_refunded; // in pence
    const chargeAmount = charge.amount; // in pence
    const isFullRefund = totalRefunded >= chargeAmount;
    const newStatus = isFullRefund ? "refunded" : "partially_refunded";

    // Check if refunded_amount column exists (gracefully degrade if not).
    const updatePayload: Record<string, unknown> = { status: newStatus };
    // Attempt to set refunded_amount; if the column doesn't exist the update will simply ignore it
    // via Supabase's partial update semantics, but we check for errors and log rather than fail.
    updatePayload.refunded_amount = totalRefunded / 100;

    const { error } = await supabase
        .from("orders")
        .update(updatePayload)
        .eq("id", order.id);

    if (error) {
        if (error.message?.includes("refunded_amount")) {
            // Column not yet migrated — log and retry without it
            console.warn(
                `Order ${order.id}: refunded_amount column missing; updating status only. Add column via migration.`
            );
            await supabase.from("orders").update({ status: newStatus }).eq("id", order.id);
        } else {
            console.error(`Failed to update order ${order.id} refund status:`, error);
        }
    }

    const customerEmail = order.guest_email || "";
    const customerName = order.shipping_address?.fullName || "Customer";
    if (customerEmail) {
        after(async () => {
            const { sendRefundConfirmationEmail } = await import("@/lib/email");
            await sendRefundConfirmationEmail({
                customerEmail,
                customerName,
                orderId: order.id.slice(0, 8).toUpperCase(),
                refundAmount: totalRefunded / 100,
                isFullRefund,
            }).catch((e: unknown) =>
                console.error("Failed to send refund confirmation email:", e)
            );
        });
    }

    console.log(
        `Order ${order.id} ${newStatus}: £${(totalRefunded / 100).toFixed(2)} refunded`
    );
}

async function handleDisputeCreated(dispute: Stripe.Dispute, fundsWithdrawn: boolean) {
    const supabase = getSupabase();
    const chargeId = dispute.charge as string;

    // Retrieve the charge to get the payment intent ID
    let paymentIntentId: string | null = null;
    try {
        const charge = await getStripe().charges.retrieve(chargeId);
        paymentIntentId = charge.payment_intent as string | null;
    } catch (e) {
        console.error("Failed to retrieve charge for dispute:", e);
    }

    if (!paymentIntentId) {
        console.error("charge.dispute.created: cannot resolve payment_intent from charge", chargeId);
        return;
    }

    // Try new column first, then legacy
    let order: { id: string } | null = null;
    const { data: o1 } = await supabase
        .from("orders")
        .select("id")
        .eq("stripe_payment_intent_id", paymentIntentId)
        .maybeSingle();
    if (o1) {
        order = o1;
    } else {
        const { data: o2 } = await supabase
            .from("orders")
            .select("id")
            .eq("stripe_session_id", paymentIntentId)
            .maybeSingle();
        if (o2) order = o2;
    }

    if (!order) {
        console.error("Dispute: order not found for PI", paymentIntentId);
    } else {
        const { error } = await supabase
            .from("orders")
            .update({ status: "disputed" })
            .eq("id", order.id);
        if (error) {
            // 'disputed' may not be in the status enum yet — log and continue.
            console.error(
                `Failed to set order ${order.id} to disputed (enum value may be missing):`,
                error.message
            );
        } else {
            console.log(`Order ${order.id} marked as disputed (funds_withdrawn=${fundsWithdrawn})`);
        }
    }

    // Send admin alert in background — don't block the webhook response
    after(async () => {
        const { sendAdminDisputeAlert } = await import("@/lib/email");
        const subject = fundsWithdrawn
            ? `[URGENT] Dispute funds withdrawn — charge ${chargeId}`
            : `[Alert] New chargeback dispute — charge ${chargeId}`;
        const body = fundsWithdrawn
            ? `A dispute for charge ${chargeId} has had funds withdrawn. Order ID: ${order?.id ?? "unknown"}. Dispute ID: ${dispute.id}. Reason: ${dispute.reason}. Respond immediately in the Stripe dashboard.`
            : `A new dispute has been opened for charge ${chargeId}. Order ID: ${order?.id ?? "unknown"}. Dispute ID: ${dispute.id}. Reason: ${dispute.reason}. Respond within 7 days.`;
        await sendAdminDisputeAlert({ subject, body }).catch((e: unknown) =>
            console.error("Failed to send dispute admin alert:", e)
        );
    });
}
