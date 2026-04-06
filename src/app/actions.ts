"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import { CartItem } from "@/types";
import { generateInvoiceNumber, storeConfig, calculateVAT } from "@/lib/invoice";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-01-27.acacia",
});

// =============================================
// PRODUCT ACTIONS
// =============================================
export async function addProduct(formData: FormData) {
    const supabase = await createClient();

    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const price = parseFloat(formData.get("price") as string);
    const image_url = formData.get("image_url") as string;
    const unit = formData.get("unit") as string;
    const stock = parseInt(formData.get("stock") as string) || 0;
    const bestseller = formData.get("bestseller") === "on";

    const { error } = await supabase.from("products").insert({
        name,
        category,
        price,
        image_url,
        unit,
        stock,
        bestseller,
    });

    if (error) {
        return { success: false, message: error.message };
    }

    revalidatePath("/", "layout");
    revalidatePath("/admin/products");

    return { success: true };
}

// =============================================
// CHECKOUT ACTIONS (GUEST + AUTHENTICATED)
// =============================================
interface ShippingInfo {
    fullName: string;
    email: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    postcode: string;
}

export async function createCheckoutSession(
    cart: CartItem[],
    shippingInfo: ShippingInfo
) {
    const supabase = await createClient();

    // Get current user (optional - can be guest)
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (cart.length === 0) {
        return { success: false, error: "Your cart is empty" };
    }

    if (!shippingInfo.email) {
        return { success: false, error: "Email is required" };
    }

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const { vatAmount, total } = calculateVAT(subtotal);

    // Generate guest token for order tracking
    const guestToken = crypto.randomUUID();

    // Create order in database
    const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
            user_id: user?.id || null,
            guest_email: user ? null : shippingInfo.email,
            guest_token: user ? null : guestToken,
            status: "pending",
            total: total,
            shipping_address: {
                fullName: shippingInfo.fullName,
                phone: shippingInfo.phone,
                addressLine1: shippingInfo.addressLine1,
                addressLine2: shippingInfo.addressLine2,
                city: shippingInfo.city,
                postcode: shippingInfo.postcode,
            },
            billing_address: {
                fullName: shippingInfo.fullName,
                addressLine1: shippingInfo.addressLine1,
                addressLine2: shippingInfo.addressLine2,
                city: shippingInfo.city,
                postcode: shippingInfo.postcode,
            },
        })
        .select()
        .single();

    if (orderError || !order) {
        console.error("Order creation error:", orderError);
        return { success: false, error: "Failed to create order" };
    }

    // Create order items
    const orderItems = cart.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.qty,
        unit_price: item.price,
    }));

    const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

    if (itemsError) {
        // Rollback - delete the order
        await supabase.from("orders").delete().eq("id", order.id);
        return { success: false, error: "Failed to create order items" };
    }

    // Create Stripe checkout session
    try {
        const lineItems = cart.map((item) => ({
            price_data: {
                currency: "gbp",
                product_data: {
                    name: item.name,
                    images: item.image ? [item.image] : [],
                },
                unit_amount: Math.round(item.price * 100),
            },
            quantity: item.qty,
        }));

        // Add VAT as separate line item for transparency
        lineItems.push({
            price_data: {
                currency: "gbp",
                product_data: {
                    name: `VAT (${storeConfig.vatRate}%)`,
                    images: [],
                },
                unit_amount: Math.round(vatAmount * 100),
            },
            quantity: 1,
        });

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&token=${order.guest_token || ""}`,
            cancel_url: `${baseUrl}/checkout`,
            metadata: {
                order_id: order.id,
                guest_token: guestToken,
            },
            customer_email: shippingInfo.email,
            billing_address_collection: "auto",
            payment_intent_data: {
                metadata: {
                    order_id: order.id,
                },
            },
        });

        // Update order with Stripe session ID
        await supabase
            .from("orders")
            .update({ stripe_session_id: session.id })
            .eq("id", order.id);

        return { success: true, url: session.url };
    } catch (err: any) {
        // Rollback - delete order items and order
        await supabase.from("order_items").delete().eq("order_id", order.id);
        await supabase.from("orders").delete().eq("id", order.id);
        console.error("Stripe error:", err);
        return { success: false, error: err.message };
    }
}

// =============================================
// ORDER LOOKUP (FOR GUESTS)
// =============================================
export async function getOrderByToken(token: string) {
    const supabase = await createClient();

    const { data: order, error } = await supabase
        .from("orders")
        .select(`
            *,
            order_items (*)
        `)
        .eq("guest_token", token)
        .single();

    if (error || !order) {
        return { success: false, error: "Order not found" };
    }

    return { success: true, order };
}

// =============================================
// LINK GUEST ORDERS TO ACCOUNT
// =============================================
export async function linkGuestOrdersToAccount(email: string) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Must be logged in" };
    }

    // Update all guest orders with this email to be linked to the user
    const { error } = await supabase
        .from("orders")
        .update({
            user_id: user.id,
            guest_email: null,
            guest_token: null,
        })
        .eq("guest_email", email)
        .is("user_id", null);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}
