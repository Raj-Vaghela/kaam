import type { Metadata } from "next";
import { Inter, Fraunces, Hind_Vadodara } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import ClientShell from "@/components/layout/ClientShell";
import CookieConsent from "@/components/gdpr/CookieConsent";
import { BRAND } from "@/lib/brand";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
    display: "swap",
});

const fraunces = Fraunces({
    variable: "--font-fraunces",
    subsets: ["latin"],
    display: "swap",
    axes: ["opsz", "SOFT"],
});

const hindVadodara = Hind_Vadodara({
    variable: "--font-hind",
    subsets: ["gujarati", "latin"],
    weight: ["400", "500", "600", "700"],
    display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://gajjuexpress.co.uk";

export const metadata: Metadata = {
    // Required for resolving relative OG/Twitter image URLs
    metadataBase: new URL(APP_URL),

    title: {
        default: `${BRAND.name} — ${BRAND.taglineEn}`,
        // Page titles render as "Products | GajjuExpress"
        template: `%s | ${BRAND.name}`,
    },
    description: BRAND.description,
    keywords: [
        "Indian groceries UK",
        "Gujarati groceries",
        "Indian food delivery London",
        "authentic Indian spices",
        "Haldirams UK",
        "MDH masala UK",
        "Aashirvaad atta",
        "Indian pantry online",
        "South Asian groceries",
    ],
    authors: [{ name: BRAND.legalName }],
    creator: BRAND.legalName,
    publisher: BRAND.legalName,

    openGraph: {
        type: "website",
        siteName: BRAND.name,
        title: `${BRAND.name} — ${BRAND.taglineEn}`,
        description: BRAND.description,
        url: APP_URL,
        // Replace with a proper 1200×630 social card once designed
        images: [
            {
                url: "/gajjuexpress-logo-h.png",
                width: 1200,
                height: 630,
                alt: `${BRAND.name} — ${BRAND.taglineEn}`,
            },
        ],
    },

    twitter: {
        card: "summary_large_image",
        title: `${BRAND.name} — ${BRAND.taglineEn}`,
        description: BRAND.description,
        images: ["/gajjuexpress-logo-h.png"],
    },

    // Prevent indexing of private/transactional pages via default; pages opt in
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
};

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        // en-GB for a UK-based store (affects language negotiation and Google Search region)
        <html lang="en-GB">
            <body
                className={`${inter.variable} ${fraunces.variable} ${hindVadodara.variable} antialiased bg-cream text-ink`}
            >
                <CartProvider>
                    <ClientShell>{children}</ClientShell>
                    <CookieConsent />
                </CartProvider>
            </body>
        </html>
    );
}
