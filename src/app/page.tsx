import { createClient } from "@/lib/supabase/server";
import HeroSection from "@/components/home/HeroSection";
import HomeFeatures from "@/components/home/HomeFeatures";
import ProductCard from "@/components/product/ProductCard";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default async function HomePage() {
    const supabase = await createClient();
    const { data: bestsellers } = await supabase
        .from("products")
        .select("*")
        .eq("bestseller", true)
        .limit(4);

    return (
        <div>
            <HeroSection />

            {/* Bestsellers */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <div className="flex items-end justify-between mb-10">
                    <div>
                        <p className="text-xs font-semibold tracking-widest uppercase text-accent mb-2">
                            Loved by our regulars
                        </p>
                        <h2 className="font-display text-4xl sm:text-5xl text-ink">
                            Top picks this week
                        </h2>
                    </div>
                    <Link
                        href="/products"
                        className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-[var(--gajju-teal-deep)] hover:text-accent transition-colors"
                    >
                        View all <ChevronRight size={16} />
                    </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
                    {bestsellers?.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={{
                                id: product.id,
                                name: product.name,
                                category: product.category,
                                price: Number(product.price),
                                imgUrl: product.image_url || "https://placehold.co/400",
                                unit: product.unit,
                                weight_kg: 0,
                                rating: product.rating || 0,
                                bestseller: product.bestseller || false,
                                clubPrice: product.club_price ? Number(product.club_price) : null,
                            }}
                        />
                    ))}
                </div>
            </section>

            <HomeFeatures />
        </div>
    );
}
