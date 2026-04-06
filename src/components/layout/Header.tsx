"use client";

import {
    Search,
    User,
    ShoppingBasket,
    Menu,
    Truck,
    MapPin,
    HelpCircle,
    X,
    LogOut,
    Package,
    ChevronDown,
} from "lucide-react";
import { CATEGORIES } from "@/data/mockData";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface HeaderProps {
    cartCount: number;
    cartTotal: number;
    onCartClick: () => void;
}

export default function Header({
    cartCount,
    cartTotal,
    onCartClick,
}: HeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null);
            }
        );

        return () => subscription.unsubscribe();
    }, [supabase.auth]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setDropdownOpen(false);
        window.location.href = "/";
    };

    return (
        <header className="sticky top-0 z-40 bg-white shadow-md">
            {/* Top Bar */}
            <div className="bg-emerald-900 text-emerald-50 text-xs py-2 px-4 border-b border-emerald-800">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <span className="flex items-center gap-2">
                        <Truck size={12} className="text-amber-400" />
                        Next day delivery on orders placed by 8pm
                    </span>
                    <div className="flex gap-4 font-medium">
                        <span className="cursor-pointer hover:text-white flex items-center gap-1">
                            <MapPin size={10} />
                            Store Finder
                        </span>
                        <span className="cursor-pointer hover:text-white flex items-center gap-1">
                            <HelpCircle size={10} />
                            Help
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Header */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-6">
                    {/* Logo */}
                    <Link
                        href="/"
                        className="flex-shrink-0 flex items-center gap-2 cursor-pointer"
                    >
                        <div className="bg-emerald-800 text-white p-2 rounded-sm">
                            <span className="font-serif font-black text-2xl leading-none block">
                                D
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-serif font-black tracking-tight text-emerald-900 leading-none">
                                DESI<span className="text-emerald-700">MART</span>
                            </h1>
                            <span className="text-[10px] tracking-widest text-slate-500 font-bold uppercase hidden md:block">
                                Premier Grocery
                            </span>
                        </div>
                    </Link>

                    {/* Search */}
                    <div className="flex-grow relative max-w-3xl">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search products, brands and more..."
                            className="w-full pl-4 pr-12 py-3 rounded-lg border border-slate-300 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 bg-slate-50 focus:bg-white transition-all text-sm"
                        />
                        <button className="absolute right-0 top-0 h-full text-slate-400 hover:text-emerald-700 px-3 transition-colors">
                            <Search size={20} />
                        </button>
                    </div>

                    {/* Icons */}
                    <div className="hidden md:flex items-center gap-8 flex-shrink-0">
                        {user ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="flex flex-col items-center cursor-pointer text-slate-700 hover:text-emerald-800 group"
                                >
                                    <div className="relative">
                                        <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center">
                                            <span className="text-white text-xs font-bold">
                                                {user.email?.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold mt-1 flex items-center gap-0.5">
                                        Account
                                        <ChevronDown size={10} />
                                    </span>
                                </button>

                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                                        <div className="px-4 py-2 border-b border-slate-100">
                                            <p className="text-xs text-slate-500">Signed in as</p>
                                            <p className="text-sm font-medium text-slate-900 truncate">
                                                {user.email}
                                            </p>
                                        </div>
                                        <Link
                                            href="/account"
                                            onClick={() => setDropdownOpen(false)}
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                        >
                                            <User size={16} />
                                            My Account
                                        </Link>
                                        <Link
                                            href="/account/orders"
                                            onClick={() => setDropdownOpen(false)}
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                        >
                                            <Package size={16} />
                                            My Orders
                                        </Link>
                                        <button
                                            onClick={handleSignOut}
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                                        >
                                            <LogOut size={16} />
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                href="/auth"
                                className="flex flex-col items-center cursor-pointer text-slate-700 hover:text-emerald-800 group"
                            >
                                <User size={24} strokeWidth={1.5} />
                                <span className="text-[10px] font-bold mt-1">Sign In</span>
                            </Link>
                        )}
                        <button
                            onClick={onCartClick}
                            className="relative flex flex-col items-center cursor-pointer text-slate-700 hover:text-emerald-800 group"
                        >
                            <div className="relative">
                                <ShoppingBasket size={24} strokeWidth={1.5} />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                                        {cartCount}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] font-bold mt-1">
                                £{cartTotal.toFixed(2)}
                            </span>
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-slate-700"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Categories Nav */}
            <div className="bg-slate-100 border-b border-slate-200 py-1.5 overflow-x-auto scrollbar-hide">
                <div className="max-w-7xl mx-auto px-4 flex items-center space-x-6">
                    {CATEGORIES.map((cat) => (
                        <Link
                            key={cat}
                            href={cat === "All" ? "/products" : `/products?category=${cat}`}
                            className="whitespace-nowrap text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-emerald-800 transition-colors py-1"
                        >
                            {cat}
                        </Link>
                    ))}
                </div>
            </div>
        </header>
    );
}
