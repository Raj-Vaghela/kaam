import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/product/ProductCard";

export default async function ProductsPage() {
    const supabase = await createClient();
    const { data: products } = await supabase.from("products").select("*");

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-8">
                <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">
                    All Groceries
                </h1>
                <p className="text-slate-600">
                    Browse our extensive collection of authentic Indian groceries, spices, and more.
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {products?.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={{
                            id: product.id,
                            name: product.name,
                            category: product.category,
                            price: Number(product.price),
                            imgUrl: product.image_url || "https://placehold.co/400",
                            unit: product.unit,
                            weight_kg: 0, // Default or fetch if exists
                            rating: product.rating || 0,
                            bestseller: product.bestseller || false,
                            clubPrice: product.club_price ? Number(product.club_price) : undefined,
                        }}
                    />
                ))}
            </div>
            {(!products || products.length === 0) && (
                <div className="text-center py-12 text-slate-500">
                    No products found.
                </div>
            )}
        </div>
    );
}
