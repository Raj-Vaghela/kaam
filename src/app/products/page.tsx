import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/product/ProductCard";
import { toProduct } from "@/types";

export default async function ProductsPage() {
    const supabase = await createClient();
    const { data: products } = await supabase.from("products").select("*");

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="mb-12 max-w-3xl">
                <p className="text-xs font-semibold tracking-widest uppercase text-accent mb-3">
                    The pantry
                </p>
                <h1 className="font-display text-5xl sm:text-6xl text-ink mb-4 leading-[1]">
                    Every aisle of an Indian kitchen.
                </h1>
                <p className="text-lg text-ink-mute leading-relaxed">
                    Browse our hand-picked collection of authentic groceries, spices, snacks
                    and more — sourced with care, delivered tomorrow.
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
                {products?.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={toProduct(product)}
                    />
                ))}
            </div>
            {(!products || products.length === 0) && (
                <div className="text-center py-24 text-ink-mute">
                    <p className="font-display text-2xl mb-2">The shelves are being restocked.</p>
                    <p>Check back soon.</p>
                </div>
            )}
        </div>
    );
}
