import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
    title: "Terms of Service",
    description: `Read the GajjuExpress terms of service — your rights and obligations when shopping with us.`,
    robots: { index: true, follow: false },
};

export default function TermsPage() {
    const vatLine = BRAND.vatRegistered
        ? `VAT registered. VAT number: GB${BRAND.vatNumber?.replace(/^GB/, "") ?? "NUMBER_NOT_SET"}.`
        : "Not currently VAT registered.";

    const registeredAddressStr = [
        BRAND.registeredAddress.line1,
        BRAND.registeredAddress.line2,
        BRAND.registeredAddress.city,
        BRAND.registeredAddress.postcode,
        BRAND.registeredAddress.country === "GB" ? "United Kingdom" : BRAND.registeredAddress.country,
    ]
        .filter(Boolean)
        .join(", ");

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Link
                href="/"
                className="inline-flex items-center gap-2 text-ink-mute hover:text-accent text-sm font-medium mb-8"
            >
                <ArrowLeft size={16} /> Back to {BRAND.name}
            </Link>

            <h1 className="font-display text-5xl text-ink mb-3">Terms of Service</h1>
            <p className="text-ink-mute mb-10">Last updated: 31 May 2026</p>

            <div className="prose prose-ink max-w-none space-y-8 text-ink-soft leading-relaxed">

                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">1. About us</h2>
                    <p>
                        {BRAND.legalName} operates the {BRAND.name} online grocery store at
                        gajjuexpress.co.uk. Registered in England and Wales.
                        Company number: {BRAND.companyNumber}.
                        Registered office: {registeredAddressStr}.
                    </p>
                    <p>
                        Contact:{" "}
                        <a href={`mailto:${BRAND.contact.email}`} className="text-accent underline">
                            {BRAND.contact.email}
                        </a>
                        {BRAND.contact.phone ? ` · ${BRAND.contact.phone}` : ""}.
                    </p>
                </section>

                {/* ── Statutory rights — required disclosure ─────────────────── */}
                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">2. Your statutory rights</h2>
                    <p>
                        Nothing in these terms affects your statutory rights as a consumer under
                        UK law, including but not limited to:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mt-2">
                        <li>
                            The <strong>Consumer Rights Act 2015</strong> — goods must be of
                            satisfactory quality, fit for purpose, and as described. Services must
                            be performed with reasonable care and skill.
                        </li>
                        <li>
                            The <strong>Consumer Contracts (Information, Cancellation and Additional
                            Charges) Regulations 2013</strong> — you have a 14-day right to cancel
                            most online orders. See our{" "}
                            <Link href="/returns" className="text-accent underline">
                                Returns &amp; Cancellations
                            </Link>{" "}
                            page for full details including the model cancellation form.
                        </li>
                        <li>
                            The <strong>Consumer Protection from Unfair Trading Regulations 2008</strong> —
                            we will not engage in misleading or aggressive commercial practices.
                        </li>
                    </ul>
                    <p className="mt-3">
                        Any clause in these terms that would conflict with your statutory rights is
                        void and of no effect.
                    </p>
                </section>

                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">3. Ordering</h2>
                    <p>
                        By placing an order, you confirm that you are at least 18 years old
                        (or have parental consent) and that the information you provide is
                        accurate.
                    </p>
                    <p>
                        An order is accepted when we send you an order confirmation email.
                        We may decline an order if products are out of stock, if there is a
                        pricing error, or if we suspect fraud.
                    </p>
                </section>

                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">4. Pricing &amp; payment</h2>
                    <p>
                        All prices are in British Pounds (GBP). Prices include VAT where
                        applicable. {vatLine} Payment is processed securely by Stripe. We do
                        not store your card details.
                    </p>
                    <p className="mt-2">
                        VAT registration status: {BRAND.vatRegistered
                            ? `VAT registered, number: ${BRAND.vatNumber ?? "NUMBER_NOT_SET"}`
                            : "not currently VAT registered"
                        }.
                    </p>
                </section>

                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">5. Delivery</h2>
                    <p>
                        We aim to deliver within the timeframe indicated at checkout. Delivery
                        times are estimates and not guaranteed. We are not liable for delays
                        caused by circumstances beyond our control (force majeure).
                    </p>
                    <p className="mt-2">
                        Risk in the goods passes to you upon delivery. Title passes upon receipt
                        of full payment.
                    </p>
                </section>

                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">5. Returns &amp; refunds</h2>
                    <p>
                        Your statutory right to cancel and your rights in respect of faulty or
                        non-conforming goods are set out in our{" "}
                        <Link href="/returns" className="text-accent underline">
                            Returns, Refunds &amp; Cancellations
                        </Link>{" "}
                        page and are not affected by these terms.
                    </p>
                    <p className="mt-2">
                        For perishable goods that arrive damaged, defective or significantly
                        different from the description, please contact{" "}
                        <a href={`mailto:${BRAND.contact.ordersEmail}`} className="text-accent underline">
                            {BRAND.contact.ordersEmail}
                        </a>{" "}
                        within 48 hours of delivery with a photograph of the issue.
                    </p>
                </section>

                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">6. Intellectual property</h2>
                    <p>
                        All content on this site (text, images, logos, branding) is owned by{" "}
                        {BRAND.legalName} or its licensors. You may not reproduce, distribute,
                        or create derivative works without written permission.
                    </p>
                </section>

                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">7. Limitation of liability</h2>
                    <p>
                        Nothing in these terms excludes or limits our liability for:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                        <li>death or personal injury caused by our negligence;</li>
                        <li>fraud or fraudulent misrepresentation;</li>
                        <li>any breach of your statutory rights under the Consumer Rights Act 2015;</li>
                        <li>any other liability that cannot be excluded or limited by law.</li>
                    </ul>
                    <p className="mt-3">
                        Subject to the above, and to the fullest extent permitted by law,
                        our total liability to you for any loss or damage arising out of or in
                        connection with these terms shall not exceed the total amount paid by
                        you for the relevant order.
                    </p>
                    <p className="mt-3">
                        We are not liable for indirect or consequential losses (such as loss of
                        profit, loss of business opportunity, or wasted expenditure) except where
                        such losses are caused by our breach of a term implied by the Consumer
                        Rights Act 2015 or other applicable consumer protection law.
                    </p>
                </section>

                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">8. Privacy</h2>
                    <p>
                        Your use of this site is also governed by our{" "}
                        <Link href="/privacy" className="text-accent underline">
                            Privacy Notice
                        </Link>
                        , which explains what personal data we collect, why, and your rights under
                        the UK GDPR.
                    </p>
                </section>

                {/* ── ADR signposting — required by ADR Regulations 2015 ─────── */}
                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">
                        9. Alternative Dispute Resolution (ADR)
                    </h2>
                    <p>
                        If you have a complaint that we have been unable to resolve to your
                        satisfaction, you may be able to use an Alternative Dispute Resolution
                        (ADR) scheme as an out-of-court mechanism.
                    </p>
                    <p className="mt-3">
                        We are not currently signed up to any approved ADR provider. However,
                        you may use the{" "}
                        <a
                            href="https://ec.europa.eu/consumers/odr/"
                            className="text-accent underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            EU/UK Online Dispute Resolution (ODR) platform
                        </a>{" "}
                        to seek resolution. Our contact email for ODR purposes is{" "}
                        <a href={`mailto:${BRAND.contact.email}`} className="text-accent underline">
                            {BRAND.contact.email}
                        </a>
                        .
                    </p>
                    <p className="mt-3">
                        You also retain the right to bring proceedings in the courts of England
                        and Wales at any time.
                    </p>
                </section>

                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">10. Governing law</h2>
                    <p>
                        These terms are governed by the laws of England and Wales. Any
                        disputes shall be subject to the jurisdiction of the courts of England
                        and Wales, without prejudice to your right as a consumer to bring
                        proceedings in the courts of the country where you are domiciled.
                    </p>
                </section>

                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">11. Changes</h2>
                    <p>
                        We may update these terms from time to time. We will notify you of material
                        changes by email or prominent notice on the site. Changes apply to orders
                        placed after the effective date shown at the top of this page.
                    </p>
                </section>

            </div>
        </div>
    );
}
