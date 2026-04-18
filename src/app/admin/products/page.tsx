import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ProductsTable from "./ProductsTable";

interface ProductRow {
    id: string;
    name: string;
    category: string | null;
    price: number;
    image_url: string | null;
    stock: number | null;
}

export default async function AdminProductsPage() {
    const supabase = await createClient();
    const { data } = await supabase
        .from("products")
        .select("id, name, category, price, image_url, stock")
        .order("created_at", { ascending: false });

    const products = (data as ProductRow[] | null) ?? [];

    return (
        <div>
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="font-display text-5xl text-ink mb-2">Products</h1>
                    <p className="text-ink-mute">Everything in the aisle.</p>
                </div>
                <Link href="/admin/products/new" className="btn-primary inline-flex items-center gap-2 px-5 py-3">
                    <Plus size={18} /> Add Product
                </Link>
            </div>

            <ProductsTable products={products} />
        </div>
    );
}
