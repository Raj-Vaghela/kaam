"use server";

import { createClient } from "@/lib/supabase/server";

export async function submitReview(productId: string, rating: number, body: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Must be signed in to review" };
    if (rating < 1 || rating > 5) return { success: false, error: "Invalid rating" };
    const cleanBody = body.trim();
    if (cleanBody.length < 10) return { success: false, error: "Review must be at least 10 characters" };

    const { error } = await supabase.from("product_reviews").upsert({
        product_id: productId,
        user_id: user.id,
        rating,
        body: cleanBody.slice(0, 1000),
    }, { onConflict: "product_id,user_id" });
    if (error) return { success: false, error: error.message };

    // Revalidate the product page
    const { revalidatePath } = await import("next/cache");
    revalidatePath(`/products/${productId}`);
    return { success: true };
}
