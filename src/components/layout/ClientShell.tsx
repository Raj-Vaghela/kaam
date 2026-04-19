"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TrolleyDrawer from "@/components/layout/TrolleyDrawer";
import { useCart } from "@/context/CartContext";
import { usePathname } from "next/navigation";

export default function ClientShell({ children }: { children: React.ReactNode }) {
    const {
        cart,
        cartOpen,
        setCartOpen,
        removeFromCart,
        updateQty,
        cartTotal,
        cartCount,
        checkout,
    } = useCart();

    const pathname = usePathname();
    const currentPath = pathname ? pathname.toLowerCase() : "";
    const isAuthPage = currentPath.startsWith("/auth");
    const isAdminPage = currentPath.startsWith("/admin");
    const isSpecialLayout = isAuthPage || isAdminPage;

    return (
        <div className="min-h-screen flex flex-col bg-cream text-ink">
            {!isSpecialLayout && (
                <Header
                    cartCount={cartCount}
                    cartTotal={cartTotal}
                    onCartClick={() => setCartOpen(true)}
                />
            )}
            <main className="flex-grow">{children}</main>
            {!isSpecialLayout && <Footer />}

            {!isSpecialLayout && (
                <TrolleyDrawer
                    isOpen={cartOpen}
                    close={() => setCartOpen(false)}
                    cart={cart}
                    removeFromCart={removeFromCart}
                    updateQty={updateQty}
                    total={cartTotal}
                    checkout={checkout}
                />
            )}
        </div>
    );
}
