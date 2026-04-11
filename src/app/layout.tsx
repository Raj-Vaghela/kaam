import type { Metadata } from "next";
import { Inter, Fraunces, Hind_Vadodara } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import ClientShell from "@/components/layout/ClientShell";
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

export const metadata: Metadata = {
    title: `${BRAND.name} — ${BRAND.taglineEn}`,
    description: BRAND.description,
    openGraph: {
        title: `${BRAND.name} — ${BRAND.taglineEn}`,
        description: BRAND.description,
        type: "website",
    },
};

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en">
            <body
                className={`${inter.variable} ${fraunces.variable} ${hindVadodara.variable} antialiased bg-cream text-ink`}
            >
                <CartProvider>
                    <ClientShell>{children}</ClientShell>
                </CartProvider>
            </body>
        </html>
    );
}
