"use client";

import { createContext, useContext, useState, useMemo, ReactNode, useEffect } from "react";
import { Product, CartItem } from "@/types";
import { useRouter } from "next/navigation";

interface CartContextType {
    cart: CartItem[];
    cartOpen: boolean;
    setCartOpen: (open: boolean) => void;
    addToCart: (product: Product, qty: number) => void;
    removeFromCart: (id: string) => void;
    updateQty: (id: string, qty: number) => void;
    checkout: () => void;
    clearCart: () => void;
    cartTotal: number;
    cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "desimart-cart";

export function CartProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [cartOpen, setCartOpen] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);
    const router = useRouter();

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch {
                localStorage.removeItem(CART_STORAGE_KEY);
            }
        }
        setIsHydrated(true);
    }, []);

    // Save cart to localStorage on change
    useEffect(() => {
        if (isHydrated) {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        }
    }, [cart, isHydrated]);

    const addToCart = (product: Product, qty: number) => {
        const finalPrice = product.clubPrice || product.price;
        setCart((prev) => {
            const existing = prev.find((item) => item.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.id === product.id ? { ...item, qty: item.qty + qty } : item
                );
            }
            return [
                ...prev,
                {
                    id: product.id,
                    name: product.name,
                    price: finalPrice,
                    image: product.imgUrl,
                    category: product.category,
                    qty: qty,
                    unit: product.unit,
                },
            ];
        });
        setCartOpen(true);
    };

    const removeFromCart = (id: string) =>
        setCart((prev) => prev.filter((item) => item.id !== id));

    const updateQty = (id: string, newQty: number) =>
        setCart((prev) =>
            prev.map((item) => (item.id === id ? { ...item, qty: newQty } : item))
        );

    const clearCart = () => {
        setCart([]);
        localStorage.removeItem(CART_STORAGE_KEY);
    };

    const checkout = () => {
        setCartOpen(false);
        router.push("/checkout");
    };

    const cartTotal = useMemo(
        () => cart.reduce((total, item) => total + item.price * item.qty, 0),
        [cart]
    );

    const cartCount = useMemo(
        () => cart.reduce((count, item) => count + item.qty, 0),
        [cart]
    );

    return (
        <CartContext.Provider
            value={{
                cart,
                cartOpen,
                setCartOpen,
                addToCart,
                removeFromCart,
                updateQty,
                checkout,
                clearCart,
                cartTotal,
                cartCount,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
