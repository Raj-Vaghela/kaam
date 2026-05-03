"use server";

import { createClient } from "@/lib/supabase/server";

export async function toggleWishlist(productId: string): Promise<{ wishlisted: boolean }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { wishlisted: false }; // silently ignore if not logged in

    const { data: existing } = await supabase
        .from("user_wishlists")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle();

    if (existing) {
        await supabase.from("user_wishlists").delete().eq("id", existing.id);
        return { wishlisted: false };
    } else {
        await supabase.from("user_wishlists").insert({ user_id: user.id, product_id: productId });
        return { wishlisted: true };
    }
}

export async function isWishlisted(productId: string): Promise<boolean> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase
        .from("user_wishlists")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle();
    return !!data;
}
