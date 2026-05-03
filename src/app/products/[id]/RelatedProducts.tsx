import { createClient } from "@/lib/supabase/server";
import { toProduct } from "@/types";
import ProductCard from "@/components/product/ProductCard";

interface Props {
    productId: string;
    category: string;
}

export default async function RelatedProducts({ productId, category }: Props) {
    const supabase = await createClient();
    const { data: related } = await supabase
        .from("products")
        .select("id, name, category, price, image_url, unit, weight_kg, rating, bestseller, club_price, stock")
        .eq("category", category)
        .neq("id", productId)
        .limit(4);

    if (!related || related.length === 0) return null;

    return (
        <section className="mt-16 pt-16 border-t border-cream-deep">
            <h2 className="font-display text-3xl text-ink mb-8">More from {category}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {related.map((row) => (
                    <ProductCard key={row.id} product={toProduct(row)} />
                ))}
            </div>
        </section>
    );
}
