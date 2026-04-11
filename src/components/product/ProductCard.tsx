"use client";

import { Star, Plus, Check } from "lucide-react";
import { useState } from "react";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const { addToCart } = useCart();
    const [added, setAdded] = useState(false);

    const finalPrice = product.clubPrice || product.price;

    const handleAdd = () => {
        addToCart(product, 1);
        setAdded(true);
        setTimeout(() => setAdded(false), 1400);
    };

    return (
        <div className="group bg-cream-soft border border-cream-deep rounded-3xl overflow-hidden flex flex-col hover:shadow-[var(--shadow-lift)] hover:-translate-y-1 transition-all duration-300">
            {/* Image */}
            <div className="relative aspect-square bg-white overflow-hidden">
                <img
                    src={product.imgUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {product.bestseller && (
                        <span className="bg-haldi text-ink text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                            Bestseller
                        </span>
                    )}
                    {product.clubPrice && (
                        <span className="bg-accent text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                            Save £{(product.price - finalPrice).toFixed(2)}
                        </span>
                    )}
                </div>
                {/* Quick add button */}
                <button
                    onClick={handleAdd}
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
                    {product.clubPrice && (
                        <span className="text-sm text-ink-mute line-through">
                            £{product.price.toFixed(2)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
