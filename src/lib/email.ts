import { Resend } from "resend";
import { BRAND } from "./brand";
import { escapeHtml } from "./security/sanitize";

// Lazy-init to avoid build-time crash when RESEND_API_KEY is not yet set
let _resend: Resend | null = null;
function getResend(): Resend {
    if (!_resend) {
        _resend = new Resend(process.env.RESEND_API_KEY);
    }
    return _resend;
}

// Brand colors used inline (email clients strip <style>)
const TEAL = "#1f5f6b";
const TEAL_DEEP = "#134048";
const TERRACOTTA = "#c66b3d";
const CREAM = "#f5f0e6";
const CREAM_SOFT = "#faf6ec";
const INK = "#1a1714";
const INK_SOFT = "#4a423b";
const INK_MUTE = "#8a8178";

interface OrderEmailData {
    customerEmail: string;
    customerName: string;
    orderId: string;
    orderTotal: number;
    trackingUrl: string;
    invoicePdfUrl?: string;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://gajjuexpress.co.uk";

function emailShell(inner: string) {
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: ${INK}; margin: 0; padding: 0; background: ${CREAM};">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
            <img src="${APP_URL}/gajjuexpress-logo-h.png" alt="${BRAND.name}" width="180" height="48"
                 style="max-width: 180px; height: auto; display: block; margin: 0 auto;">
        </div>
        ${inner}
        <hr style="border: none; border-top: 1px solid #ebe3d2; margin: 36px 0 24px;">
        <div style="text-align: center; color: ${INK_MUTE}; font-size: 12px;">
            <p style="margin: 0 0 6px;">${BRAND.legalName}</p>
            <p style="margin: 0 0 4px;">${BRAND.address.line1}, ${BRAND.address.city}, ${BRAND.address.postcode}</p>
            <p style="margin: 0;">${BRAND.contact.email} · ${BRAND.contact.phone}</p>
        </div>
    </div>
</body>
</html>`;
}

export async function sendOrderConfirmation(data: OrderEmailData) {
    const { customerEmail, customerName, orderId, orderTotal, trackingUrl, invoicePdfUrl } = data;

    const inner = `
        <div style="background: linear-gradient(135deg, ${TEAL_DEEP} 0%, ${TEAL} 100%); color: white; padding: 40px 32px; border-radius: 20px; text-align: center; margin-bottom: 28px;">
            <img src="${APP_URL}/gajjuexpress-logo-h-white.png" alt="${BRAND.name}" width="160" height="42"
                 style="max-width: 160px; height: auto; display: block; margin: 0 auto 20px; opacity: 0.95;">
            <h2 style="margin: 0 0 8px; font-size: 28px; font-weight: 700;">Bahot bahot dhanyavaad!</h2>
            <p style="margin: 0; opacity: 0.85; font-size: 15px;">Order #${escapeHtml(orderId)}</p>
        </div>

        <p style="font-size: 16px;">Hi ${escapeHtml(customerName)},</p>
        <p style="color: ${INK_SOFT};">Your order has been confirmed and is being prepared with love. We'll be in touch the moment it ships.</p>

        <div style="background: ${CREAM_SOFT}; padding: 20px 24px; border-radius: 16px; margin: 24px 0; border: 1px solid #ebe3d2;">
            <p style="margin: 0 0 8px; color: ${INK_MUTE}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Order total</p>
            <p style="margin: 0; font-size: 28px; font-weight: 700; color: ${TERRACOTTA};">£${orderTotal.toFixed(2)}</p>
        </div>

        <div style="text-align: center; margin: 32px 0;">
            <a href="${escapeHtml(trackingUrl)}" style="display: inline-block; background: ${TERRACOTTA}; color: white; padding: 16px 32px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 15px;">Track your order →</a>
        </div>

        ${invoicePdfUrl ? `<p style="text-align: center; margin: 16px 0 0;"><a href="${escapeHtml(invoicePdfUrl)}" style="color: ${TEAL}; font-size: 14px;">Download invoice (PDF)</a></p>` : ""}
    `;

    try {
        const { data: result, error } = await getResend().emails.send({
            from: `${BRAND.name} <orders@${process.env.RESEND_DOMAIN || "resend.dev"}>`,
            to: customerEmail,
            subject: `Order confirmed · ${orderId} · ${BRAND.name}`,
            html: emailShell(inner),
        });
        if (error) {
            console.error("Failed to send order confirmation email:", error);
            return { success: false, error };
        }
        return { success: true, messageId: result?.id };
    } catch (error) {
        console.error("Failed to send order confirmation email:", error);
        return { success: false, error };
    }
}

interface AccountCreationEmailData {
    customerEmail: string;
    customerName: string;
    createAccountUrl: string;
}

export async function sendAccountCreationInvite(data: AccountCreationEmailData) {
    const { customerEmail, customerName, createAccountUrl } = data;

    const inner = `
        <p style="font-size: 16px;">Hi ${escapeHtml(customerName)},</p>
        <p style="color: ${INK_SOFT};">Thanks for shopping with us! Create a free ${BRAND.name} account to make next time even easier:</p>

        <ul style="padding-left: 20px; color: ${INK_SOFT}; line-height: 1.9;">
            <li>Track every order in one place</li>
            <li>Re-order your favourite masalas in one tap</li>
            <li>Get member-only pricing and festive offers</li>
        </ul>

        <div style="text-align: center; margin: 36px 0;">
            <a href="${escapeHtml(createAccountUrl)}" style="display: inline-block; background: ${TERRACOTTA}; color: white; padding: 16px 32px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 15px;">Create my account</a>
        </div>

        <p style="color: ${INK_MUTE}; font-size: 13px; text-align: center;">Totally optional. Your order is confirmed regardless.</p>
    `;

    try {
        const { data: result, error } = await getResend().emails.send({
            from: `${BRAND.name} <orders@${process.env.RESEND_DOMAIN || "resend.dev"}>`,
            to: customerEmail,
            subject: `Create your ${BRAND.name} account`,
            html: emailShell(inner),
        });
        if (error) {
            console.error("Failed to send account creation email:", error);
            return { success: false, error };
        }
        return { success: true, messageId: result?.id };
    } catch (error) {
        console.error("Failed to send account creation email:", error);
        return { success: false, error };
    }
}
