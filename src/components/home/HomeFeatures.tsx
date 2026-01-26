"use client";

import { Clock, ShieldCheck, Tag, ChevronRight } from "lucide-react";
import { CATEGORY_IMAGES, CATEGORIES } from "@/data/mockData";
import Link from "next/link";

export default function HomeFeatures() {
    const displayCategories = CATEGORIES.filter((cat) => cat !== "All").slice(
        0,
        8
    );

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Service Promises */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
                <div className="bg-white p-5 rounded border border-slate-200 flex items-center gap-5 shadow-sm hover:border-emerald-500 transition-all cursor-pointer group hover:shadow-md">
                    <div className="bg-emerald-50 text-emerald-800 p-3 rounded-full group-hover:bg-emerald-800 group-hover:text-white transition-colors">
                        <Clock size={24} />
                    </div>
                    <div>
                        <h3 className="font-serif font-bold text-slate-900 text-lg group-hover:text-emerald-800 transition-colors">
                            Next Day Delivery
                        </h3>
                        <p className="text-slate-500 text-xs">
                            Slots available from 8am tomorrow
                        </p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded border border-slate-200 flex items-center gap-5 shadow-sm hover:border-emerald-500 transition-all cursor-pointer group hover:shadow-md">
                    <div className="bg-emerald-50 text-emerald-800 p-3 rounded-full group-hover:bg-emerald-800 group-hover:text-white transition-colors">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h3 className="font-serif font-bold text-slate-900 text-lg group-hover:text-emerald-800 transition-colors">
                            Authentic Quality
                        </h3>
                        <p className="text-slate-500 text-xs">
                            100% genuine imported brands
                        </p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded border border-slate-200 flex items-center gap-5 shadow-sm hover:border-emerald-500 transition-all cursor-pointer group hover:shadow-md">
                    <div className="bg-emerald-50 text-emerald-800 p-3 rounded-full group-hover:bg-emerald-800 group-hover:text-white transition-colors">
                        <Tag size={24} />
                    </div>
                    <div>
                        <h3 className="font-serif font-bold text-slate-900 text-lg group-hover:text-emerald-800 transition-colors">
                            Price Match
                        </h3>
                        <p className="text-slate-500 text-xs">
                            We match prices on 100+ items
                        </p>
                    </div>
                </div>
            </div>

            {/* Shop by Category */}
            <div className="mb-12">
                <div className="flex justify-between items-end mb-6 border-b border-slate-200 pb-2">
                    <h2 className="text-3xl font-serif font-bold text-slate-900">
                        Shop by Category
                    </h2>
                    <Link
                        href="/products"
                        className="text-emerald-700 font-bold hover:underline flex items-center gap-1 text-sm"
                    >
                        View All <ChevronRight size={14} />
                    </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                    {displayCategories.map((cat) => (
                        <Link
                            key={cat}
                            href={`/products?category=${cat}`}
                            className="group relative rounded-lg overflow-hidden aspect-[4/3] cursor-pointer shadow-md hover:shadow-xl transition-all"
                        >
                            <img
                                src={CATEGORY_IMAGES[cat]}
                                alt={cat}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
                            <div className="absolute inset-0 flex items-end p-4">
                                <h3 className="text-white font-serif font-bold text-lg group-hover:text-amber-400 transition-colors">
                                    {cat}
                                </h3>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
