import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
    title: "Frequently Asked Questions",
    description:
        "Answers to common questions about GajjuExpress — delivery, payments, tracking, returns, and more.",
};

const faqs: { q: string; a: React.ReactNode }[] = [
    {
        q: "How long does delivery take?",
        a: (
            <>
                We offer <strong>next-day delivery</strong> across most of the UK when you order
                before 8 pm. Scottish Highlands and Northern Ireland may take 1–2 additional
                working days. See our{" "}
                <Link href="/delivery" className="text-accent underline">
                    Delivery page
                </Link>{" "}
                for full details.
            </>
        ),
    },
    {
        q: "Is delivery free?",
        a: (
            <>
                Yes — delivery is <strong>free on all orders over £40</strong>. Orders under £40
                incur a flat fee of £3.99.
            </>
        ),
    },
    {
        q: "What payment methods do you accept?",
        a: (
            <>
                We accept all major credit and debit cards (Visa, Mastercard, American Express),
                as well as Apple Pay and Google Pay. All payments are processed securely by
                Stripe. We do not store your card details.
            </>
        ),
    },
    {
        q: "How do I track my order?",
        a: (
            <>
                Once your order is dispatched, you will receive a shipping confirmation email
                with tracking information (where available). You can also view your order status
                in your{" "}
                <Link href="/account/orders" className="text-accent underline">
                    order history
                </Link>
                .
            </>
        ),
    },
    {
        q: "Do I need an account to place an order?",
        a: (
            <>
                No — you can check out as a guest. However, creating an account lets you track
                orders, save addresses, and access your order history at any time. Sign up is
                free and takes under a minute.
            </>
        ),
    },
    {
        q: "Is there a minimum order value?",
        a: (
            <>
                There is no minimum order value. However, orders under £40 will incur a £3.99
                delivery charge. To qualify for free delivery, simply bring your basket total
                to £40 or above.
            </>
        ),
    },
    {
        q: "Can I return food items?",
        a: (
            <>
                Perishable and fresh food items cannot be returned due to UK food safety
                regulations. Non-perishable items in their original, unopened condition may be
                returned within 14 days. If your order arrives damaged or incorrect, please
                contact us within 48 hours. Full details are on our{" "}
                <Link href="/returns" className="text-accent underline">
                    Returns page
                </Link>
                .
            </>
        ),
    },
    {
        q: "How do I get a refund?",
        a: (
            <>
                Email{" "}
                <a
                    href={`mailto:${BRAND.contact.ordersEmail}`}
                    className="text-accent underline"
                >
                    {BRAND.contact.ordersEmail}
                </a>{" "}
                with your order number and reason for the return. Once we receive and inspect the
                returned items, refunds are processed within 3–5 working days to your original
                payment method.
            </>
        ),
    },
    {
        q: "Are your products authentic?",
        a: (
            <>
                Absolutely. We source directly from trusted suppliers and import partners to
                ensure every product — from Aashirvaad atta to MDH masalas — is the same
                genuine article you would find in India. We do not stock grey-market or
                repackaged goods.
            </>
        ),
    },
    {
        q: "How do I contact customer support?",
        a: (
            <>
                You can reach us by email at{" "}
                <a
                    href={`mailto:${BRAND.contact.email}`}
                    className="text-accent underline"
                >
                    {BRAND.contact.email}
                </a>
                , by phone on{" "}
                <a href={`tel:${BRAND.contact.phone}`} className="text-accent underline">
                    {BRAND.contact.phone}
                </a>{" "}
                (Monday to Friday, 9am–5pm), or via WhatsApp. We aim to respond to all
                enquiries within one working day.
            </>
        ),
    },
];

export default function FAQPage() {
    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Link
                href="/"
                className="inline-flex items-center gap-2 text-ink-mute hover:text-accent text-sm font-medium mb-8"
            >
                <ArrowLeft size={16} /> Back to {BRAND.name}
            </Link>

            <h1 className="font-display text-5xl text-ink mb-3">
                Frequently Asked Questions
            </h1>
            <p className="text-ink-mute mb-10">
                Can&apos;t find what you&apos;re looking for? Email us at{" "}
                <a href={`mailto:${BRAND.contact.email}`} className="text-accent underline">
                    {BRAND.contact.email}
                </a>
                .
            </p>

            <div className="space-y-8">
                {faqs.map((faq, i) => (
                    <div key={i} className="border-b border-cream-deep pb-8 last:border-0">
                        <h2 className="font-display text-xl text-ink mb-3">{faq.q}</h2>
                        <p className="text-ink-soft leading-relaxed">{faq.a}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
