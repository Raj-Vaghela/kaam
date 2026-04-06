"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Package, ArrowRight, UserPlus } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function CheckoutSuccessPage() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id");
    const token = searchParams.get("token");
    const { clearCart } = useCart();
    const [cleared, setCleared] = useState(false);

    // Clear cart on success
    useEffect(() => {
        if (!cleared) {
            clearCart();
            setCleared(true);
        }
    }, [cleared, clearCart]);

    return (
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
            <div className="mb-8">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={48} className="text-emerald-600" />
                </div>
                <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">
                    Thank You for Your Order!
                </h1>
                <p className="text-slate-600">
                    Your order has been confirmed and is being prepared for delivery.
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
                <div className="flex items-center justify-center gap-3 text-emerald-700 mb-4">
                    <Package size={24} />
                    <span className="font-bold">Order Confirmed</span>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                    We've sent a confirmation email with your invoice and order tracking link.
                </p>
                {token && (
                    <Link
                        href={`/orders/${token}`}
                        className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                        Track Your Order
                        <ArrowRight size={16} />
                    </Link>
                )}
            </div>

            {/* Account Creation Prompt (for guest users) */}
            {token && (
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 mb-8">
                    <div className="flex items-center justify-center gap-3 text-slate-700 mb-3">
                        <UserPlus size={24} />
                        <span className="font-bold">Create an Account</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-4">
                        Track all your orders in one place and re-order your favourites faster.
                    </p>
                    <Link
                        href={`/orders/${token}/create-account`}
                        className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors"
                    >
                        Create Account
                        <ArrowRight size={16} />
                    </Link>
                    <p className="text-xs text-slate-500 mt-3">
                        This is completely optional. Your order is confirmed regardless.
                    </p>
                </div>
            )}

            <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-emerald-700 transition-colors"
            >
                Continue Shopping
            </Link>
        </div>
    );
}
