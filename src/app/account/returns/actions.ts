"use server";

import { createClient } from "@/lib/supabase/server";

export async function submitReturnRequest(orderId: string, reason: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Must be logged in" };

    // Verify the order belongs to this user and is delivered
    const { data: order } = await supabase
        .from("orders")
        .select("id, status, total")
        .eq("id", orderId)
        .eq("user_id", user.id)
        .eq("status", "delivered")
        .single();
    if (!order) return { success: false, error: "Order not eligible for return" };

    // Check no existing return request
    const { data: existing } = await supabase
        .from("return_requests")
        .select("id")
        .eq("order_id", orderId)
        .maybeSingle();
    if (existing) return { success: false, error: "A return request already exists for this order" };

    const { error } = await supabase.from("return_requests").insert({
        order_id: orderId,
        user_id: user.id,
        reason: reason.trim().slice(0, 500),
        status: "pending",
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
}
