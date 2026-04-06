import { createClient } from "@/lib/supabase/server";
import HeroSection from "@/components/home/HeroSection";
import HomeFeatures from "@/components/home/HomeFeatures";
import ProductCard from "@/components/product/ProductCard";
import Link from "next/link";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: bestsellers } = await supabase
    .from("products")
    .select("*")
    .eq("bestseller", true)
    .limit(4);

  return (
    <div className="max-w-screen-2xl mx-auto">
      <HeroSection />

      {/* Featured Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-serif font-bold text-slate-900">
            Top Picks for You
          </h2>
          <Link href="/products" className="text-emerald-700 font-bold hover:underline">
            View All
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
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
              }}
            />
          ))}
        </div>
      </section>

      <HomeFeatures />
    </div>
  );
}
