"use client";

import { ShoppingBasket, X, Minus, Plus, ArrowRight } from "lucide-react";
import { CartItem } from "@/types";

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

    const freeDeliveryThreshold = 60;
    const deliveryFee = total >= freeDeliveryThreshold ? 0 : 3.99;
    const remaining = Math.max(0, freeDeliveryThreshold - total);
    const progress = Math.min(100, (total / freeDeliveryThreshold) * 100);

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={close}
            />
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="p-4 bg-emerald-900 text-white flex items-center justify-between shadow-md">
                    <h2 className="text-lg font-bold flex items-center gap-2 font-serif">
                        <ShoppingBasket size={24} className="text-amber-400" />
                        Your Trolley
                    </h2>
                    <button
                        onClick={close}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Free Delivery Progress */}
                <div className="bg-slate-50 p-3 border-b border-slate-200">
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                        <span>
                            {remaining > 0
                                ? `Spend £${remaining.toFixed(2)} more for Free Delivery`
                                : "🎉 You've unlocked Free Delivery!"}
                        </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Cart Items */}
                <div className="flex-grow overflow-y-auto p-4 bg-white space-y-3">
                    {cart.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <ShoppingBasket size={48} className="mx-auto mb-4 opacity-30" />
                            <p className="font-bold">Your trolley is empty</p>
                            <p className="text-sm">Add items to get started</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div
                                key={item.id}
                                className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
                            >
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-16 h-16 object-cover rounded"
                                />
                                <div className="flex-grow">
                                    <h4 className="font-bold text-sm text-slate-900 line-clamp-1">
                                        {item.name}
                                    </h4>
                                    <p className="text-xs text-slate-500 mb-1">{item.unit}</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() =>
                                                    item.qty > 1
                                                        ? updateQty(item.id, item.qty - 1)
                                                        : removeFromCart(item.id)
                                                }
                                                className="p-1 text-slate-400 hover:text-slate-700"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className="text-sm font-bold px-2">{item.qty}</span>
                                            <button
                                                onClick={() => updateQty(item.id, item.qty + 1)}
                                                className="p-1 text-slate-400 hover:text-slate-700"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                        <span className="font-bold text-emerald-800">
                                            £{(item.price * item.qty).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-200">
                    <div className="space-y-1 mb-4 text-sm">
                        <div className="flex justify-between text-slate-600">
                            <span>Subtotal</span>
                            <span>£{total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                            <span>Delivery</span>
                            <span>
                                {deliveryFee === 0 ? "FREE" : `£${deliveryFee.toFixed(2)}`}
                            </span>
                        </div>
                        <div className="flex justify-between text-xl font-bold text-slate-900 pt-3 border-t border-slate-200 mt-2 font-serif">
                            <span>Total</span>
                            <span>£{(total + deliveryFee).toFixed(2)}</span>
                        </div>
                    </div>
                    <button
                        onClick={checkout}
                        disabled={cart.length === 0}
                        className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3.5 rounded shadow-lg shadow-emerald-900/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Checkout Securely <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
