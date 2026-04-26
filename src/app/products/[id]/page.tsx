import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, ArrowLeft, Package, Scale } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { toProduct } from "@/types";
import { BRAND } from "@/lib/brand";
import ProductAddToCart from "./ProductAddToCart";
import RelatedProducts from "./RelatedProducts";
import ProductReviews from "./ProductReviews";

export const revalidate = 300;

interface Props {
    params: Promise<{ id: string }>;
}

async function fetchProduct(id: string) {
    const supabase = await createClient();
    const { data } = await supabase
        .from("products")
        .select("id, name, category, price, image_url, unit, weight_kg, rating, bestseller, club_price, stock")
        .eq("id", id)
        .single();
    return data ? toProduct(data) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://gajjuexpress.co.uk";
    const product = await fetchProduct(id);

    if (!product) {
        return { title: "Product not found" };
    }

    const title = `${product.name} — ${BRAND.name}`;
    const description = `Buy ${product.name} online from ${BRAND.name}. Authentic Indian ${product.category.toLowerCase()} delivered across the UK. ${product.unit}${product.weight_kg ? `, ${product.weight_kg} kg` : ""}.`;
    const url = `${APP_URL}/products/${id}`;

    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: {
            title,
            description,
            url,
            images: product.imgUrl ? [{ url: product.imgUrl, alt: product.name }] : [],
        },
    };
}

export default async function ProductDetailPage({ params }: Props) {
    const { id } = await params;
    const supabase = await createClient();

    const [productRes, reviewsRes, userRes] = await Promise.all([
        supabase
            .from("products")
            .select("id, name, category, price, image_url, unit, weight_kg, rating, bestseller, club_price, stock")
            .eq("id", id)
            .single(),
        supabase
            .from("product_reviews")
            .select("id, rating, body, created_at, user_id")
            .eq("product_id", id)
            .order("created_at", { ascending: false }),
        supabase.auth.getUser(),
    ]);

    const product = productRes.data ? toProduct(productRes.data) : null;
    if (!product) {
        notFound();
    }

    const reviews = reviewsRes.data ?? [];
    const currentUser = userRes.data.user;

    // Compute review stats from fetched reviews (prefer live data, fall back to stored rating)
    const reviewCount = reviews.length;
    const avgRating =
        reviewCount > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
            : product.rating;

    const finalPrice = product.clubPrice ?? product.price;
    const savings = product.clubPrice != null ? (product.price - product.clubPrice).toFixed(2) : null;
    const inStock = product.stock > 0;

    // Build star display
    const fullStars = Math.floor(avgRating);
    const hasHalf = avgRating - fullStars >= 0.5;

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Back link */}
            <Link
                href={`/products?category=${encodeURIComponent(product.category)}`}
                className="inline-flex items-center gap-2 text-sm text-ink-mute hover:text-accent transition-colors mb-8"
            >
                <ArrowLeft size={16} />
                Back to {product.category}
            </Link>

            {/* Main layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[45%_55%] gap-8 lg:gap-12">
                {/* Left: image */}
                <div className="relative">
                    <div className="bg-cream-soft border border-cream-deep rounded-3xl overflow-hidden aspect-square relative">
                        <Image
                            src={product.imgUrl}
                            alt={product.name}
                            fill
                            sizes="(max-width: 1024px) 100vw, 45vw"
                            className="object-cover"
                            priority
                        />
                        {/* Badges overlaid on image */}
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                            {product.bestseller && (
                                <span className="bg-haldi text-ink text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                                    Bestseller
                                </span>
                            )}
                            {savings && (
                                <span className="bg-accent text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                                    Save £{savings}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: details */}
                <div className="flex flex-col">
                    {/* Category */}
                    <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-2">
                        {product.category}
                    </p>

                    {/* Product name */}
                    <h1 className="font-display text-4xl sm:text-5xl text-ink leading-tight mb-4">
                        {product.name}
                    </h1>

                    {/* Rating — shows live review data */}
                    <div className="flex items-center gap-2 mb-6">
                        <div className="flex items-center gap-0.5 text-haldi" aria-label={`Rating: ${avgRating.toFixed(1)} out of 5`}>
                            {Array.from({ length: 5 }).map((_, i) => {
                                const filled = i < fullStars;
                                const half = !filled && i === fullStars && hasHalf;
                                return (
                                    <Star
                                        key={i}
                                        size={16}
                                        fill={filled ? "currentColor" : half ? "url(#half)" : "none"}
                                        className={filled || half ? "text-haldi" : "text-ink-mute opacity-30"}
                                    />
                                );
                            })}
                        </div>
                        <span className="text-sm font-semibold text-ink-soft">{avgRating.toFixed(1)}</span>
                        <span className="text-sm text-ink-mute">
                            ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
                        </span>
                    </div>

                    {/* Price */}
                    <div className="bg-cream-soft border border-cream-deep rounded-2xl p-5 mb-6">
                        <div className="flex items-baseline gap-3 flex-wrap">
                            <span className="font-display text-5xl text-ink">
                                £{finalPrice.toFixed(2)}
                            </span>
                            {product.clubPrice != null && (
                                <>
                                    <span className="text-xl text-ink-mute line-through">
                                        £{product.price.toFixed(2)}
                                    </span>
                                    <span className="bg-accent/10 text-accent text-sm font-bold px-3 py-1 rounded-full">
                                        Save £{savings}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Unit & weight */}
                    <div className="flex items-center gap-4 mb-6 text-sm text-ink-mute">
                        <span className="flex items-center gap-1.5">
                            <Package size={14} className="shrink-0" />
                            {product.unit}
                        </span>
                        {product.weight_kg > 0 && (
                            <span className="flex items-center gap-1.5">
                                <Scale size={14} className="shrink-0" />
                                {product.weight_kg} kg
                            </span>
                        )}
                    </div>

                    {/* Stock status */}
                    <div className="mb-6">
                        {inStock ? (
                            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-leaf">
                                <span className="w-2 h-2 rounded-full bg-leaf" />
                                In stock
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-500">
                                <span className="w-2 h-2 rounded-full bg-rose-500" />
                                Out of stock
                            </span>
                        )}
                    </div>

                    {/* Add to basket — client component */}
                    <div className="mb-8">
                        <ProductAddToCart product={product} />
                    </div>

                    {/* Back link (secondary, bottom of right column) */}
                    <Link
                        href={`/products?category=${encodeURIComponent(product.category)}`}
                        className="inline-flex items-center gap-2 text-sm text-ink-mute hover:text-accent transition-colors mt-auto"
                    >
                        <ArrowLeft size={14} />
                        Back to {product.category}
                    </Link>
                </div>
            </div>

            {/* Product details section */}
            <div className="mt-12 bg-cream-soft border border-cream-deep rounded-3xl p-6 sm:p-8">
                <h2 className="font-display text-2xl text-ink mb-6">Product details</h2>
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5">
                    <div>
                        <dt className="text-xs font-semibold uppercase tracking-widest text-ink-mute mb-1">
                            Category
                        </dt>
                        <dd className="text-sm font-medium text-ink">{product.category}</dd>
                    </div>
                    <div>
                        <dt className="text-xs font-semibold uppercase tracking-widest text-ink-mute mb-1">
                            Unit
                        </dt>
                        <dd className="text-sm font-medium text-ink">{product.unit}</dd>
                    </div>
                    {product.weight_kg > 0 && (
                        <div>
                            <dt className="text-xs font-semibold uppercase tracking-widest text-ink-mute mb-1">
                                Weight
                            </dt>
                            <dd className="text-sm font-medium text-ink">{product.weight_kg} kg</dd>
                        </div>
                    )}
                </dl>
            </div>

            {/* Related products */}
            <RelatedProducts productId={id} category={product.category} />

            {/* Customer reviews */}
            <ProductReviews
                productId={id}
                initialReviews={reviews}
                currentUserId={currentUser?.id ?? null}
            />
        </div>
    );
}
