"use client";

import { ShoppingBag, X, Minus, Plus, ArrowRight, Trash2 } from "lucide-react";
import { CartItem } from "@/types";
import Link from "next/link";

interface TrolleyDrawerProps {
    isOpen: boolean;
    close: () => void;
    cart: CartItem[];
    removeFromCart: (id: string) => void;
    updateQty: (id: string, newQty: number) => void;
    total: number;
    checkout: () => void;
}

export default function TrolleyDrawer({
    isOpen,
    close,
    cart,
    removeFromCart,
    updateQty,
    total,
    checkout,
}: TrolleyDrawerProps) {
    if (!isOpen) return null;

    const freeDeliveryThreshold = 40;
    const deliveryFee = total >= freeDeliveryThreshold ? 0 : 3.99;
    const remaining = Math.max(0, freeDeliveryThreshold - total);
    const progress = Math.min(100, (total / freeDeliveryThreshold) * 100);

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div
                className="absolute inset-0 bg-[var(--gajju-ink)]/50 backdrop-blur-sm"
                onClick={close}
            />
            <div className="relative w-full max-w-md bg-cream h-full shadow-2xl flex flex-col animate-in slide-in-from-right">
                {/* Header */}
                <div className="p-5 bg-[var(--gajju-teal-deep)] text-cream flex items-center justify-between">
                    <h2 className="font-display text-2xl flex items-center gap-3">
                        <ShoppingBag size={22} className="text-haldi" />
                        Your basket
                    </h2>
                    <button
                        onClick={close}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        aria-label="Close basket"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Free delivery progress */}
                <div className="bg-cream-soft p-4 border-b border-cream-deep">
                    <div className="flex justify-between text-xs font-medium text-ink-soft mb-2">
                        <span>
                            {remaining > 0 ? (
                                <>
                                    Add <strong className="text-accent">£{remaining.toFixed(2)}</strong>{" "}
                                    more for free delivery
                                </>
                            ) : (
                                <strong className="text-leaf">🎉 Free delivery unlocked!</strong>
                            )}
                        </span>
                    </div>
                    <div className="w-full bg-cream-deep rounded-full h-1.5 overflow-hidden">
                        <div
                            className="bg-accent h-full rounded-full transition-all duration-700"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Items */}
                <div className="flex-grow overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="text-center py-16 text-ink-mute">
                            <ShoppingBag size={56} className="mx-auto mb-5 text-cream-deep" strokeWidth={1.4} />
                            <p className="font-display text-2xl text-ink mb-1">Empty basket</p>
                            <p className="text-sm">Add some treats to get started.</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div
                                key={item.id}
                                className="flex gap-3 p-3 bg-cream-soft rounded-2xl border border-cream-deep"
                            >
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-20 h-20 object-cover rounded-xl bg-white"
                                />
                                <div className="flex-grow min-w-0">
                                    <div className="flex justify-between items-start gap-2">
                                        <h4 className="font-display text-sm text-ink line-clamp-2 leading-tight">
                                            {item.name}
                                        </h4>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-ink-mute hover:text-rose transition-colors shrink-0"
                                            aria-label="Remove"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-ink-mute mb-2">{item.unit}</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center bg-white border border-cream-deep rounded-full overflow-hidden">
                                            <button
                                                onClick={() =>
                                                    item.qty > 1
                                                        ? updateQty(item.id, item.qty - 1)
                                                        : removeFromCart(item.id)
                                                }
                                                className="p-1.5 text-ink-soft hover:text-accent"
                                                aria-label="Decrease"
                                            >
                                                <Minus size={13} />
                                            </button>
                                            <span className="px-3 text-sm font-semibold text-ink">
                                                {item.qty}
                                            </span>
                                            <button
                                                onClick={() => updateQty(item.id, item.qty + 1)}
                                                className="p-1.5 text-ink-soft hover:text-accent"
                                                aria-label="Increase"
                                            >
                                                <Plus size={13} />
                                            </button>
                                        </div>
                                        <span className="font-display text-base text-ink">
                                            £{(item.price * item.qty).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 bg-cream-soft border-t border-cream-deep">
                    <div className="space-y-2 mb-4 text-sm">
                        <div className="flex justify-between text-ink-soft">
                            <span>Subtotal</span>
                            <span>£{total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-ink-soft">
                            <span>Delivery</span>
                            <span className={deliveryFee === 0 ? "text-leaf font-semibold" : ""}>
                                {deliveryFee === 0 ? "FREE" : `£${deliveryFee.toFixed(2)}`}
                            </span>
                        </div>
                        <div className="flex justify-between font-display text-2xl text-ink pt-3 border-t border-cream-deep">
                            <span>Total</span>
                            <span>£{(total + deliveryFee).toFixed(2)}</span>
                        </div>
                    </div>
                    <button
                        onClick={checkout}
                        disabled={cart.length === 0}
                        className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Checkout securely <ArrowRight size={18} />
                    </button>
                    <Link
                        href="/products"
                        onClick={close}
                        className="block text-center mt-3 text-xs text-ink-mute hover:text-accent"
                    >
                        or continue shopping
                    </Link>
                </div>
            </div>
        </div>
    );
}
