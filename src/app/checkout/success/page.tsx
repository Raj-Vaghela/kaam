"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Package, ArrowRight, UserPlus, Mail } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function CheckoutSuccessPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const orderId = searchParams.get("order_id");
    const paymentIntent = searchParams.get("payment_intent");
    const redirectStatus = searchParams.get("redirect_status");
    const { clearCart } = useCart();
    const [cleared, setCleared] = useState(false);

    useEffect(() => {
        if (!cleared && redirectStatus === "succeeded") {
            clearCart();
            setCleared(true);
        }
    }, [cleared, clearCart, redirectStatus]);

    return (
        <div className="max-w-2xl mx-auto px-4 py-20">
            <div className="text-center mb-10">
                <div className="w-24 h-24 bg-leaf-soft rounded-full flex items-center justify-center mx-auto mb-7">
                    <CheckCircle size={52} className="text-leaf" strokeWidth={1.6} />
                </div>
                <p className="text-xs font-semibold tracking-widest uppercase text-leaf mb-3">
                    Order confirmed
                </p>
                <h1 className="font-display text-5xl text-ink mb-3 leading-tight">
                    Bahot bahot dhanyavaad!
                </h1>
                <p className="text-lg text-ink-mute">
                    Your order is being prepared with love. Check your inbox in a moment.
                </p>
            </div>

            <div className="bg-cream-soft border border-cream-deep rounded-3xl p-8 mb-6">
                <div className="flex items-start gap-4 mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
                        <Mail size={22} />
                    </div>
                    <div>
                        <h2 className="font-display text-xl text-ink mb-1">Email on its way</h2>
                        <p className="text-sm text-ink-mute">
                            We've sent your invoice and tracking link to the email on file.
                        </p>
                    </div>
                </div>
                {token && (
                    <Link
                        href={`/orders/${token}`}
                        className="inline-flex items-center gap-2 text-accent font-semibold text-sm hover:gap-3 transition-all"
                    >
                        <Package size={16} />
                        Track your order
                        <ArrowRight size={14} />
                    </Link>
                )}
                {orderId && !token && (
                    <Link
                        href="/account/orders"
                        className="inline-flex items-center gap-2 text-accent font-semibold text-sm hover:gap-3 transition-all"
                    >
                        <Package size={16} /> View order in your account
                        <ArrowRight size={14} />
                    </Link>
                )}
            </div>

            {token && (
                <div className="bg-[var(--gajju-teal-deep)] text-cream rounded-3xl p-8 mb-6">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-haldi/20 text-haldi flex items-center justify-center shrink-0">
                            <UserPlus size={22} />
                        </div>
                        <div>
                            <h2 className="font-display text-xl text-cream mb-1">
                                Make it easier next time
                            </h2>
                            <p className="text-sm text-cream/70">
                                Create a free account to track every order and re-order
                                favourites in one tap.
                            </p>
                        </div>
                    </div>
                    <Link
                        href={`/orders/${token}/create-account`}
                        className="inline-flex items-center gap-2 bg-accent hover:bg-[var(--gajju-terracotta-deep)] text-white px-6 py-3 rounded-full font-semibold text-sm transition-colors"
                    >
                        Create my account <ArrowRight size={14} />
                    </Link>
                </div>
            )}

            <div className="text-center">
                <Link
                    href="/products"
                    className="btn-secondary inline-flex items-center gap-2 px-8 py-3.5"
                >
                    Continue shopping
                </Link>
            </div>
        </div>
    );
}
