import { Resend } from "resend";
import { storeConfig } from "./invoice";

const resend = new Resend(process.env.RESEND_API_KEY);

interface OrderEmailData {
    customerEmail: string;
    customerName: string;
    orderId: string;
    orderTotal: number;
    trackingUrl: string;
    invoicePdfUrl?: string;
}

export async function sendOrderConfirmation(data: OrderEmailData) {
    const { customerEmail, customerName, orderId, orderTotal, trackingUrl, invoicePdfUrl } = data;

    try {
        const { data: result, error } = await resend.emails.send({
            from: `${storeConfig.name} <orders@${process.env.RESEND_DOMAIN || "resend.dev"}>`,
            to: customerEmail,
            subject: `Order Confirmation - ${orderId}`,
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #059669; margin: 0; font-size: 28px;">${storeConfig.name}</h1>
        </div>
        
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h2 style="margin: 0 0 10px 0; font-size: 24px;">Thank You for Your Order!</h2>
            <p style="margin: 0; opacity: 0.9;">Order #${orderId}</p>
        </div>
        
        <p>Hi ${customerName},</p>
        
        <p>Your order has been confirmed and is being prepared for delivery.</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Order Total:</strong> £${orderTotal.toFixed(2)}</p>
            <p style="margin: 0;"><strong>Order ID:</strong> ${orderId}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${trackingUrl}" style="display: inline-block; background: #059669; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Track Your Order</a>
        </div>
        
        ${invoicePdfUrl ? `
        <p style="text-align: center;">
            <a href="${invoicePdfUrl}" style="color: #059669;">Download Invoice (PDF)</a>
        </p>
        ` : ""}
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        
        <div style="text-align: center; color: #64748b; font-size: 14px;">
            <p style="margin: 0 0 10px 0;">${storeConfig.name}</p>
            <p style="margin: 0 0 5px 0;">${storeConfig.address.line1}, ${storeConfig.address.city}</p>
            <p style="margin: 0;">${storeConfig.phone}</p>
        </div>
    </div>
</body>
</html>
            `,
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

    try {
        const { data: result, error } = await resend.emails.send({
            from: `${storeConfig.name} <orders@${process.env.RESEND_DOMAIN || "resend.dev"}>`,
            to: customerEmail,
            subject: `Create your ${storeConfig.name} account`,
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #059669; margin: 0; font-size: 28px;">${storeConfig.name}</h1>
        </div>
        
        <p>Hi ${customerName},</p>
        
        <p>Thanks for shopping with us! Create an account to:</p>
        
        <ul style="padding-left: 20px;">
            <li>Track all your orders in one place</li>
            <li>Re-order your favourites faster</li>
            <li>Get exclusive offers and updates</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${createAccountUrl}" style="display: inline-block; background: #059669; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Create Account</a>
        </div>
        
        <p style="color: #64748b; font-size: 14px;">This is completely optional. Your order is confirmed regardless.</p>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        
        <div style="text-align: center; color: #64748b; font-size: 14px;">
            <p style="margin: 0;">${storeConfig.name}</p>
        </div>
    </div>
</body>
</html>
            `,
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
