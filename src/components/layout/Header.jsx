import React from 'react';
import { Truck, MapPin, HelpCircle, Search, User, ShoppingBasket, Menu } from 'lucide-react';
import { CATEGORIES } from '../../data/mockData';

const Header = ({
    cartCount,
    cartTotal,
    onCartClick,
    onLogoClick,
    searchTerm,
    onSearchChange,
    onCategoryClick,
    activeCategory,
    view,
    mobileMenuOpen,
    setMobileMenuOpen,
    onSignInClick
}) => {
    return (
        <header className="sticky top-0 z-40 bg-white shadow-md">
            <div className="bg-emerald-900 text-emerald-50 text-xs py-2 px-4 border-b border-emerald-800">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <span className="flex items-center gap-2"><Truck size={12} className="text-amber-400" /> Next day delivery on orders placed by 8pm</span>
                    <div className="flex gap-4 font-medium">
                        <span className="cursor-pointer hover:text-white flex items-center gap-1"><MapPin size={10} /> Store Finder</span>
                        <span className="cursor-pointer hover:text-white flex items-center gap-1"><HelpCircle size={10} /> Help</span>
                    </div>
                </div>
            </div>

            <div className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-6">
                    <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={onLogoClick}>
                        <div className="bg-emerald-800 text-white p-2 rounded-sm"><span className="font-serif font-black text-2xl leading-none block">D</span></div>
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-serif font-black tracking-tight text-emerald-900 leading-none">DESI<span className="text-emerald-700">MART</span></h1>
                            <span className="text-[10px] tracking-widest text-slate-500 font-bold uppercase hidden md:block">Premier Grocery</span>
                        </div>
                    </div>

                    <div className="flex-grow relative max-w-3xl">
                        <input
                            type="text"
                            placeholder="Search products, brands and more..."
                            className="w-full pl-4 pr-12 py-3 rounded-lg border border-slate-300 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 bg-slate-50 focus:bg-white transition-all text-sm"
                            value={searchTerm}
                            onChange={onSearchChange}
                        />
                        <button onClick={() => { if (searchTerm) onSearchChange({ target: { value: searchTerm } }); }} className="absolute right-0 top-0 h-full text-slate-400 hover:text-emerald-700 px-3 transition-colors">
                            <Search size={20} />
                        </button>
                    </div>

                    <div className="hidden md:flex items-center gap-8 flex-shrink-0">
                        <div className="flex flex-col items-center cursor-pointer text-slate-700 hover:text-emerald-800 group" onClick={onSignInClick}><User size={24} strokeWidth={1.5} /><span className="text-[10px] font-bold mt-1">Sign In</span></div>
                        <div className="relative flex flex-col items-center cursor-pointer text-slate-700 hover:text-emerald-800 group" onClick={onCartClick}>
                            <div className="relative"><ShoppingBasket size={24} strokeWidth={1.5} />{cartCount > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">{cartCount}</span>}</div>
                            <span className="text-[10px] font-bold mt-1">£{cartTotal.toFixed(2)}</span>
                        </div>
                    </div>
                    <button className="md:hidden p-2 text-slate-700" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}><Menu size={24} /></button>
                </div>
            </div>

            <div className="bg-slate-100 border-b border-slate-200 py-1.5 overflow-x-auto scrollbar-hide">
                <div className="max-w-7xl mx-auto px-4 flex items-center space-x-6">
                    {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => onCategoryClick(cat)} className={`text-xs font-bold whitespace-nowrap hover:text-emerald-700 ${activeCategory === cat && view === 'listing' ? 'text-emerald-800 border-b-2 border-emerald-800' : 'text-slate-600'}`}>{cat}</button>
                    ))}
                </div>
            </div>
        </header>
    );
};

export default Header;
