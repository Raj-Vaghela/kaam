import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
    title: "Returns & Refunds",
    description:
        "GajjuExpress returns and refunds policy — 14-day returns on non-perishable items, refund timelines, and how to get in touch.",
};

export default function ReturnsPage() {
    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Link
                href="/"
                className="inline-flex items-center gap-2 text-ink-mute hover:text-accent text-sm font-medium mb-8"
            >
                <ArrowLeft size={16} /> Back to {BRAND.name}
            </Link>

            <h1 className="font-display text-5xl text-ink mb-3">Returns &amp; Refunds</h1>
            <p className="text-ink-mute mb-10">Last updated: 19 April 2026</p>

            <div className="prose prose-ink max-w-none space-y-8 text-ink-soft leading-relaxed">
                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">14-day return window</h2>
                    <p>
                        You may return eligible non-perishable items within{" "}
                        <strong>14 days</strong> of receiving your order, provided they are
                        unopened and in their original condition. To be eligible, items must not
                        have been used, damaged, or tampered with.
                    </p>
                </section>

                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">
                        Food &amp; perishable items
                    </h2>
                    <p>
                        In accordance with UK food safety regulations, we are unable to accept
                        returns of <strong>perishable food items</strong>, including fresh
                        produce, chilled goods, and any product with a short shelf life, unless
                        the item arrives damaged or defective.
                    </p>
                    <p>
                        If you receive a perishable item that is damaged, spoiled on arrival, or
                        significantly different from what was described, please contact us within{" "}
                        <strong>48 hours</strong> of delivery with a photo and your order number.
                    </p>
                </section>

                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">How to initiate a return</h2>
                    <ol className="list-decimal pl-6 space-y-2">
                        <li>
                            Email{" "}
                            <a
                                href={`mailto:${BRAND.contact.ordersEmail}`}
                                className="text-accent underline"
                            >
                                {BRAND.contact.ordersEmail}
                            </a>{" "}
                            with the subject line <strong>Return Request — [your order number]</strong>.
                        </li>
                        <li>
                            Include your order number, the items you wish to return, and a brief
                            reason for the return.
                        </li>
                        <li>
                            Our team will respond within 1–2 working days with return instructions
                            and a prepaid return label where applicable.
                        </li>
                        <li>
                            Pack the items securely and drop them off at your nearest Post Office
                            or DPD drop-off point using the label provided.
                        </li>
                    </ol>
                </section>

                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">Refund timeline</h2>
                    <p>
                        Once we receive and inspect your returned items, we will process your
                        refund within <strong>3–5 working days</strong>. The refund will be
                        issued to your original payment method. Please allow an additional 1–3
                        working days for the amount to appear in your account, depending on your
                        bank.
                    </p>
                    <p>
                        Original delivery charges are non-refundable unless the return is due to
                        our error (e.g., wrong or defective item).
                    </p>
                </section>

                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">Damaged or incorrect items</h2>
                    <p>
                        If your order arrives damaged or you receive the wrong item, we will
                        arrange a free replacement or full refund at no cost to you. Please
                        contact us at{" "}
                        <a
                            href={`mailto:${BRAND.contact.ordersEmail}`}
                            className="text-accent underline"
                        >
                            {BRAND.contact.ordersEmail}
                        </a>{" "}
                        within 48 hours of delivery, attaching a photo of the issue.
                    </p>
                </section>

                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">Contact us</h2>
                    <p>
                        For any questions about returns or refunds, you can reach our customer
                        care team:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>
                            Email:{" "}
                            <a
                                href={`mailto:${BRAND.contact.ordersEmail}`}
                                className="text-accent underline"
                            >
                                {BRAND.contact.ordersEmail}
                            </a>
                        </li>
                        <li>Phone: {BRAND.contact.phone} (Mon–Fri, 9am–5pm)</li>
                    </ul>
                </section>
            </div>
        </div>
    );
}
