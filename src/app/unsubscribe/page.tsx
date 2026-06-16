import Link from "next/link";
import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
    title: `Unsubscribed · ${BRAND.name}`,
    robots: { index: false, follow: false },
};

export default function UnsubscribePage() {
    return (
        <main className="max-w-xl mx-auto px-4 py-24 text-center">
            <h1 className="text-3xl font-semibold text-[var(--gajju-teal-deep)] mb-4">
                You&apos;re unsubscribed
            </h1>
            <p className="text-[var(--gajju-ink-soft)] mb-8">
                You won&apos;t receive any further newsletter emails from {BRAND.name}. Order
                confirmations and other transactional messages will still be sent as needed for
                orders you place.
            </p>
            <p className="text-sm text-[var(--gajju-ink-mute)] mb-10">
                Changed your mind? You can resubscribe from the homepage at any time.
            </p>
            <Link
                href="/"
                className="inline-block bg-[var(--gajju-terracotta)] text-white px-6 py-3 rounded-full font-medium hover:opacity-90 transition"
            >
                Back to {BRAND.name}
            </Link>
        </main>
    );
}
