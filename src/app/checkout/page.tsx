"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { createPaymentIntent } from "@/app/actions";
import {
    ArrowLeft,
    Loader2,
    ShoppingBag,
    Lock,
} from "lucide-react";
import Link from "next/link";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe, stripeAppearance } from "@/lib/stripe-client";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import { createClient } from "@/lib/supabase/client";
import { calculateVAT } from "@/lib/invoice";

const stripePromise = getStripe();

export default function CheckoutPage() {
    const { cart, cartTotal, cartCount } = useCart();

    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [guestToken, setGuestToken] = useState<string | null>(null);
    const [email, setEmail] = useState("");
    const [emailLocked, setEmailLocked] = useState(false);
    const [error, setError] = useState("");
    const [initializing, setInitializing] = useState(false);

    // Detect logged-in user email
    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user?.email) {
                setEmail(user.email);
                setEmailLocked(true);
            }
        });
    }, []);

    const startCheckout = async () => {
        if (!email) {
            setError("Please enter your email to continue.");
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError("Please enter a valid email address.");
            return;
        }
        setInitializing(true);
        setError("");
        const result = await createPaymentIntent({ cart, email });
        setInitializing(false);
        if (!result.success) {
            setError(result.error || "Could not start checkout");
            return;
        }
        setClientSecret(result.clientSecret!);
        setOrderId(result.orderId!);
        setGuestToken(result.guestToken || null);
    };

    const { vatAmount, total: totalWithVat } = calculateVAT(cartTotal);

    if (cart.length === 0) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-24 text-center">
                <ShoppingBag size={56} className="mx-auto text-cream-deep mb-6" strokeWidth={1.4} />
                <h1 className="font-display text-4xl text-ink mb-3">Your basket is empty</h1>
                <p className="text-ink-mute mb-8">Add a few treats first.</p>
                <Link href="/products" className="btn-primary inline-block px-8 py-3.5">
                    Browse the Pantry
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-ink-mute hover:text-accent mb-8 font-medium transition-colors"
            >
                <ArrowLeft size={16} /> Continue shopping
            </Link>

            <div className="mb-10">
                <p className="text-xs font-semibold tracking-widest uppercase text-accent mb-2">
                    Step 1 of 1
                </p>
                <h1 className="font-display text-5xl text-ink">Checkout</h1>
            </div>

            <div className="grid lg:grid-cols-5 gap-10">
                {/* Left: Form */}
                <div className="lg:col-span-3 space-y-6">
                    {!clientSecret ? (
                        <div className="bg-cream-soft border border-cream-deep rounded-3xl p-8">
                            <h2 className="font-display text-2xl text-ink mb-2">
                                Where should we send your receipt?
                            </h2>
                            <p className="text-sm text-ink-mute mb-6">
                                We'll send your order confirmation, invoice, and tracking link
                                here.
                            </p>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={emailLocked}
                                placeholder="you@example.com"
                                className="w-full px-5 py-4 rounded-2xl border border-cream-deep bg-white focus:outline-none focus:border-accent text-base disabled:bg-cream disabled:text-ink-mute"
                            />
                            {error && (
                                <div className="mt-4 bg-red-50 border border-red-100 text-rose px-4 py-3 rounded-xl text-sm">
                                    {error}
                                </div>
                            )}
                            <button
                                onClick={startCheckout}
                                disabled={initializing}
                                className="btn-primary w-full mt-6 py-4 text-base flex items-center justify-center gap-2"
                            >
                                {initializing && <Loader2 className="animate-spin" size={18} />}
                                Continue to Payment
                            </button>
                        </div>
                    ) : (
                        <Elements
                            stripe={stripePromise}
                            options={{
                                clientSecret,
                                appearance: stripeAppearance,
                                loader: "auto",
                            }}
                        >
                            <CheckoutForm
                                orderId={orderId!}
                                guestToken={guestToken}
                                email={email}
                                amount={totalWithVat}
                            />
                        </Elements>
                    )}
                </div>

                {/* Right: Summary */}
                <aside className="lg:col-span-2">
                    <div className="bg-cream-soft border border-cream-deep rounded-3xl p-6 sticky top-28">
                        <h2 className="font-display text-2xl text-ink mb-5">
                            Order summary
                        </h2>

                        <div className="space-y-4 max-h-72 overflow-y-auto pr-2 mb-5">
                            {cart.map((item) => (
                                <div key={item.id} className="flex gap-3">
                                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white shrink-0">
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[var(--gajju-teal-deep)] text-cream text-[10px] font-bold flex items-center justify-center">
                                            {item.qty}
                                        </span>
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <p className="text-sm font-medium text-ink line-clamp-1">
                                            {item.name}
                                        </p>
                                        <p className="text-xs text-ink-mute">{item.unit}</p>
                                    </div>
                                    <p className="text-sm font-semibold text-ink">
                                        £{(item.price * item.qty).toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-cream-deep pt-4 space-y-2 text-sm">
                            <div className="flex justify-between text-ink-soft">
                                <span>Subtotal ({cartCount} items)</span>
                                <span>£{cartTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-ink-soft">
                                <span>VAT (20%)</span>
                                <span>£{vatAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-ink-soft">
                                <span>Delivery</span>
                                <span className="text-leaf font-semibold">FREE</span>
                            </div>
                            <div className="flex justify-between font-display text-2xl text-ink pt-3 border-t border-cream-deep">
                                <span>Total</span>
                                <span>£{totalWithVat.toFixed(2)}</span>
                            </div>
                        </div>

                        <p className="mt-5 text-xs text-ink-mute flex items-center gap-1.5 justify-center">
                            <Lock size={11} /> Secured by Stripe · Cards never stored
                        </p>
                    </div>
                </aside>
            </div>
        </div>
    );
}
