"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import { CartItem } from "@/types";
import { calculateVAT } from "@/lib/invoice";

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

    if (error) return { success: false, message: error.message };

    revalidatePath("/", "layout");
    revalidatePath("/admin/products");

    return { success: true };
}

// =============================================
// CHECKOUT — PaymentIntent based (modern Elements)
// =============================================
interface CreatePaymentIntentArgs {
    cart: CartItem[];
    email: string;
}

export async function createPaymentIntent({ cart, email }: CreatePaymentIntentArgs) {
    if (!cart || cart.length === 0) {
        return { success: false, error: "Your basket is empty" };
    }
    if (!email) {
        return { success: false, error: "Email is required" };
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const { vatAmount, total } = calculateVAT(subtotal);
    const amountInPence = Math.round(total * 100);

    const guestToken = user ? null : crypto.randomUUID();

    // Create pending order — address will be filled in pre-confirm
    const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
            user_id: user?.id || null,
            guest_email: user ? null : email,
            guest_token: guestToken,
            status: "pending",
            total,
            shipping_address: {},
            billing_address: {},
        })
        .select()
        .single();

    if (orderError || !order) {
        console.error("Order creation error:", orderError);
        return { success: false, error: "Failed to create order" };
    }

    const orderItems = cart.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.qty,
        unit_price: item.price,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
    if (itemsError) {
        await supabase.from("orders").delete().eq("id", order.id);
        return { success: false, error: "Failed to create order items" };
    }

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInPence,
            currency: "gbp",
            automatic_payment_methods: { enabled: true },
            receipt_email: email,
            metadata: {
                order_id: order.id,
                guest_token: guestToken || "",
                subtotal: subtotal.toFixed(2),
                vat: vatAmount.toFixed(2),
            },
            description: `GajjuExpress order ${order.id.slice(0, 8).toUpperCase()}`,
        });

        await supabase
            .from("orders")
            .update({ stripe_session_id: paymentIntent.id })
            .eq("id", order.id);

        return {
            success: true,
            clientSecret: paymentIntent.client_secret,
            orderId: order.id,
            guestToken,
            amount: total,
            subtotal,
            vatAmount,
        };
    } catch (err: any) {
        await supabase.from("order_items").delete().eq("order_id", order.id);
        await supabase.from("orders").delete().eq("id", order.id);
        console.error("Stripe error:", err);
        return { success: false, error: err.message };
    }
}

// Update an order's shipping/billing address before payment confirmation.
export async function updateOrderShipping(
    orderId: string,
    shipping: {
        fullName: string;
        phone?: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        postcode: string;
        country?: string;
    }
) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("orders")
        .update({
            shipping_address: shipping,
            billing_address: shipping,
        })
        .eq("id", orderId);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

// =============================================
// ORDER LOOKUP (FOR GUESTS)
// =============================================
export async function getOrderByToken(token: string) {
    const supabase = await createClient();
    const { data: order, error } = await supabase
        .from("orders")
        .select(`*, order_items (*)`)
        .eq("guest_token", token)
        .single();

    if (error || !order) return { success: false, error: "Order not found" };
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

    if (!user) return { success: false, error: "Must be logged in" };

    const { error } = await supabase
        .from("orders")
        .update({
            user_id: user.id,
            guest_email: null,
            guest_token: null,
        })
        .eq("guest_email", email)
        .is("user_id", null);

    if (error) return { success: false, error: error.message };
    return { success: true };
}
