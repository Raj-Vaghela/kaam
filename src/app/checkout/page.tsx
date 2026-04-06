"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { createCheckoutSession } from "@/app/actions";
import { ArrowLeft, CreditCard, Loader2, ShoppingBag, Truck, User, Mail } from "lucide-react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

export default function CheckoutPage() {
    const { cart, cartTotal, cartCount } = useCart();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userEmail, setUserEmail] = useState("");

    // Check if user is logged in
    useEffect(() => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                setIsLoggedIn(true);
                setUserEmail(user.email || "");
                setShippingInfo((prev) => ({ ...prev, email: user.email || "" }));
            }
        });
    }, []);

    // Shipping form state
    const [shippingInfo, setShippingInfo] = useState({
        fullName: "",
        email: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        postcode: "",
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setShippingInfo((prev) => ({ ...prev, [name]: value }));
    };

    const handleCheckout = async () => {
        if (!shippingInfo.fullName || !shippingInfo.addressLine1 || !shippingInfo.city || !shippingInfo.postcode) {
            setError("Please fill in all required shipping fields.");
            return;
        }

        if (!shippingInfo.email) {
            setError("Email is required for order confirmation.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const result = await createCheckoutSession(cart, shippingInfo);

            if (!result.success) {
                throw new Error(result.error || "Failed to create checkout session");
            }

            // Redirect to Stripe Checkout
            if (result.url) {
                window.location.href = result.url;
            }
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    // Calculate VAT (20%)
    const vatAmount = cartTotal * 0.2;
    const totalWithVat = cartTotal + vatAmount;

    if (cart.length === 0) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                <ShoppingBag size={64} className="mx-auto text-slate-300 mb-6" />
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Your cart is empty</h1>
                <p className="text-slate-500 mb-6">Add some items to your cart to checkout.</p>
                <Link
                    href="/products"
                    className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-emerald-700 transition-colors"
                >
                    Browse Products
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <Link
                href="/"
                className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium mb-8"
            >
                <ArrowLeft size={16} />
                Continue Shopping
            </Link>

            <h1 className="text-3xl font-serif font-bold text-slate-900 mb-8">Checkout</h1>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Left: Form */}
                <div className="space-y-6">
                    {/* Guest vs Login Option */}
                    {!isLoggedIn && (
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-slate-900">Have an account?</p>
                                    <p className="text-sm text-slate-500">Sign in for faster checkout</p>
                                </div>
                                <Link
                                    href="/auth?redirect=/checkout"
                                    className="px-4 py-2 text-sm font-medium text-emerald-700 border border-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                                >
                                    Sign In
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Contact Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Mail size={20} className="text-emerald-600" />
                            Contact Information
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={shippingInfo.email}
                                    onChange={handleInputChange}
                                    required
                                    disabled={isLoggedIn}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 disabled:text-slate-600"
                                    placeholder="you@example.com"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    We'll send your order confirmation and invoice here
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Truck size={20} className="text-emerald-600" />
                            Delivery Address
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={shippingInfo.fullName}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={shippingInfo.phone}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="+44 7123 456789"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Address Line 1 *
                                </label>
                                <input
                                    type="text"
                                    name="addressLine1"
                                    value={shippingInfo.addressLine1}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="123 High Street"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Address Line 2
                                </label>
                                <input
                                    type="text"
                                    name="addressLine2"
                                    value={shippingInfo.addressLine2}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="Flat 2"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        City *
                                    </label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={shippingInfo.city}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="London"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Postcode *
                                    </label>
                                    <input
                                        type="text"
                                        name="postcode"
                                        value={shippingInfo.postcode}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="SW1A 1AA"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Order Summary */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-4">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">
                            Order Summary ({cartCount} items)
                        </h2>

                        <div className="space-y-4 max-h-60 overflow-y-auto">
                            {cart.map((item) => (
                                <div key={item.id} className="flex gap-4">
                                    <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <h3 className="text-sm font-medium text-slate-900 truncate">
                                            {item.name}
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            Qty: {item.qty} × £{item.price.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="text-sm font-bold text-slate-900">
                                        £{(item.price * item.qty).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-slate-200 mt-4 pt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Subtotal</span>
                                <span className="font-medium">£{cartTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">VAT (20%)</span>
                                <span className="font-medium">£{vatAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Delivery</span>
                                <span className="font-medium text-emerald-600">FREE</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200">
                                <span>Total</span>
                                <span className="text-emerald-700">£{totalWithVat.toFixed(2)}</span>
                            </div>
                        </div>

                        {error && (
                            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleCheckout}
                            disabled={loading}
                            className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CreditCard size={20} />
                                    Pay £{totalWithVat.toFixed(2)}
                                </>
                            )}
                        </button>

                        <p className="mt-4 text-xs text-center text-slate-500">
                            Secure payment powered by Stripe. Your card details are never stored.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
