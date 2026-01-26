"use client";

import { MapPin, Phone, MessageSquare } from "lucide-react";
import { useState } from "react";

export default function Footer() {
    const [email, setEmail] = useState("");
    const [subscribing, setSubscribing] = useState(false);

    const handleSubscribe = async () => {
        if (!email) return;
        setSubscribing(true);
        // TODO: Replace with Supabase newsletter subscription
        await new Promise((resolve) => setTimeout(resolve, 500));
        setSubscribing(false);
        setEmail("");
        alert("Subscribed! Thank you for joining our newsletter.");
    };

    return (
        <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 border-t border-emerald-900">
            <div className="max-w-7xl mx-auto px-4">
                {/* Top Section: Brand & Newsletter */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 border-b border-slate-800 pb-12">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-emerald-800 text-white p-1.5 rounded-sm">
                                <span className="font-serif font-black text-xl leading-none block">
                                    D
                                </span>
                            </div>
                            <h2 className="text-2xl font-serif font-bold text-white tracking-tight">
                                DESI<span className="text-emerald-500">MART</span>
                            </h2>
                        </div>
                        <p className="text-slate-400 text-sm max-w-md">
                            Bringing the authentic taste of India to UK homes since 2010.
                            Fresh ingredients, premium spices, and trusted brands delivered
                            to your door.
                        </p>
                    </div>
                    <div className="w-full md:w-auto bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                        <h3 className="text-white font-bold mb-2">Join our newsletter</h3>
                        <p className="text-xs text-slate-400 mb-4">
                            Get £10 off your first order over £60.
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                className="bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded text-sm focus:outline-none focus:border-emerald-500 w-full md:w-64"
                            />
                            <button
                                onClick={handleSubscribe}
                                disabled={subscribing}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm font-bold transition-colors disabled:opacity-50"
                            >
                                {subscribing ? "..." : "Subscribe"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Middle Section: Links */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                    <div>
                        <h4 className="text-white font-bold mb-4 font-serif text-lg">
                            Shop
                        </h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-emerald-400 transition-colors"
                                >
                                    New Arrivals
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-emerald-400 transition-colors"
                                >
                                    Best Sellers
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-emerald-400 transition-colors"
                                >
                                    Offers
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-emerald-400 transition-colors"
                                >
                                    Seasonal Specials
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-4 font-serif text-lg">
                            Help & Support
                        </h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-emerald-400 transition-colors"
                                >
                                    Delivery Information
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-emerald-400 transition-colors"
                                >
                                    Returns & Refunds
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-emerald-400 transition-colors"
                                >
                                    Track My Order
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-emerald-400 transition-colors"
                                >
                                    FAQs
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-4 font-serif text-lg">
                            About Us
                        </h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-emerald-400 transition-colors"
                                >
                                    Our Story
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-emerald-400 transition-colors"
                                >
                                    Careers
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-emerald-400 transition-colors"
                                >
                                    Sustainability
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-emerald-400 transition-colors"
                                >
                                    Store Locator
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-4 font-serif text-lg">
                            Contact
                        </h4>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start gap-3">
                                <MapPin
                                    size={16}
                                    className="text-emerald-500 mt-0.5 shrink-0"
                                />
                                <span>
                                    123 Wembley High Rd,
                                    <br />
                                    London, HA9 6AH
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone size={16} className="text-emerald-500 shrink-0" />
                                <span>+44 20 7123 4567</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <MessageSquare
                                    size={16}
                                    className="text-emerald-500 shrink-0"
                                />
                                <span>support@desimart.co.uk</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Section: Legal & Social */}
                <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
                    <p>&copy; 2025 DesiMart Premier Ltd. All rights reserved.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-white transition-colors">
                            Privacy Policy
                        </a>
                        <a href="#" className="hover:text-white transition-colors">
                            Terms of Service
                        </a>
                        <a href="#" className="hover:text-white transition-colors">
                            Cookie Policy
                        </a>
                    </div>
                    <div className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all duration-300">
                        <div className="h-6 w-10 bg-white rounded flex items-center justify-center font-bold text-slate-800 text-[8px]">
                            VISA
                        </div>
                        <div className="h-6 w-10 bg-white rounded flex items-center justify-center font-bold text-slate-800 text-[8px]">
                            MC
                        </div>
                        <div className="h-6 w-10 bg-white rounded flex items-center justify-center font-bold text-slate-800 text-[8px]">
                            PAYPAL
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
