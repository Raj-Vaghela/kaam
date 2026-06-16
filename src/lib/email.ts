import { Resend } from "resend";
import { BRAND } from "./brand";
import { escapeHtml } from "./security/sanitize";
import { RESEND_DOMAIN } from "./env";

// Lazy-init to avoid build-time crash when RESEND_API_KEY is not yet set
let _resend: Resend | null = null;
function getResend(): Resend {
    if (!_resend) {
        _resend = new Resend(process.env.RESEND_API_KEY);
    }
    return _resend;
}

// Resolve the verified sender address. Production env.ts already refuses to
// boot if RESEND_DOMAIN is still "resend.dev" — this is a defence-in-depth
// guard in case the env validation is bypassed.
function buildFrom(label?: string): string {
    if (RESEND_DOMAIN === "resend.dev" && process.env.NODE_ENV === "production") {
        throw new Error("[email] Cannot send from unverified RESEND_DOMAIN in production");
    }
    return `${label || BRAND.name} <noreply@${RESEND_DOMAIN}>`;
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

function registeredAddressLine(): string {
    const a = BRAND.registeredAddress;
    return [a.line1, a.line2, a.city, a.postcode, a.country].filter(Boolean).join(", ");
}

function emailShell(inner: string) {
    const addressLine = registeredAddressLine();
    const phoneSegment = BRAND.contact.phone ? ` · ${escapeHtml(BRAND.contact.phone)}` : "";
    const companyNumberSegment =
        BRAND.companyNumber && BRAND.companyNumber !== "COMPANY_NUMBER_NOT_SET"
            ? ` · Company No. ${escapeHtml(BRAND.companyNumber)}`
            : "";
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
            <p style="margin: 0 0 6px;">${escapeHtml(BRAND.legalName)}${companyNumberSegment}</p>
            <p style="margin: 0 0 4px;">${escapeHtml(addressLine)}</p>
            <p style="margin: 0;">${escapeHtml(BRAND.contact.email)}${phoneSegment}</p>
        </div>
    </div>
</body>
</html>`;
}

export async function sendOrderConfirmation(data: OrderEmailData) {
    const { customerEmail, customerName, orderId, orderTotal, trackingUrl, invoicePdfUrl } = data;
    const cancellationFormUrl = `${APP_URL}/returns#model-cancellation-form`;
    const returnsUrl = `${APP_URL}/returns`;

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
            <p style="margin: 8px 0 0; color: ${INK_MUTE}; font-size: 12px;">Prices include VAT where applicable. Itemised breakdown in your invoice.</p>
        </div>

        <div style="text-align: center; margin: 32px 0;">
            <a href="${escapeHtml(trackingUrl)}" style="display: inline-block; background: ${TERRACOTTA}; color: white; padding: 16px 32px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 15px;">Track your order →</a>
        </div>

        ${invoicePdfUrl ? `<p style="text-align: center; margin: 16px 0 0;"><a href="${escapeHtml(invoicePdfUrl)}" style="color: ${TEAL}; font-size: 14px;">Download invoice (PDF)</a></p>` : ""}

        <div style="background: #fff; border: 1px solid #ebe3d2; border-radius: 16px; padding: 20px 24px; margin: 28px 0 0;">
            <h3 style="margin: 0 0 8px; font-size: 15px; color: ${INK};">Your right to cancel</h3>
            <p style="margin: 0 0 8px; color: ${INK_SOFT}; font-size: 14px;">
                Under the Consumer Contracts Regulations 2013 you have <strong>14 days</strong> from the day you receive
                your goods to cancel for any reason. Cancellation does not need a justification.
            </p>
            <p style="margin: 0; color: ${INK_SOFT}; font-size: 14px;">
                Full details and the model cancellation form are on our
                <a href="${escapeHtml(returnsUrl)}" style="color: ${TEAL};">returns page</a>
                (<a href="${escapeHtml(cancellationFormUrl)}" style="color: ${TEAL};">model cancellation form</a>).
                You can also write to us at the address below.
            </p>
        </div>
    `;

    try {
        const { data: result, error } = await getResend().emails.send({
            from: buildFrom(),
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

// ---------------------------------------------------------------------------
// Payment processing holding email (BACS / delayed capture)
// ---------------------------------------------------------------------------
interface PaymentProcessingEmailData {
    customerEmail: string;
    customerName: string;
    orderId: string;
}

export async function sendPaymentProcessingEmail(data: PaymentProcessingEmailData) {
    const { customerEmail, customerName, orderId } = data;
    const inner = `
        <p style="font-size: 16px;">Hi ${escapeHtml(customerName)},</p>
        <p style="color: ${INK_SOFT};">We&apos;ve received your payment for order <strong>#${escapeHtml(orderId)}</strong> and your bank is processing it now. You&apos;ll receive a full confirmation email as soon as the funds clear — usually within a few minutes.</p>
        <p style="color: ${INK_MUTE}; font-size: 14px;">You do not need to do anything. Your order is reserved.</p>
    `;
    try {
        const { data: result, error } = await getResend().emails.send({
            from: buildFrom(),
            to: customerEmail,
            subject: `Payment processing · ${orderId} · ${BRAND.name}`,
            html: emailShell(inner),
        });
        if (error) {
            console.error("Failed to send payment-processing email:", error);
            return { success: false, error };
        }
        return { success: true, messageId: result?.id };
    } catch (error) {
        console.error("Failed to send payment-processing email:", error);
        return { success: false, error };
    }
}

// ---------------------------------------------------------------------------
// Refund confirmation email
// ---------------------------------------------------------------------------
interface RefundConfirmationEmailData {
    customerEmail: string;
    customerName: string;
    orderId: string;
    refundAmount: number;
    isFullRefund: boolean;
}

export async function sendRefundConfirmationEmail(data: RefundConfirmationEmailData) {
    const { customerEmail, customerName, orderId, refundAmount, isFullRefund } = data;
    const refundLabel = isFullRefund ? "full refund" : "partial refund";
    const inner = `
        <p style="font-size: 16px;">Hi ${escapeHtml(customerName)},</p>
        <p style="color: ${INK_SOFT};">We&apos;ve issued a <strong>${refundLabel} of £${refundAmount.toFixed(2)}</strong> for order <strong>#${escapeHtml(orderId)}</strong>. It should appear in your account within 5–10 business days depending on your bank.</p>
        <p style="color: ${INK_MUTE}; font-size: 14px;">If you have any questions, please reply to this email or contact us at ${BRAND.contact.email}.</p>
    `;
    try {
        const { data: result, error } = await getResend().emails.send({
            from: buildFrom(),
            to: customerEmail,
            subject: `Refund issued · ${orderId} · ${BRAND.name}`,
            html: emailShell(inner),
        });
        if (error) {
            console.error("Failed to send refund confirmation email:", error);
            return { success: false, error };
        }
        return { success: true, messageId: result?.id };
    } catch (error) {
        console.error("Failed to send refund confirmation email:", error);
        return { success: false, error };
    }
}

// ---------------------------------------------------------------------------
// Shipping dispatched email (admin clicks Generate EVRI Label → label uploaded)
// ---------------------------------------------------------------------------
interface ShippingDispatchedEmailData {
    customerEmail: string;
    customerName: string;
    orderId: string;
    trackingNumber: string;
    trackingUrl: string;
    carrierName?: string;
}

export async function sendShippingDispatched(data: ShippingDispatchedEmailData) {
    const { customerEmail, customerName, orderId, trackingNumber, trackingUrl, carrierName } = data;
    const carrier = carrierName || "Evri";
    const inner = `
        <p style="font-size: 16px;">Hi ${escapeHtml(customerName)},</p>
        <p style="color: ${INK_SOFT};">Good news — your order <strong>#${escapeHtml(orderId)}</strong> has been dispatched via ${escapeHtml(carrier)}.</p>
        <div style="background: ${CREAM_SOFT}; padding: 20px 24px; border-radius: 16px; margin: 24px 0; border: 1px solid #ebe3d2;">
            <p style="margin: 0 0 8px; color: ${INK_MUTE}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Tracking number</p>
            <p style="margin: 0; font-size: 22px; font-weight: 700; color: ${INK};">${escapeHtml(trackingNumber)}</p>
        </div>
        <div style="text-align: center; margin: 32px 0;">
            <a href="${escapeHtml(trackingUrl)}" style="display: inline-block; background: ${TERRACOTTA}; color: white; padding: 16px 32px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 15px;">Track parcel →</a>
        </div>
    `;
    try {
        const { data: result, error } = await getResend().emails.send({
            from: buildFrom(),
            to: customerEmail,
            subject: `Dispatched · ${orderId} · ${BRAND.name}`,
            html: emailShell(inner),
        });
        if (error) {
            console.error("Failed to send dispatched email:", error);
            return { success: false, error };
        }
        return { success: true, messageId: result?.id };
    } catch (error) {
        console.error("Failed to send dispatched email:", error);
        return { success: false, error };
    }
}

// ---------------------------------------------------------------------------
// Admin alert email (disputes, inventory shortfalls, etc.)
// ---------------------------------------------------------------------------
interface AdminAlertEmailData {
    subject: string;
    body: string;
}

export async function sendAdminDisputeAlert(data: AdminAlertEmailData) {
    const adminEmail = process.env.ADMIN_ALERT_EMAIL || BRAND.contact.email;
    const { subject, body } = data;
    const inner = `
        <p style="font-size: 15px; font-family: monospace; white-space: pre-wrap; color: ${INK};">${escapeHtml(body)}</p>
    `;
    try {
        const { data: result, error } = await getResend().emails.send({
            from: buildFrom(`${BRAND.name} Alerts`),
            to: adminEmail,
            subject,
            html: emailShell(inner),
        });
        if (error) {
            console.error("Failed to send admin alert email:", error);
            return { success: false, error };
        }
        return { success: true, messageId: result?.id };
    } catch (error) {
        console.error("Failed to send admin alert email:", error);
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
            from: buildFrom(),
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

// ---------------------------------------------------------------------------
// Newsletter — double opt-in confirmation
// ---------------------------------------------------------------------------
interface NewsletterConfirmEmailData {
    email: string;
    confirmUrl: string;
    unsubscribeUrl: string;
}

function newsletterHeaders(unsubscribeUrl: string): Record<string, string> {
    // RFC 8058 one-click unsubscribe — improves deliverability and is legally
    // expected for marketing email under PECR / UK GDPR Article 7(3).
    return {
        "List-Unsubscribe": `<${unsubscribeUrl}>, <mailto:unsubscribe@${RESEND_DOMAIN}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    };
}

export async function sendNewsletterConfirmation(data: NewsletterConfirmEmailData) {
    const { email, confirmUrl, unsubscribeUrl } = data;
    const inner = `
        <p style="font-size: 16px;">Hi there,</p>
        <p style="color: ${INK_SOFT};">Please confirm you'd like to receive ${BRAND.name} newsletters. We'll only email you once you've confirmed.</p>
        <div style="text-align: center; margin: 32px 0;">
            <a href="${escapeHtml(confirmUrl)}" style="display: inline-block; background: ${TERRACOTTA}; color: white; padding: 16px 32px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 15px;">Confirm subscription</a>
        </div>
        <p style="color: ${INK_MUTE}; font-size: 13px;">If you didn't sign up, ignore this email — we won't send you anything else.</p>
        <p style="color: ${INK_MUTE}; font-size: 12px; margin-top: 24px;">Don't want these emails? <a href="${escapeHtml(unsubscribeUrl)}" style="color: ${TEAL};">Unsubscribe</a>.</p>
    `;
    try {
        const { data: result, error } = await getResend().emails.send({
            from: buildFrom(),
            to: email,
            subject: `Confirm your ${BRAND.name} newsletter subscription`,
            html: emailShell(inner),
            headers: newsletterHeaders(unsubscribeUrl),
        });
        if (error) {
            console.error("Failed to send newsletter confirmation email:", error);
            return { success: false, error };
        }
        return { success: true, messageId: result?.id };
    } catch (error) {
        console.error("Failed to send newsletter confirmation email:", error);
        return { success: false, error };
    }
}

// ---------------------------------------------------------------------------
// Newsletter — welcome (sent only after confirmation)
// ---------------------------------------------------------------------------
interface NewsletterWelcomeEmailData {
    email: string;
    unsubscribeUrl: string;
    promoCode?: string;
}

export async function sendNewsletterWelcome(data: NewsletterWelcomeEmailData) {
    const { email, unsubscribeUrl, promoCode } = data;
    const promoBlock = promoCode
        ? `
        <div style="background: ${CREAM_SOFT}; border: 2px dashed ${TERRACOTTA}; padding: 20px 24px; border-radius: 16px; margin: 24px 0; text-align: center;">
            <p style="margin: 0 0 4px; color: ${INK_MUTE}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your welcome code</p>
            <p style="margin: 0; font-size: 26px; font-weight: 700; color: ${TERRACOTTA}; font-family: 'SF Mono', Menlo, monospace;">${escapeHtml(promoCode)}</p>
            <p style="margin: 8px 0 0; color: ${INK_MUTE}; font-size: 12px;">Terms apply — see <a href="${APP_URL}/terms" style="color: ${TEAL};">terms</a>.</p>
        </div>`
        : "";
    const inner = `
        <p style="font-size: 16px;">Welcome to ${BRAND.name}!</p>
        <p style="color: ${INK_SOFT};">Thanks for confirming. You'll be the first to hear about new arrivals, seasonal specials, and festive offers.</p>
        ${promoBlock}
        <p style="color: ${INK_MUTE}; font-size: 12px; margin-top: 24px;">You can <a href="${escapeHtml(unsubscribeUrl)}" style="color: ${TEAL};">unsubscribe</a> at any time.</p>
    `;
    try {
        const { data: result, error } = await getResend().emails.send({
            from: buildFrom(),
            to: email,
            subject: `Welcome to ${BRAND.name}`,
            html: emailShell(inner),
            headers: newsletterHeaders(unsubscribeUrl),
        });
        if (error) {
            console.error("Failed to send newsletter welcome email:", error);
            return { success: false, error };
        }
        return { success: true, messageId: result?.id };
    } catch (error) {
        console.error("Failed to send newsletter welcome email:", error);
        return { success: false, error };
    }
}
