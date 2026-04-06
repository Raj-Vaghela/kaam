import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendOrderConfirmation } from "@/lib/email";

// Use service role for admin operations
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const invoiceId = formData.get("invoiceId") as string;

        if (!invoiceId) {
            return NextResponse.redirect(new URL("/admin/invoices?error=missing_id", request.url));
        }

        // Fetch invoice with order details
        const { data: invoice, error: invoiceError } = await supabase
            .from("invoices")
            .select(`
                *,
                orders (
                    id,
                    guest_token
                )
            `)
            .eq("id", invoiceId)
            .single();

        if (invoiceError || !invoice) {
            console.error("Invoice not found:", invoiceError);
            return NextResponse.redirect(new URL("/admin/invoices?error=not_found", request.url));
        }

        // Send the email
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const trackingUrl = invoice.orders?.guest_token
            ? `${baseUrl}/orders/${invoice.orders.guest_token}`
            : `${baseUrl}/account/orders`;

        const result = await sendOrderConfirmation({
            customerEmail: invoice.customer_email,
            customerName: invoice.customer_name,
            orderId: invoice.order_id.slice(0, 8).toUpperCase(),
            orderTotal: invoice.total,
            trackingUrl: trackingUrl,
            invoicePdfUrl: invoice.pdf_url || undefined,
        });

        if (!result.success) {
            console.error("Failed to send email:", result.error);
            return NextResponse.redirect(new URL("/admin/invoices?error=email_failed", request.url));
        }

        return NextResponse.redirect(new URL("/admin/invoices?success=resent", request.url));
    } catch (error) {
        console.error("Resend invoice error:", error);
        return NextResponse.redirect(new URL("/admin/invoices?error=unknown", request.url));
    }
}
