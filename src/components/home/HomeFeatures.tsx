"use client";

import { Truck, ShieldCheck, Heart, ChevronRight } from "lucide-react";
import { CATEGORY_IMAGES, CATEGORIES } from "@/data/mockData";
import Link from "next/link";

const PROMISES = [
    {
        icon: Truck,
        title: "Next-day delivery",
        body: "Order by 8pm, on your doorstep tomorrow.",
    },
    {
        icon: ShieldCheck,
        title: "Authentic, always",
        body: "Direct from the brands you grew up with.",
    },
    {
        icon: Heart,
        title: "Made for your kitchen",
        body: "Curated by Indian families, for Indian families.",
    },
];

export default function HomeFeatures() {
    const displayCategories = CATEGORIES.filter((c) => c !== "All").slice(0, 8);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
            {/* Promises */}
            <div className="grid sm:grid-cols-3 gap-5 mb-24">
                {PROMISES.map(({ icon: Icon, title, body }) => (
                    <div
                        key={title}
                        className="group bg-cream-soft border border-cream-deep rounded-3xl p-6 flex items-start gap-5 hover:bg-white hover:shadow-[var(--shadow-soft)] transition-all"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-accent-soft text-accent flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors shrink-0">
                            <Icon size={22} />
                        </div>
                        <div>
                            <h3 className="font-display text-lg text-ink mb-1">{title}</h3>
                            <p className="text-sm text-ink-mute leading-relaxed">{body}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Shop by category */}
            <div>
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <p className="text-xs font-semibold tracking-widest uppercase text-accent mb-2">
                            Browse the aisles
                        </p>
                        <h2 className="font-display text-4xl sm:text-5xl text-ink">
                            Shop by category
                        </h2>
                    </div>
                    <Link
                        href="/products"
                        className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-[var(--gajju-teal-deep)] hover:text-accent transition-colors"
                    >
                        View all <ChevronRight size={16} />
                    </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    {displayCategories.map((cat) => (
                        <Link
                            key={cat}
                            href={`/products?category=${encodeURIComponent(cat)}`}
                            className="group relative rounded-3xl overflow-hidden aspect-[4/5] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] transition-shadow"
                        >
                            <img
                                src={CATEGORY_IMAGES[cat]}
                                alt={cat}
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[var(--gajju-ink)]/85 via-[var(--gajju-ink)]/20 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 p-5 flex items-end justify-between">
                                <h3 className="font-display text-2xl text-cream leading-tight">
                                    {cat}
                                </h3>
                                <ChevronRight
                                    size={20}
                                    className="text-haldi opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                                />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
