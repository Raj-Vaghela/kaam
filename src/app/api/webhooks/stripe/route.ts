import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { generateInvoiceNumber, storeConfig, calculateVAT, InvoiceData } from "@/lib/invoice";
import { sendOrderConfirmation, sendAccountCreationInvite } from "@/lib/email";
import { generateInvoicePDF, getInvoiceFilename } from "@/lib/pdf";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-01-27.acacia",
});

// Use service role for webhook (bypasses RLS)
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

    // Handle the event
    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            await handleCheckoutCompleted(session);
            break;
        }
        case "checkout.session.expired": {
            const session = event.data.object as Stripe.Checkout.Session;
            await handleCheckoutExpired(session);
            break;
        }
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const orderId = session.metadata?.order_id;
    const guestToken = session.metadata?.guest_token;

    if (!orderId) {
        console.error("No order_id in session metadata");
        return;
    }

    // Get the order with items
    const { data: order, error: orderError } = await supabase
        .from("orders")
        .select(`
            *,
            order_items (*)
        `)
        .eq("id", orderId)
        .single();

    if (orderError || !order) {
        console.error("Failed to fetch order:", orderError);
        return;
    }

    // Calculate invoice amounts
    const subtotal = order.order_items.reduce(
        (sum: number, item: any) => sum + item.unit_price * item.quantity,
        0
    );
    const { vatAmount, total } = calculateVAT(subtotal);

    // Generate invoice
    const invoiceNumber = generateInvoiceNumber();
    const customerEmail = session.customer_email || order.guest_email;
    const customerName = order.shipping_address?.fullName || "Customer";
    const billingAddress = order.billing_address || order.shipping_address;

    const invoiceItems = order.order_items.map((item: any) => ({
        name: item.product_name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        total: item.unit_price * item.quantity,
    }));

    // Generate PDF
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

        // Upload PDF to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from("invoices")
            .upload(`${invoiceNumber}/${filename}`, pdfBuffer, {
                contentType: "application/pdf",
                upsert: true,
            });

        if (uploadError) {
            console.error("Failed to upload PDF:", uploadError);
        } else {
            // Get public URL
            const { data: urlData } = supabase.storage
                .from("invoices")
                .getPublicUrl(`${invoiceNumber}/${filename}`);
            pdfUrl = urlData.publicUrl;
        }
    } catch (pdfError) {
        console.error("Failed to generate PDF:", pdfError);
    }

    // Create invoice record
    const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
            invoice_number: invoiceNumber,
            order_id: orderId,
            customer_email: customerEmail,
            customer_name: customerName,
            billing_address: billingAddress,
            items: invoiceItems,
            subtotal: subtotal,
            vat_rate: storeConfig.vatRate,
            vat_amount: vatAmount,
            total: total,
            pdf_url: pdfUrl,
        })
        .select()
        .single();

    if (invoiceError) {
        console.error("Failed to create invoice:", invoiceError);
    }

    // Update order status
    const { error: updateError } = await supabase
        .from("orders")
        .update({
            status: "paid",
            invoice_id: invoice?.id,
        })
        .eq("id", orderId);

    if (updateError) {
        console.error("Failed to update order status:", updateError);
    }

    // Send order confirmation email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const trackingUrl = guestToken
        ? `${baseUrl}/orders/${guestToken}`
        : `${baseUrl}/account/orders`;

    await sendOrderConfirmation({
        customerEmail: customerEmail,
        customerName: customerName,
        orderId: orderId.slice(0, 8).toUpperCase(),
        orderTotal: total,
        trackingUrl: trackingUrl,
        invoicePdfUrl: pdfUrl || undefined,
    });

    // For guest orders, send account creation invite
    if (guestToken && order.guest_email) {
        await sendAccountCreationInvite({
            customerEmail: order.guest_email,
            customerName: customerName,
            createAccountUrl: `${baseUrl}/orders/${guestToken}/create-account`,
        });
    }

    console.log(`Order ${orderId} completed, invoice ${invoiceNumber} created${pdfUrl ? ' with PDF' : ''}`);
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
    const orderId = session.metadata?.order_id;

    if (!orderId) return;

    // Update order status to cancelled
    const { error } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", orderId);

    if (error) {
        console.error("Failed to update order status:", error);
    }

    console.log(`Order ${orderId} expired/cancelled`);
}
