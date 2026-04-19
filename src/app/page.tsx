import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import HeroSection from "@/components/home/HeroSection";
import HomeFeatures from "@/components/home/HomeFeatures";
import ProductCard from "@/components/product/ProductCard";
import { toProduct } from "@/types";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BRAND } from "@/lib/brand";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://gajjuexpress.co.uk";

export const metadata: Metadata = {
    title: `${BRAND.name} — ${BRAND.taglineEn}`,
    description: BRAND.description,
    alternates: { canonical: APP_URL },
    openGraph: {
        url: APP_URL,
        title: `${BRAND.name} — ${BRAND.taglineEn}`,
        description: BRAND.description,
    },
};

// LocalBusiness structured data — helps Google show address, hours, and reviews
// in the Knowledge Panel and local search results.
const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "GroceryStore",
    name: BRAND.legalName,
    description: BRAND.description,
    url: APP_URL,
    logo: `${APP_URL}/gajjuexpress-logo-h.png`,
    image: `${APP_URL}/gajjuexpress-logo-h.png`,
    telephone: BRAND.contact.phone,
    email: BRAND.contact.email,
    foundingDate: String(BRAND.foundedYear),
    address: {
        "@type": "PostalAddress",
        streetAddress: `${BRAND.address.line1}, ${BRAND.address.line2}`,
        addressLocality: BRAND.address.city,
        postalCode: BRAND.address.postcode,
        addressCountry: "GB",
    },
    sameAs: [
        BRAND.social.instagram,
        BRAND.social.facebook,
    ],
    hasMap: `https://maps.google.com/?q=${encodeURIComponent(`${BRAND.address.line1}, ${BRAND.address.city}, ${BRAND.address.postcode}`)}`,
    priceRange: "££",
    servesCuisine: "Indian",
    currenciesAccepted: "GBP",
    paymentAccepted: "Credit Card, Debit Card",
    areaServed: {
        "@type": "Country",
        name: "United Kingdom",
    },
};

export default async function HomePage() {
    const supabase = await createClient();
    const { data: bestsellers } = await supabase
        .from("products")
        .select("id, name, category, price, image_url, unit, weight_kg, rating, bestseller, club_price")
        .eq("bestseller", true)
        .limit(4);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
            />
            <div>
                <HeroSection />

                {/* Bestsellers */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                    <div className="flex items-end justify-between mb-10">
                        <div>
                            <p className="text-xs font-semibold tracking-widest uppercase text-accent mb-2">
                                Loved by our regulars
                            </p>
                            <h2 className="font-display text-4xl sm:text-5xl text-ink">
                                Top picks this week
                            </h2>
                        </div>
                        <Link
                            href="/products"
                            className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-[var(--gajju-teal-deep)] hover:text-accent transition-colors"
                        >
                            View all <ChevronRight size={16} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
                        {bestsellers?.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={toProduct(product)}
                            />
                        ))}
                    </div>
                </section>

                <HomeFeatures />
            </div>
        </>
    );
}
