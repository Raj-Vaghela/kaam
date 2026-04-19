"use client";

import {
    Search,
    User,
    ShoppingBag,
    Menu,
    Truck,
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
import Logo from "@/components/brand/Logo";
import { BRAND } from "@/lib/brand";

interface HeaderProps {
    cartCount: number;
    cartTotal: number;
    onCartClick: () => void;
}

export default function Header({ cartCount, cartTotal, onCartClick }: HeaderProps) {
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
        supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_e, session) =>
            setUser(session?.user ?? null)
        );
        return () => subscription.unsubscribe();
    }, [supabase.auth]);

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
                setDropdownOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setDropdownOpen(false);
        window.location.href = "/";
    };

    return (
        <header className="sticky top-0 z-40 bg-cream/90 backdrop-blur-md border-b border-cream-deep">
            {/* Announcement bar */}
            <div className="bg-[var(--gajju-teal-deep)] text-cream text-xs">
                <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
                    <span className="flex items-center gap-2">
                        <Truck size={13} className="text-haldi" />
                        Free next-day delivery on orders over £40
                    </span>
                    <div className="hidden sm:flex gap-5 font-medium">
                        <a href={BRAND.social.whatsapp} target="_blank" rel="noopener noreferrer" className="hover:text-haldi flex items-center gap-1.5 transition-colors">
                            <HelpCircle size={11} /> Help
                        </a>
                        <span className="opacity-70">{BRAND.contact.phone}</span>
                    </div>
                </div>
            </div>

            {/* Main bar */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4 sm:gap-8">
                <Logo variant="horizontal" size="md" />

                {/* Search — hero treatment */}
                <div className="flex-grow relative max-w-2xl hidden md:block">
                    <Search
                        size={18}
                        className="absolute left-5 top-1/2 -translate-y-1/2 text-ink-mute pointer-events-none"
                    />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search basmati, masala, ghee, mithai…"
                        className="w-full pl-12 pr-4 py-3.5 rounded-full bg-cream-soft border border-cream-deep text-ink placeholder:text-ink-mute focus:outline-none focus:border-accent focus:bg-white transition-all text-sm"
                    />
                </div>

                <div className="hidden md:flex items-center gap-6 flex-shrink-0 ml-auto">
                    {user ? (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="flex items-center gap-2 text-ink hover:text-accent transition-colors"
                            >
                                <div className="w-9 h-9 rounded-full bg-[var(--gajju-teal)] text-white flex items-center justify-center font-display font-semibold">
                                    {user.email?.charAt(0).toUpperCase()}
                                </div>
                                <ChevronDown size={14} className="text-ink-mute" />
                            </button>
                            {dropdownOpen && (
                                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-[var(--shadow-lift)] border border-cream-deep py-2 z-50 animate-fade-in">
                                    <div className="px-4 py-3 border-b border-cream-deep">
                                        <p className="text-[11px] uppercase tracking-wider text-ink-mute">
                                            Signed in as
                                        </p>
                                        <p className="text-sm font-semibold text-ink truncate">
                                            {user.email}
                                        </p>
                                    </div>
                                    <Link
                                        href="/account"
                                        onClick={() => setDropdownOpen(false)}
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-cream"
                                    >
                                        <User size={16} /> My Account
                                    </Link>
                                    <Link
                                        href="/account/orders"
                                        onClick={() => setDropdownOpen(false)}
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-cream"
                                    >
                                        <Package size={16} /> My Orders
                                    </Link>
                                    <button
                                        onClick={handleSignOut}
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-rose hover:bg-cream w-full text-left"
                                    >
                                        <LogOut size={16} /> Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link
                            href="/auth"
                            className="flex items-center gap-2 text-sm font-semibold text-ink hover:text-accent transition-colors"
                        >
                            <User size={20} strokeWidth={1.6} />
                            Sign In
                        </Link>
                    )}

                    <button
                        onClick={onCartClick}
                        className="relative flex items-center gap-2.5 bg-[var(--gajju-teal-deep)] text-cream pl-4 pr-5 py-2.5 rounded-full hover:bg-[var(--gajju-teal)] transition-colors group"
                    >
                        <div className="relative">
                            <ShoppingBag size={18} strokeWidth={2} />
                            {cartCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-accent text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                                    {cartCount}
                                </span>
                            )}
                        </div>
                        <span className="text-sm font-semibold">£{cartTotal.toFixed(2)}</span>
                    </button>
                </div>

                <button
                    className="md:hidden p-2 text-ink ml-auto"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Menu"
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile search */}
            <div className="md:hidden px-4 pb-3 relative">
                <Search size={16} className="absolute left-7 top-3.5 text-ink-mute pointer-events-none" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search products…"
                    className="w-full pl-10 pr-4 py-3 rounded-full bg-cream-soft border border-cream-deep text-sm focus:outline-none focus:border-accent"
                />
            </div>

            {/* Categories — minimal scroll */}
            <nav className="border-t border-cream-deep bg-cream-soft/60 overflow-x-auto scrollbar-hide">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-7 py-2.5">
                    {CATEGORIES.map((cat) => (
                        <Link
                            key={cat}
                            href={cat === "All" ? "/products" : `/products?category=${encodeURIComponent(cat)}`}
                            className="whitespace-nowrap text-[12px] font-medium tracking-wide text-ink-soft hover:text-accent transition-colors"
                        >
                            {cat}
                        </Link>
                    ))}
                </div>
            </nav>

            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-cream-deep bg-cream-soft px-4 py-4 space-y-2">
                    {user ? (
                        <>
                            <Link href="/account" className="block py-2 text-ink font-medium">
                                My Account
                            </Link>
                            <Link href="/account/orders" className="block py-2 text-ink font-medium">
                                My Orders
                            </Link>
                            <button onClick={handleSignOut} className="block py-2 text-rose font-medium">
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <Link href="/auth" className="block py-2 text-ink font-medium">
                            Sign In / Register
                        </Link>
                    )}
                    <button
                        onClick={onCartClick}
                        className="w-full mt-2 btn-primary py-3 text-sm"
                    >
                        View Basket · £{cartTotal.toFixed(2)}
                    </button>
                </div>
            )}
        </header>
    );
}
