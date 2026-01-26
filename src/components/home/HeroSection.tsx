"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function HeroSection() {
    return (
        <div className="relative rounded-lg mx-4 sm:mx-6 lg:mx-8 mt-6 overflow-hidden shadow-xl border-b-4 border-amber-400 min-h-[500px] flex items-center">
            <div className="absolute inset-0">
                <img
                    src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=1200"
                    alt="Indian Spices Background"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-emerald-900/80 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-transparent to-transparent md:hidden" />
            </div>

            <div className="relative z-10 px-6 py-12 md:pl-20 flex flex-col items-start text-left max-w-4xl w-full">
                <span className="inline-block py-1.5 px-4 bg-yellow-400 text-slate-900 text-xs font-bold uppercase tracking-wider mb-6 transform -skew-x-12 shadow-lg">
                    Great Value Prices
                </span>

                <h1 className="text-4xl md:text-7xl font-serif font-black tracking-tight mb-6 leading-tight text-white drop-shadow-md">
                    Authentic Flavours.
                    <br />
                    <span className="text-amber-400">Local Convenience.</span>
                </h1>

                <p className="text-lg md:text-xl text-emerald-100 max-w-xl mb-10 leading-relaxed font-light drop-shadow-sm">
                    The finest Indian groceries, sourced directly and delivered to your
                    doorstep. From everyday staples to rare spices.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Link
                        href="/products"
                        className="bg-red-600 text-white font-bold py-4 px-8 rounded hover:bg-red-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                    >
                        Shop Groceries <ArrowRight size={20} />
                    </Link>
                    <Link
                        href="/products"
                        className="bg-white/10 backdrop-blur-md border border-white/30 text-white font-bold py-4 px-8 rounded hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                    >
                        View Offers
                    </Link>
                </div>
            </div>
        </div>
    );
}
