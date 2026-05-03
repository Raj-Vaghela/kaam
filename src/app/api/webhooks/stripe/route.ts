import { NextRequest, NextResponse } from "next/server";
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

    switch (event.type) {
        case "payment_intent.succeeded": {
            await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
            break;
        }
        case "payment_intent.payment_failed": {
            await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
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
        // Don't mark as paid without a linked invoice
        const { error: updateError } = await supabase
            .from("orders")
            .update({ status: "payment_received" })
            .eq("id", orderId);
        if (updateError) console.error("Failed to update order status:", updateError);
        console.error(`Order ${orderId} payment received but invoice creation failed — manual follow-up required`);
        return;
    }

    const { error: updateError } = await supabase
        .from("orders")
        .update({ status: "paid", invoice_id: invoice?.id })
        .eq("id", orderId);
    if (updateError) console.error("Failed to update order status:", updateError);

    // Decrement stock for each item in the order
    for (const item of order.order_items) {
        if (!item.product_id) continue;
        const { error: stockError } = await supabase.rpc("decrement_stock", {
            p_product_id: item.product_id,
            p_quantity: item.quantity,
        });
        if (stockError) console.error(`Failed to decrement stock for product ${item.product_id}:`, stockError);
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

        await sendOrderConfirmation({
            customerEmail,
            customerName,
            orderId: orderId.slice(0, 8).toUpperCase(),
            orderTotal: total,
            trackingUrl,
            invoicePdfUrl: signedPdfUrl,
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
