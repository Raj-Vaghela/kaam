"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import { CartItem } from "@/types";
import { calculateVAT } from "@/lib/invoice";

// Lazy-init mirrors the webhook route — avoids build-time crash when env vars are absent in CI
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
    if (!_stripe) {
        _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: "2026-01-28.clover",
        });
    }
    return _stripe;
}

// =============================================
// PRODUCT ACTIONS
// =============================================
export async function addProduct(formData: FormData) {
    const supabase = await createClient();

    // Admin authorization check
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
    if (profile?.role !== "admin") return { success: false, message: "Unauthorized" };

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

    // Audit log (runs under caller's session via SECURITY DEFINER RPC)
    const { logAdminAction } = await import("@/lib/audit");
    await logAdminAction(supabase, {
        action: "product:create",
        resourceType: "product",
        metadata: { productName: name },
    });

    revalidatePath("/", "layout");
    revalidatePath("/admin/products");

    return { success: true };
}

export async function updateProduct(productId: string, formData: FormData) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
    if (profile?.role !== "admin") return { success: false, message: "Unauthorized" };

    if (!productId) return { success: false, message: "Missing product id" };

    const name = (formData.get("name") as string)?.trim();
    const category = formData.get("category") as string;
    const priceRaw = formData.get("price") as string;
    const price = parseFloat(priceRaw);
    const image_url = formData.get("image_url") as string;
    const unit = formData.get("unit") as string;
    const stock = parseInt(formData.get("stock") as string) || 0;
    const bestseller = formData.get("bestseller") === "on";

    if (!name || !category || isNaN(price) || price < 0) {
        return { success: false, message: "Missing or invalid fields" };
    }

    const { error } = await supabase
        .from("products")
        .update({ name, category, price, image_url, unit, stock, bestseller })
        .eq("id", productId);

    if (error) return { success: false, message: error.message };

    const { logAdminAction } = await import("@/lib/audit");
    await logAdminAction(supabase, {
        action: "product:update",
        resourceType: "product",
        resourceId: productId,
        metadata: { productName: name },
    });

    revalidatePath("/", "layout");
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}/edit`);

    return { success: true };
}

export async function deleteProduct(productId: string) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
    if (profile?.role !== "admin") return { success: false, message: "Unauthorized" };

    if (!productId) return { success: false, message: "Missing product id" };

    // Fetch for audit metadata before deleting
    const { data: product } = await supabase
        .from("products")
        .select("name")
        .eq("id", productId)
        .single();

    const { error } = await supabase.from("products").delete().eq("id", productId);
    if (error) return { success: false, message: error.message };

    const { logAdminAction } = await import("@/lib/audit");
    await logAdminAction(supabase, {
        action: "product:delete",
        resourceType: "product",
        resourceId: productId,
        metadata: { productName: (product as { name?: string } | null)?.name ?? null },
    });

    revalidatePath("/", "layout");
    revalidatePath("/admin/products");

    return { success: true };
}

// =============================================
// PROMO CODE VALIDATION
// =============================================
export async function validatePromoCode(code: string, subtotal: number): Promise<{
    valid: boolean;
    error?: string;
    discountType?: 'percent' | 'fixed';
    discountValue?: number;
    discountAmount?: number;
    description?: string;
}> {
    if (!code?.trim()) return { valid: false, error: 'No code entered' };
    const upperCode = code.trim().toUpperCase();

    const supabase = await createClient();
    const { data: promo } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', upperCode)
        .eq('active', true)
        .single();

    if (!promo) return { valid: false, error: 'Invalid or expired promo code' };
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) return { valid: false, error: 'This code has expired' };
    if (promo.max_uses !== null && promo.uses_count >= promo.max_uses) return { valid: false, error: 'This code has reached its usage limit' };
    if (subtotal < promo.min_order_value) return { valid: false, error: `Minimum order of £${promo.min_order_value.toFixed(2)} required for this code` };

    const discountAmount = promo.discount_type === 'percent'
        ? Math.min(subtotal * (promo.discount_value / 100), subtotal)
        : Math.min(promo.discount_value, subtotal);

    return {
        valid: true,
        discountType: promo.discount_type,
        discountValue: promo.discount_value,
        discountAmount,
        description: promo.description,
    };
}

// =============================================
// CHECKOUT — PaymentIntent based (modern Elements)
// =============================================
interface CreatePaymentIntentArgs {
    cart: CartItem[];
    email: string;
    promoCode?: string;
}

export async function createPaymentIntent({ cart, email, promoCode }: CreatePaymentIntentArgs) {
    // Rate limit: 5 payment intents per email per 10 minutes
    const { rateLimit } = await import("@/lib/security/rate-limit");
    const rl = await rateLimit(`payment:${email}`, 5, 10 * 60 * 1000);
    if (!rl.allowed) {
        return { success: false, error: "Too many checkout attempts. Please wait a few minutes." };
    }

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

    // Server-side price validation: fetch products from DB to prevent price tampering
    const productIds = cart.map((item) => item.id);
    const { data: dbProducts, error: productsError } = await supabase
        .from("products")
        .select("id, name, price, club_price, stock")
        .in("id", productIds);

    if (productsError || !dbProducts) {
        return { success: false, error: "Failed to validate products" };
    }

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    // Validate all cart items and compute subtotal in a single pass
    let subtotal = 0;
    const validatedItems: { dbProduct: typeof dbProducts[0]; qty: number; unitPrice: number }[] = [];
    for (const item of cart) {
        const dbProduct = productMap.get(item.id);
        if (!dbProduct) {
            return { success: false, error: `Product "${item.name}" not found` };
        }
        if (dbProduct.stock < item.qty) {
            return { success: false, error: `"${dbProduct.name}" only has ${dbProduct.stock} in stock` };
        }
        const unitPrice = dbProduct.club_price ?? dbProduct.price;
        subtotal += unitPrice * item.qty;
        validatedItems.push({ dbProduct, qty: item.qty, unitPrice });
    }
    const freeDeliveryThreshold = 40;
    const deliveryFee = subtotal >= freeDeliveryThreshold ? 0 : 3.99;

    let discountAmount = 0;
    let appliedPromoCode: string | null = null;
    if (promoCode) {
        const promoResult = await validatePromoCode(promoCode, subtotal);
        if (promoResult.valid && promoResult.discountAmount) {
            discountAmount = promoResult.discountAmount;
            appliedPromoCode = promoCode.trim().toUpperCase();
        }
        // Silently ignore invalid codes — the UI validates first
    }
    const discountedSubtotal = subtotal - discountAmount;

    const { vatAmount, total } = calculateVAT(discountedSubtotal + deliveryFee);
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
            discount_amount: discountAmount > 0 ? discountAmount : null,
            promo_code: appliedPromoCode,
        })
        .select()
        .single();

    if (orderError || !order) {
        console.error("Order creation error:", orderError);
        return { success: false, error: "Failed to create order" };
    }

    const orderItems = validatedItems.map(({ dbProduct, qty, unitPrice }) => ({
        order_id: order.id,
        product_id: dbProduct.id,
        product_name: dbProduct.name,
        quantity: qty,
        unit_price: unitPrice,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
    if (itemsError) {
        await supabase.from("orders").delete().eq("id", order.id);
        return { success: false, error: "Failed to create order items" };
    }

    try {
        const paymentIntent = await getStripe().paymentIntents.create({
            amount: amountInPence,
            currency: "gbp",
            automatic_payment_methods: { enabled: true },
            receipt_email: email,
            metadata: {
                order_id: order.id,
                guest_token: guestToken || "",
                subtotal: subtotal.toFixed(2),
                vat: vatAmount.toFixed(2),
                discount: discountAmount > 0 ? discountAmount.toFixed(2) : "0",
                promo_code: appliedPromoCode || "",
            },
            description: `GajjuExpress order ${order.id.slice(0, 8).toUpperCase()}`,
        });

        await supabase
            .from("orders")
            .update({ stripe_session_id: paymentIntent.id })
            .eq("id", order.id);

        if (appliedPromoCode) {
            await supabase.rpc('increment_promo_code_uses', { p_code: appliedPromoCode });
        }

        return {
            success: true,
            clientSecret: paymentIntent.client_secret,
            orderId: order.id,
            guestToken,
            amount: total,
            subtotal,
            vatAmount,
            discountAmount,
        };
    } catch (err: unknown) {
        await supabase.from("order_items").delete().eq("order_id", order.id);
        await supabase.from("orders").delete().eq("id", order.id);
        console.error("Stripe error:", err);
        const message = err instanceof Error ? err.message : "Unknown error";
        return { success: false, error: message };
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
    },
    guestToken?: string | null
) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Build authorization query: must be the order owner or verified guest
    let query = supabase
        .from("orders")
        .update({
            shipping_address: shipping,
            billing_address: shipping,
        })
        .eq("id", orderId)
        .eq("status", "pending");

    if (user) {
        query = query.eq("user_id", user.id);
    } else if (guestToken) {
        query = query.eq("guest_token", guestToken);
    } else {
        return { success: false, error: "Authentication required" };
    }

    const { error, count } = await query.select("id");

    if (error) return { success: false, error: error.message };
    if (count === 0) return { success: false, error: "Order not found or not authorized" };
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function linkGuestOrdersToAccount(_email: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Must be logged in" };
    if (!user.email) return { success: false, error: "Account email unavailable" };

    const { error } = await supabase
        .from("orders")
        .update({
            user_id: user.id,
            guest_email: null,
            guest_token: null,
        })
        .eq("guest_email", user.email)
        .is("user_id", null);

    if (error) return { success: false, error: error.message };
    return { success: true };
}
