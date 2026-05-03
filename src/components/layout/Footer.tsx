"use client";

import { MapPin, Phone, Mail, Instagram, Facebook } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

export default function Footer() {
    const [email, setEmail] = useState("");
    const [subscribing, setSubscribing] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState("");

    const handleSubscribe = async () => {
        if (!email) return;
        setError("");
        setSubscribing(true);
        try {
            const res = await fetch("/api/newsletter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (data.success) {
                setEmail("");
                setDone(true);
                setTimeout(() => setDone(false), 3000);
            } else {
                setError(data.error || "Something went wrong. Please try again.");
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setSubscribing(false);
        }
    };

    const shopLinks: { label: string; href: string }[] = [
        { label: "New Arrivals", href: "/products" },
        { label: "Bestsellers", href: "/products?category=Bestsellers" },
        { label: "Festive Specials", href: "/products?category=Festive" },
        { label: "Gift Hampers", href: "/products?category=Hampers" },
    ];

    const helpLinks: { label: string; href: string }[] = [
        { label: "Delivery", href: "/delivery" },
        { label: "Returns", href: "/returns" },
        { label: "Track Order", href: "/account/orders" },
        { label: "FAQs", href: "/faq" },
    ];

    const aboutLinks: { label: string; href: string }[] = [
        { label: "Our Story", href: "/about" },
        { label: "Sourcing", href: "/about#sourcing" },
        { label: "Sustainability", href: "/about#sustainability" },
        { label: "Careers", href: "/about#careers" },
    ];

    const columns = [
        { title: "Shop", links: shopLinks },
        { title: "Help", links: helpLinks },
        { title: "About", links: aboutLinks },
    ];

    return (
        <footer className="bg-[var(--gajju-teal-deep)] text-cream/90 mt-24">
            <div className="bandhani-divider" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
                {/* Top: brand + newsletter */}
                <div className="grid lg:grid-cols-2 gap-12 mb-16 pb-16 border-b border-white/10">
                    <div>
                        <Image
                            src={BRAND.logo.horizontalWhite}
                            alt={BRAND.name}
                            width={200}
                            height={52}
                            className="object-contain mb-5 opacity-95"
                        />
                        <p className="font-display text-2xl text-cream leading-tight mb-2">
                            {BRAND.taglineEn}
                        </p>
                        <p className="font-[var(--font-hind)] text-base text-haldi">
                            {BRAND.tagline}
                        </p>
                        <p className="text-sm text-cream/70 mt-5 max-w-md leading-relaxed">
                            {BRAND.description} Bringing the warmth of an Indian kitchen to UK
                            homes since {BRAND.foundedYear}.
                        </p>
                    </div>

                    <div className="lg:justify-self-end w-full max-w-md">
                        <h3 className="font-display text-2xl text-cream mb-2">
                            Sign up. Get £10 off.
                        </h3>
                        <p className="text-sm text-cream/70 mb-5">
                            New flavours, recipes from our kitchen, and £10 off your first order
                            over £60.
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                                placeholder="your@email.com"
                                className="flex-grow bg-white/10 border border-white/20 text-cream placeholder:text-cream/50 px-5 py-3.5 rounded-full text-sm focus:outline-none focus:border-haldi focus:bg-white/15 transition-all"
                            />
                            <button
                                onClick={handleSubscribe}
                                disabled={subscribing}
                                className="bg-accent hover:bg-[var(--gajju-terracotta-deep)] text-white px-6 py-3.5 rounded-full text-sm font-semibold transition-colors disabled:opacity-50 whitespace-nowrap"
                            >
                                {subscribing ? "…" : done ? "Thanks!" : "Subscribe"}
                            </button>
                        </div>
                        {error && (
                            <p className="text-xs text-red-300 mt-2">{error}</p>
                        )}
                    </div>
                </div>

                {/* Link columns */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
                    {columns.map((col) => (
                        <div key={col.title}>
                            <h4 className="font-display text-lg text-cream mb-5">{col.title}</h4>
                            <ul className="space-y-3 text-sm">
                                {col.links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-cream/70 hover:text-haldi transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                    <div>
                        <h4 className="font-display text-lg text-cream mb-5">Visit Us</h4>
                        <ul className="space-y-3 text-sm text-cream/70">
                            <li className="flex items-start gap-3">
                                <MapPin size={15} className="text-haldi mt-0.5 shrink-0" />
                                <span>
                                    {BRAND.address.line1}, {BRAND.address.city}
                                    <br />
                                    {BRAND.address.postcode}
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone size={15} className="text-haldi shrink-0" />
                                <span>{BRAND.contact.phone}</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail size={15} className="text-haldi shrink-0" />
                                <span>{BRAND.contact.email}</span>
                            </li>
                        </ul>
                        <div className="flex gap-3 mt-5">
                            <a
                                href={BRAND.social.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Instagram"
                                className="w-9 h-9 rounded-full bg-white/10 hover:bg-haldi hover:text-[var(--gajju-teal-deep)] flex items-center justify-center transition-colors"
                            >
                                <Instagram size={16} />
                            </a>
                            <a
                                href={BRAND.social.facebook}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Facebook"
                                className="w-9 h-9 rounded-full bg-white/10 hover:bg-haldi hover:text-[var(--gajju-teal-deep)] flex items-center justify-center transition-colors"
                            >
                                <Facebook size={16} />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Legal */}
                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-cream/60">
                    <p>
                        © {new Date().getFullYear()} {BRAND.legalName}. Made with care in London.
                    </p>
                    <div className="flex gap-6">
                        <Link href="/privacy" className="hover:text-haldi transition-colors">
                            Privacy
                        </Link>
                        <Link href="/terms" className="hover:text-haldi transition-colors">
                            Terms
                        </Link>
                        <Link href="/privacy#cookies" className="hover:text-haldi transition-colors">
                            Cookies
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
