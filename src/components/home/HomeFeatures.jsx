import React from 'react';
import { Clock, ShieldCheck, Tag, ChevronRight } from 'lucide-react';
import { CATEGORIES, CATEGORY_IMAGES } from '../../data/mockData';

const HomeFeatures = ({ onCategorySelect }) => {
    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
                {[
                    { icon: <Clock size={24} />, title: "Next Day Delivery", sub: "Slots available from 8am tomorrow" },
                    { icon: <ShieldCheck size={24} />, title: "Authentic Quality", sub: "100% genuine imported brands" },
                    { icon: <Tag size={24} />, title: "Price Match", sub: "We match prices on 100+ items" }
                ].map((item, idx) => (
                    <div key={idx} className="bg-white p-5 rounded border border-slate-200 flex items-center gap-5 shadow-sm hover:border-emerald-500 transition-all cursor-pointer group hover:shadow-md">
                        <div className="bg-emerald-50 text-emerald-800 p-3 rounded-full group-hover:bg-emerald-800 group-hover:text-white transition-colors">
                            {item.icon}
                        </div>
                        <div>
                            <h3 className="font-serif font-bold text-slate-900 text-lg group-hover:text-emerald-800 transition-colors">{item.title}</h3>
                            <p className="text-slate-500 text-xs">{item.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mb-12">
                <div className="flex justify-between items-end mb-6 border-b border-slate-200 pb-2">
                    <h2 className="text-3xl font-serif font-bold text-slate-900">Shop by Category</h2>
                    <button className="text-emerald-700 font-bold hover:underline flex items-center gap-1 text-sm">View All <ChevronRight size={14} /></button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                    {CATEGORIES.filter(c => c !== 'All').map((cat) => (
                        <div key={cat} onClick={() => onCategorySelect(cat)} className="group cursor-pointer relative overflow-hidden rounded-lg shadow-sm hover:shadow-xl transition-all duration-300">
                            <div className="aspect-[4/3] w-full relative">
                                <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-slate-900/10 transition-colors z-10"></div>
                                <img
                                    src={CATEGORY_IMAGES[cat] || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400"}
                                    alt={cat}
                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent z-20">
                                    <h3 className="text-white font-bold text-base md:text-lg">{cat}</h3>
                                    <div className="h-0.5 w-0 bg-amber-400 group-hover:w-full transition-all duration-300"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HomeFeatures;
