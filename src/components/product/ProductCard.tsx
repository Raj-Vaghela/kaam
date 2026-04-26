"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Plus, Check, Heart } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { toggleWishlist, isWishlisted } from "@/app/actions/wishlist-actions";

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const { addToCart } = useCart();
    const [added, setAdded] = useState(false);
    const [wishlisted, setWishlisted] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        isWishlisted(product.id).then(setWishlisted).catch(() => {});
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [product.id]);

    const finalPrice = product.clubPrice ?? product.price;

    const handleAdd = () => {
        addToCart(product, 1);
        setAdded(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setAdded(false), 1400);
    };

    const handleWishlist = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        const result = await toggleWishlist(product.id);
        setWishlisted(result.wishlisted);
    };

    return (
        <Link
            href={`/products/${product.id}`}
            className="group bg-cream-soft border border-cream-deep rounded-3xl overflow-hidden flex flex-col hover:shadow-[var(--shadow-lift)] hover:-translate-y-1 transition-all duration-300"
        >
            {/* Image */}
            <div className="relative aspect-square bg-white overflow-hidden">
                <Image
                    src={product.imgUrl}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {product.bestseller && (
                        <span className="bg-haldi text-ink text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                            Bestseller
                        </span>
                    )}
                    {product.clubPrice != null && (
                        <span className="bg-accent text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                            Save £{(product.price - finalPrice).toFixed(2)}
                        </span>
                    )}
                </div>

                {/* Wishlist heart button */}
                <button
                    onClick={handleWishlist}
                    aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                    className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-[var(--shadow-bloom)] transition-all duration-300 bg-white/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 ${wishlisted ? "text-rose-500 opacity-100" : "text-ink-mute hover:text-rose-500"}`}
                >
                    <Heart
                        size={17}
                        fill={wishlisted ? "currentColor" : "none"}
                        strokeWidth={2}
                    />
                </button>

                {/* Quick add button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleAdd();
                    }}
                    aria-label={`Add ${product.name}`}
                    className={`absolute bottom-3 right-3 w-11 h-11 rounded-full flex items-center justify-center shadow-[var(--shadow-bloom)] transition-all duration-300 ${added
                            ? "bg-leaf text-white scale-110"
                            : "bg-accent text-white hover:bg-[var(--gajju-terracotta-deep)] opacity-0 group-hover:opacity-100"
                        }`}
                >
                    {added ? <Check size={20} /> : <Plus size={22} />}
                </button>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-grow">
                <p className="text-[10px] text-accent font-semibold uppercase tracking-widest mb-1.5">
                    {product.category}
                </p>
                <h3 className="font-display text-base leading-snug text-ink mb-2 line-clamp-2 min-h-[2.6rem]">
                    {product.name}
                </h3>

                <div className="flex items-center gap-2 mb-3 text-xs">
                    <div className="flex items-center gap-1 text-haldi">
                        <Star size={12} fill="currentColor" />
                        <span className="text-ink-soft font-semibold">{product.rating}</span>
                    </div>
                    <span className="text-ink-mute">·</span>
                    <span className="text-ink-mute">{product.unit}</span>
                </div>

                <div className="flex items-baseline gap-2 mt-auto">
                    <span className="font-display text-2xl text-ink-soft">
                        £{finalPrice.toFixed(2)}
                    </span>
                    {product.clubPrice != null && (
                        <span className="text-sm text-ink-mute line-through">
                            £{product.price.toFixed(2)}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
