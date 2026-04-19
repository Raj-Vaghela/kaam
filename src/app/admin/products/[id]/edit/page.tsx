import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditProductForm from "./EditProductForm";

interface ProductRow {
    id: string;
    name: string;
    category: string | null;
    price: number;
    image_url: string | null;
    unit: string | null;
    stock: number | null;
    bestseller: boolean | null;
}

export default async function EditProductPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const supabase = await createClient();
    const { data } = await supabase
        .from("products")
        .select("id, name, category, price, image_url, unit, stock, bestseller")
        .eq("id", id)
        .single();

    if (!data) notFound();

    const product = data as unknown as ProductRow;

    return <EditProductForm product={product} />;
}
