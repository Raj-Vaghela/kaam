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
    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Link
                href="/"
                className="inline-flex items-center gap-2 text-ink-mute hover:text-accent text-sm font-medium mb-8"
            >
                <ArrowLeft size={16} /> Back to {BRAND.name}
            </Link>

            <h1 className="font-display text-5xl text-ink mb-3">Terms of Service</h1>
            <p className="text-ink-mute mb-10">
                Last updated: 13 April 2026
            </p>

            <div className="prose prose-ink max-w-none space-y-8 text-ink-soft leading-relaxed">
                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">1. About us</h2>
                    <p>
                        {BRAND.legalName} operates the {BRAND.name} online grocery store at
                        gajjuexpress.co.uk. Registered address: {BRAND.address.line1},{" "}
                        {BRAND.address.line2}, {BRAND.address.city}, {BRAND.address.postcode},{" "}
                        {BRAND.address.country}.
                    </p>
                </section>

                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">2. Ordering</h2>
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
                    <h2 className="font-display text-2xl text-ink mb-3">3. Pricing & payment</h2>
                    <p>
                        All prices are in British Pounds (GBP) and include VAT at the
                        prevailing rate (currently 20%). Payment is processed securely by
                        Stripe. We do not store your card details.
                    </p>
                </section>

                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">4. Delivery</h2>
                    <p>
                        We aim to deliver within the timeframe indicated at checkout. Delivery
                        times are estimates and not guaranteed. We are not liable for delays
                        caused by circumstances beyond our control.
                    </p>
                </section>

                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">5. Returns & refunds</h2>
                    <p>
                        Perishable goods cannot be returned unless they arrive damaged or
                        defective. Non-perishable goods may be returned within 14 days of
                        delivery in their original, unopened condition.
                    </p>
                    <p>
                        To request a refund, contact us at {BRAND.contact.email} with your
                        order number and the reason for the return.
                    </p>
                </section>

                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">6. Intellectual property</h2>
                    <p>
                        All content on this site (text, images, logos, branding) is owned by
                        {BRAND.legalName} or its licensors. You may not reproduce, distribute,
                        or create derivative works without written permission.
                    </p>
                </section>

                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">7. Limitation of liability</h2>
                    <p>
                        To the maximum extent permitted by law, {BRAND.legalName} shall not be
                        liable for any indirect, incidental, or consequential damages arising
                        from your use of this site or purchase of products.
                    </p>
                </section>

                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">8. Privacy</h2>
                    <p>
                        Your use of this site is also governed by our{" "}
                        <Link href="/privacy" className="text-accent underline">
                            Privacy Policy
                        </Link>
                        .
                    </p>
                </section>

                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">9. Governing law</h2>
                    <p>
                        These terms are governed by the laws of England and Wales. Any
                        disputes shall be subject to the exclusive jurisdiction of the
                        courts of England and Wales.
                    </p>
                </section>

                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">10. Changes</h2>
                    <p>
                        We may update these terms from time to time. Continued use of the
                        site after changes constitutes acceptance of the updated terms.
                    </p>
                </section>
            </div>
        </div>
    );
}
