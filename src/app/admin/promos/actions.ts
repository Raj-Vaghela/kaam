"use server";

import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createPromo(formData: FormData) {
    await requireAdmin();
    const supabase = await createClient();

    const code = (formData.get("code") as string).trim().toUpperCase();
    const description = formData.get("description") as string;
    const discount_type = formData.get("discount_type") as "percent" | "fixed";
    const discount_value = parseFloat(formData.get("discount_value") as string);
    const min_order_value = parseFloat(formData.get("min_order_value") as string) || 0;
    const max_uses = formData.get("max_uses") ? parseInt(formData.get("max_uses") as string) : null;
    const expires_at = formData.get("expires_at") || null;

    if (!code || !discount_type || isNaN(discount_value)) {
        throw new Error("Missing required fields");
    }

    const { error } = await supabase.from("promo_codes").insert({
        code,
        description,
        discount_type,
        discount_value,
        min_order_value,
        max_uses,
        expires_at: expires_at || null,
        active: true,
    });

    if (error) throw new Error(error.message);
    revalidatePath("/admin/promos");
}

export async function togglePromo(id: string, active: boolean) {
    await requireAdmin();
    const supabase = await createClient();
    const { error } = await supabase
        .from("promo_codes")
        .update({ active })
        .eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/promos");
}

export async function deletePromo(id: string) {
    await requireAdmin();
    const supabase = await createClient();
    const { error } = await supabase.from("promo_codes").delete().eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/promos");
}
