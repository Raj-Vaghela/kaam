"use client";

import { Star, Plus, Minus } from "lucide-react";
import { useState } from "react";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const { addToCart } = useCart();
    const [qty, setQty] = useState(1);

    const handleAdd = () => {
        addToCart(product, qty);
        setQty(1);
    };

    const finalPrice = product.clubPrice || product.price;

    return (
        <div className="group bg-white rounded-lg border border-slate-200 hover:shadow-lg hover:border-emerald-200 transition-all duration-300 flex flex-col overflow-hidden">
            {/* Image */}
            <div className="relative overflow-hidden aspect-square bg-slate-50">
                <img
                    src={product.imgUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {product.bestseller && (
                    <span className="absolute top-2 left-2 bg-amber-400 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase">
                        Best Seller
                    </span>
                )}
                {product.clubPrice && (
                    <span className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">
                        CLUB DEAL
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="p-3 flex flex-col flex-grow">
                <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider mb-1">
                    {product.category}
                </p>
                <h3 className="font-serif font-bold text-slate-900 text-sm leading-tight mb-1 group-hover:text-emerald-800 transition-colors line-clamp-2 min-h-[2.5rem]">
                    {product.name}
                </h3>

                <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center text-amber-500">
                        <Star size={12} fill="currentColor" />
                        <span className="text-xs text-slate-700 ml-1 font-bold">
                            {product.rating}
                        </span>
                    </div>
                    <span className="text-slate-400 text-xs">{product.unit}</span>
                </div>

                <div className="flex items-baseline gap-2 mt-auto mb-2">
                    <span className="text-lg font-black text-emerald-800">
                        £{finalPrice.toFixed(2)}
                    </span>
                    {product.clubPrice && (
                        <span className="text-xs text-slate-400 line-through">
                            £{product.price.toFixed(2)}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center border border-slate-300 rounded overflow-hidden">
                        <button
                            onClick={() => setQty(Math.max(1, qty - 1))}
                            className="p-1.5 text-slate-500 hover:bg-slate-100"
                        >
                            <Minus size={14} />
                        </button>
                        <span className="px-3 text-sm font-bold">{qty}</span>
                        <button
                            onClick={() => setQty(qty + 1)}
                            className="p-1.5 text-slate-500 hover:bg-slate-100"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                    <button
                        onClick={handleAdd}
                        className="flex-grow bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold py-2 rounded transition-colors"
                    >
                        Add to Trolley
                    </button>
                </div>
            </div>
        </div>
    );
}
