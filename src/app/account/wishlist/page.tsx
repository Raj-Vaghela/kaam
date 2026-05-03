import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Heart } from "lucide-react";
import { toProduct } from "@/types";
import ProductCard from "@/components/product/ProductCard";

export default async function WishlistPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth?redirect=/account/wishlist");

    const { data: wishlistItems } = await supabase
        .from("user_wishlists")
        .select("product_id, products(id, name, category, price, image_url, unit, weight_kg, rating, bestseller, club_price, stock)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    const products = (wishlistItems ?? [])
        .map((item) => {
            const row = Array.isArray(item.products) ? item.products[0] : item.products;
            return row ? toProduct(row) : null;
        })
        .filter((p): p is NonNullable<typeof p> => p !== null);

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-10">
                <p className="text-xs font-semibold tracking-widest uppercase text-accent mb-2">
                    My account
                </p>
                <h1 className="font-display text-5xl text-ink flex items-center gap-3">
                    <Heart size={36} className="text-rose-500" />
                    Wishlist
                </h1>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
                {/* Sidebar */}
                <nav className="md:col-span-1 space-y-1">
                    <Link
                        href="/account"
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-ink-soft hover:bg-cream-soft transition-colors"
                    >
                        Profile
                    </Link>
                    <Link
                        href="/account/orders"
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-ink-soft hover:bg-cream-soft transition-colors"
                    >
                        Orders
                    </Link>
                    <Link
                        href="/account/wishlist"
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-accent-soft text-accent-deep font-semibold"
                    >
                        <Heart size={18} /> Wishlist
                    </Link>
                    <Link
                        href="/auth/signout"
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-rose hover:bg-cream-soft transition-colors"
                    >
                        Sign Out
                    </Link>
                </nav>

                {/* Main */}
                <div className="md:col-span-3">
                    {products.length === 0 ? (
                        <div className="bg-cream-soft border border-cream-deep rounded-3xl p-10 text-center">
                            <Heart size={40} className="text-ink-mute opacity-30 mx-auto mb-4" />
                            <p className="text-ink font-medium mb-2">Your wishlist is empty.</p>
                            <p className="text-sm text-ink-mute mb-6">
                                Start saving favourites by clicking the ❤ on any product.
                            </p>
                            <Link
                                href="/products"
                                className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm"
                            >
                                Browse products
                            </Link>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-ink-mute mb-6">
                                {products.length} saved {products.length === 1 ? "item" : "items"}
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                                {products.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
