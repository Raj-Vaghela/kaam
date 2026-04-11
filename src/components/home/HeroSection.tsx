"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

export default function HeroSection() {
    return (
        <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 lg:pt-16">
            <div className="relative grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Text */}
                <div className="lg:col-span-7 relative z-10">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-soft text-accent-deep text-xs font-semibold uppercase tracking-wider mb-6">
                        <Sparkles size={13} />
                        New · Festive Hampers Just In
                    </span>

                    <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] leading-[0.95] tracking-tight text-ink mb-3">
                        Home-grown
                        <br />
                        <span className="italic text-[var(--gajju-teal-deep)]">flavours,</span>
                        <br />
                        delivered with love.
                    </h1>

                    <p className="font-[var(--font-hind)] text-2xl text-accent mt-2 mb-7">
                        {BRAND.tagline}
                    </p>

                    <p className="text-lg text-ink-soft max-w-xl mb-10 leading-relaxed">
                        From Aashirvaad atta to Haldiram's namkeen, MDH masalas to Amul ghee —
                        every ingredient your kitchen calls for, hand-picked and at your door
                        by tomorrow.
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <Link
                            href="/products"
                            className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-base"
                        >
                            Shop the Pantry <ArrowRight size={18} />
                        </Link>
                        <Link
                            href="/products?category=Spices"
                            className="btn-secondary inline-flex items-center gap-2 px-8 py-4 text-base"
                        >
                            Browse Masalas
                        </Link>
                    </div>

                    <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs text-ink-mute">
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-leaf" /> 100% authentic brands
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-leaf" /> Next-day delivery
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-leaf" /> Free over £40
                        </span>
                    </div>
                </div>

                {/* Image collage */}
                <div className="lg:col-span-5 relative h-[420px] sm:h-[520px] lg:h-[620px]">
                    <div className="absolute top-0 right-0 w-[78%] h-[68%] rounded-[2rem] overflow-hidden shadow-[var(--shadow-lift)] grain">
                        <img
                            src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=900"
                            alt="Indian spices"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="absolute bottom-0 left-0 w-[62%] h-[58%] rounded-[2rem] overflow-hidden shadow-[var(--shadow-lift)] border-4 border-cream animate-float">
                        <img
                            src="https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=700"
                            alt="Traditional Indian sweets"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    {/* Floating badge */}
                    <div className="absolute top-[58%] right-[6%] bg-cream-soft border border-cream-deep rounded-full px-5 py-3 shadow-[var(--shadow-soft)] hidden sm:block">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-haldi-soft flex items-center justify-center">
                                <span className="text-xl">⭐</span>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-ink">4.9/5 rating</p>
                                <p className="text-[11px] text-ink-mute">2,400+ reviews</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
