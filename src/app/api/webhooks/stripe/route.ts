import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { generateInvoiceNumber, storeConfig, calculateVAT, InvoiceData } from "@/lib/invoice";
import { sendOrderConfirmation, sendAccountCreationInvite } from "@/lib/email";
import { generateInvoicePDF, getInvoiceFilename } from "@/lib/pdf";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-01-27.acacia",
});

// Service role client (bypasses RLS) — webhook only.
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return NextResponse.json({ error: err.message }, { status: 400 });
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
                const pi = await stripe.paymentIntents.retrieve(
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
        (sum: number, item: any) => sum + item.unit_price * item.quantity,
        0
    );
    const { vatAmount, total } = calculateVAT(subtotal);

    const invoiceNumber = generateInvoiceNumber();
    const customerEmail = pi.receipt_email || order.guest_email || "";
    const customerName = order.shipping_address?.fullName || "Customer";
    const billingAddress = order.billing_address || order.shipping_address || {};

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
            const { data: urlData } = supabase.storage
                .from("invoices")
                .getPublicUrl(`${invoiceNumber}/${filename}`);
            pdfUrl = urlData.publicUrl;
        }
    } catch (pdfError) {
        console.error("Failed to generate PDF:", pdfError);
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
        console.error("Failed to create invoice:", invoiceError);
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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const trackingUrl = guestToken
        ? `${baseUrl}/orders/${guestToken}`
        : `${baseUrl}/account/orders`;

    if (customerEmail) {
        await sendOrderConfirmation({
            customerEmail,
            customerName,
            orderId: orderId.slice(0, 8).toUpperCase(),
            orderTotal: total,
            trackingUrl,
            invoicePdfUrl: pdfUrl || undefined,
        });

        if (guestToken && order.guest_email) {
            await sendAccountCreationInvite({
                customerEmail: order.guest_email,
                customerName,
                createAccountUrl: `${baseUrl}/orders/${guestToken}/create-account`,
            });
        }
    }

    console.log(`Order ${orderId} paid; invoice ${invoiceNumber} created${pdfUrl ? " (PDF)" : ""}`);
}

async function handlePaymentIntentFailed(pi: Stripe.PaymentIntent) {
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
