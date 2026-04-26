"use client";

import { useState, useRef, useEffect } from "react";
import { ShoppingBasket, Check } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Product } from "@/types";

interface ProductAddToCartProps {
    product: Product;
}

export default function ProductAddToCart({ product }: ProductAddToCartProps) {
    const { addToCart } = useCart();
    const [added, setAdded] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const handleAdd = () => {
        addToCart(product, 1);
        setAdded(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setAdded(false), 1400);
    };

    const isOutOfStock = product.stock === 0;

    return (
        <button
            onClick={handleAdd}
            disabled={isOutOfStock}
            aria-label={`Add ${product.name} to basket`}
            className={`btn-primary w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-300 ${
                added
                    ? "bg-leaf text-white scale-[0.98]"
                    : isOutOfStock
                    ? "opacity-40 cursor-not-allowed"
                    : ""
            }`}
        >
            {added ? (
                <>
                    <Check size={20} />
                    Added to basket
                </>
            ) : (
                <>
                    <ShoppingBasket size={20} />
                    {isOutOfStock ? "Out of stock" : "Add to basket"}
                </>
            )}
        </button>
    );
}
