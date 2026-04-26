import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { sendOrderConfirmation } from "@/lib/email";
import { rateLimit } from "@/lib/security/rate-limit";

// Lazy-init service role client to avoid build-time crash
let _svc: ReturnType<typeof createServiceClient> | null = null;
function svc() {
    if (!_svc) {
        _svc = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        );
    }
    return _svc;
}

export async function POST(request: NextRequest) {
    // ── Auth + Role Check ──
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── Business Logic ──
    try {
        const formData = await request.formData();
        const invoiceId = formData.get("invoiceId") as string;

        if (!invoiceId) {
            return NextResponse.redirect(new URL("/admin/invoices?error=missing_id", request.url));
        }

        // Rate limit: 3 resends per invoice per hour
        const rl = await rateLimit(`resend:${invoiceId}`, 3, 60 * 60 * 1000);
        if (!rl.allowed) {
            return NextResponse.redirect(new URL("/admin/invoices?error=rate_limited", request.url));
        }

        // Fetch invoice with order details
        const { data: invoiceRaw, error: invoiceError } = await svc()
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = invoiceRaw as any;

        if (invoiceError || !invoice) {
            console.error("Invoice not found:", invoiceError?.message);
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
            console.error("Failed to send email");
            return NextResponse.redirect(new URL("/admin/invoices?error=email_failed", request.url));
        }

        // Audit log (runs under caller's session via SECURITY DEFINER RPC)
        const { logAdminAction } = await import("@/lib/audit");
        await logAdminAction(supabase, {
            action: "invoice:resend",
            resourceType: "invoice",
            resourceId: invoiceId,
        });

        return NextResponse.redirect(new URL("/admin/invoices?success=resent", request.url));
    } catch {
        console.error("Resend invoice error");
        return NextResponse.redirect(new URL("/admin/invoices?error=unknown", request.url));
    }
}
