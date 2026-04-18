import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/product/ProductCard";
import { toProduct } from "@/types";
import { BRAND } from "@/lib/brand";

interface Props {
    searchParams: Promise<{ category?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
    const { category } = await searchParams;
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://gajjuexpress.co.uk";

    if (category) {
        const title = `${category} — Authentic Indian Groceries`;
        const description = `Shop authentic ${category.toLowerCase()} at ${BRAND.name}. Hand-picked Indian and Gujarati brands, delivered to your door across the UK.`;
        return {
            title,
            description,
            alternates: { canonical: `${APP_URL}/products?category=${encodeURIComponent(category)}` },
            openGraph: { title, description, url: `${APP_URL}/products?category=${encodeURIComponent(category)}` },
        };
    }

    const title = "Indian Groceries & Pantry Staples";
    const description = `Shop ${BRAND.name}'s full range of authentic Indian groceries — spices, flours, snacks, dairy and more. Next-day delivery across the UK.`;
    return {
        title,
        description,
        alternates: { canonical: `${APP_URL}/products` },
        openGraph: { title, description, url: `${APP_URL}/products` },
    };
}

export default async function ProductsPage({ searchParams }: Props) {
    const { category } = await searchParams;
    const supabase = await createClient();

    // Only fetch the columns toProduct() actually needs
    let query = supabase
        .from("products")
        .select("id, name, category, price, image_url, unit, weight_kg, rating, bestseller, club_price");

    if (category) {
        query = query.eq("category", category);
    }

    const { data: products } = await query;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="mb-12 max-w-3xl">
                <p className="text-xs font-semibold tracking-widest uppercase text-accent mb-3">
                    {category ? category : "The pantry"}
                </p>
                <h1 className="font-display text-5xl sm:text-6xl text-ink mb-4 leading-[1]">
                    {category ? `${category} collection.` : "Every aisle of an Indian kitchen."}
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
                    <p className="font-display text-2xl mb-2">
                        {category ? `No products found in "${category}".` : "The shelves are being restocked."}
                    </p>
                    <p>Check back soon.</p>
                </div>
            )}
        </div>
    );
}
