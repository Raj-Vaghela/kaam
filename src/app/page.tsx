"use client";

import { useState, useMemo } from "react";
import { MessageSquare } from "lucide-react";
import { MOCK_PRODUCTS } from "@/data/mockData";
import { Product, CartItem } from "@/types";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import HomeFeatures from "@/components/home/HomeFeatures";
import TrolleyDrawer from "@/components/layout/TrolleyDrawer";

export default function HomePage() {
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);

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

  const checkout = async () => {
    // TODO: Integrate with Stripe
    alert("Redirecting to Secure Checkout...");
    const orderId = "ORD-" + Math.floor(Math.random() * 10000);
    alert(`Order ${orderId} placed successfully!`);
    setCart([]);
    setCartOpen(false);
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
    <div className="min-h-screen font-sans bg-slate-50 text-slate-900">
      <Header
        cartCount={cartCount}
        cartTotal={cartTotal}
        onCartClick={() => setCartOpen(true)}
      />

      <HeroSection />
      <HomeFeatures />

      <Footer />

      <TrolleyDrawer
        isOpen={cartOpen}
        close={() => setCartOpen(false)}
        cart={cart}
        removeFromCart={removeFromCart}
        updateQty={updateQty}
        total={cartTotal}
        checkout={checkout}
      />

      {/* Support Chat Button */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 bg-slate-800 text-white p-3 rounded-full shadow-lg hover:bg-slate-700 transition-colors z-40 flex items-center gap-2 pr-5"
        >
          <div className="bg-emerald-500 rounded-full p-1.5">
            <MessageSquare size={18} fill="white" className="text-emerald-500" />
          </div>
          <span className="font-bold text-sm">Help & Support</span>
        </button>
      )}
    </div>
  );
}
