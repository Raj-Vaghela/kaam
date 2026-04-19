import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: `Read the GajjuExpress privacy policy to understand how we collect, use and protect your personal data.`,
    robots: { index: true, follow: false },
};

export default function PrivacyPolicyPage() {
    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Link
                href="/"
                className="inline-flex items-center gap-2 text-ink-mute hover:text-accent text-sm font-medium mb-8"
            >
                <ArrowLeft size={16} /> Back to {BRAND.name}
            </Link>

            <h1 className="font-display text-5xl text-ink mb-3">Privacy Policy</h1>
            <p className="text-ink-mute mb-10">
                Last updated: 13 April 2026
            </p>

            <div className="prose prose-ink max-w-none space-y-8 text-ink-soft leading-relaxed">
                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">1. Who we are</h2>
                    <p>
                        {BRAND.legalName} (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;)
                        operates the {BRAND.name} online grocery store at gajjuexpress.co.uk.
                    </p>
                    <p>
                        Registered address: {BRAND.address.line1}, {BRAND.address.line2},{" "}
                        {BRAND.address.city}, {BRAND.address.postcode}, {BRAND.address.country}.
                    </p>
                    <p>
                        Contact: {BRAND.contact.email}
                    </p>
                </section>

                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">2. What data we collect</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>
                            <strong>Account information:</strong> name, email address, password
                            (hashed — we never see your plaintext password).
                        </li>
                        <li>
                            <strong>Order information:</strong> delivery address, phone number,
                            order history, invoice records.
                        </li>
                        <li>
                            <strong>Payment information:</strong> processed entirely by Stripe.
                            We do not store card numbers, CVVs, or full payment details.
                        </li>
                        <li>
                            <strong>Technical data:</strong> IP address, browser type, and
                            cookies necessary for authentication and site functionality.
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">3. Why we process your data</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>
                            <strong>Contract fulfilment:</strong> to process and deliver your
                            orders, send invoices, and handle returns.
                        </li>
                        <li>
                            <strong>Legal obligation:</strong> to maintain financial records
                            (invoices, VAT) as required by UK tax law (6-year retention).
                        </li>
                        <li>
                            <strong>Legitimate interest:</strong> to detect fraud, secure our
                            systems, and improve our service.
                        </li>
                        <li>
                            <strong>Consent:</strong> for marketing communications (only if you
                            explicitly opt in).
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">4. Who we share data with</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>
                            <strong>Stripe</strong> — payment processing (
                            <a href="https://stripe.com/privacy" className="text-accent underline" target="_blank" rel="noopener noreferrer">
                                their privacy policy
                            </a>
                            ).
                        </li>
                        <li>
                            <strong>Supabase</strong> — database and authentication hosting (
                            <a href="https://supabase.com/privacy" className="text-accent underline" target="_blank" rel="noopener noreferrer">
                                their privacy policy
                            </a>
                            ).
                        </li>
                        <li>
                            <strong>Resend</strong> — transactional email delivery (
                            <a href="https://resend.com/privacy" className="text-accent underline" target="_blank" rel="noopener noreferrer">
                                their privacy policy
                            </a>
                            ).
                        </li>
                    </ul>
                    <p>We do not sell your data to any third party.</p>
                </section>

                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">5. How long we keep your data</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>
                            <strong>Account data:</strong> until you delete your account.
                        </li>
                        <li>
                            <strong>Order and invoice data:</strong> 6 years from the date of the
                            transaction (UK tax law requirement), then deleted.
                        </li>
                        <li>
                            <strong>Guest checkout data:</strong> 2 years from the order date,
                            then anonymised.
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">6. Your rights</h2>
                    <p>Under the UK GDPR, you have the right to:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>
                            <strong>Access</strong> — request a copy of all personal data we hold
                            about you. You can do this from your{" "}
                            <Link href="/account" className="text-accent underline">
                                account settings
                            </Link>
                            .
                        </li>
                        <li>
                            <strong>Rectification</strong> — correct any inaccurate data.
                        </li>
                        <li>
                            <strong>Erasure</strong> — delete your account and associated data.
                            You can do this from your{" "}
                            <Link href="/account" className="text-accent underline">
                                account settings
                            </Link>
                            . Note: we must retain financial records for 6 years, but they will
                            be anonymised.
                        </li>
                        <li>
                            <strong>Portability</strong> — download your data in a
                            machine-readable format from your account settings.
                        </li>
                        <li>
                            <strong>Object</strong> — opt out of marketing at any time.
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">7. Cookies</h2>
                    <p>
                        We use only <strong>essential cookies</strong> required to keep you signed
                        in and process orders. We do not use advertising or analytics cookies.
                    </p>
                </section>

                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">8. Complaints</h2>
                    <p>
                        If you&apos;re not happy with how we handle your data, contact us at{" "}
                        {BRAND.contact.email}. You also have the right to complain to the{" "}
                        <a
                            href="https://ico.org.uk/make-a-complaint/"
                            className="text-accent underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Information Commissioner&apos;s Office (ICO)
                        </a>
                        .
                    </p>
                </section>
            </div>
        </div>
    );
}
