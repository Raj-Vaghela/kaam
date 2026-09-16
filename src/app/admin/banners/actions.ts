"use server";

import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

function serviceClient() {
    return createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function saveBar(formData: FormData) {
    await requireAdmin();
    const supabase = await createClient();

    const message = formData.get("message") as string;
    const link_url = formData.get("link_url") as string;
    const bg_color = formData.get("bg_color") as string;
    const is_active = formData.get("is_active") === "on";

    const { error } = await supabase
        .from("banners")
        .update({ message, link_url, bg_color, is_active, updated_at: new Date().toISOString() })
        .eq("type", "bar");

    if (error) throw new Error(error.message);
    revalidatePath("/", "layout");
}

export async function savePopup(formData: FormData) {
    await requireAdmin();
    const supabase = await createClient();
    const sc = serviceClient();

    const link_url = formData.get("link_url") as string;
    const is_active = formData.get("is_active") === "on";
    const file = formData.get("image") as File | null;

    let image_url: string | undefined;

    if (file && file.size > 0) {
        const ext = file.name.split(".").pop();
        const path = `popup-${Date.now()}.${ext}`;
        const bytes = await file.arrayBuffer();

        const { error: uploadError } = await sc.storage
            .from("banners")
            .upload(path, bytes, { contentType: file.type, upsert: true });

        if (uploadError) throw new Error(uploadError.message);

        const { data } = sc.storage.from("banners").getPublicUrl(path);
        image_url = data.publicUrl;
    }

    const update: Record<string, unknown> = {
        link_url,
        is_active,
        updated_at: new Date().toISOString(),
    };
    if (image_url) update.image_url = image_url;

    const { error } = await supabase
        .from("banners")
        .update(update)
        .eq("type", "popup");

    if (error) throw new Error(error.message);
    revalidatePath("/", "layout");
}
