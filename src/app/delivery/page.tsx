import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
    title: "Delivery & Shipping",
    description:
        "Find out about GajjuExpress delivery options, costs, cutoff times, and coverage areas across the UK.",
};

export default function DeliveryPage() {
    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Link
                href="/"
                className="inline-flex items-center gap-2 text-ink-mute hover:text-accent text-sm font-medium mb-8"
            >
                <ArrowLeft size={16} /> Back to {BRAND.name}
            </Link>

            <h1 className="font-display text-5xl text-ink mb-3">Delivery &amp; Shipping</h1>
            <p className="text-ink-mute mb-10">Last updated: 19 April 2026</p>

            <div className="prose prose-ink max-w-none space-y-8 text-ink-soft leading-relaxed">
                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">Delivery costs</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>
                            <strong>Free next-day delivery</strong> on all orders over{" "}
                            <strong>£40</strong>.
                        </li>
                        <li>
                            Orders under £40 attract a flat delivery fee of <strong>£3.99</strong>.
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">Order cutoff time</h2>
                    <p>
                        Place your order by <strong>8:00 pm</strong> and we will dispatch it the
                        same evening for next-day delivery. Orders placed after 8 pm will be
                        dispatched the following day.
                    </p>
                </section>

                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">Delivery coverage</h2>
                    <p>
                        We currently deliver to <strong>Great Britain</strong> (England, Scotland,
                        Wales) and <strong>Northern Ireland</strong>. Republic of Ireland
                        deliveries are also available — delivery times may be 1–2 days longer for
                        ROI addresses.
                    </p>
                    <p>
                        We do not yet ship to the Channel Islands, the Isle of Man, or international
                        addresses. We hope to expand coverage soon.
                    </p>
                </section>

                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">Estimated delivery times</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>
                            <strong>England, Wales &amp; Central Scotland:</strong> next working
                            day (order before 8 pm).
                        </li>
                        <li>
                            <strong>Scottish Highlands &amp; Islands:</strong> 2–3 working days.
                        </li>
                        <li>
                            <strong>Northern Ireland:</strong> 1–2 working days.
                        </li>
                        <li>
                            <strong>Republic of Ireland:</strong> 2–4 working days.
                        </li>
                    </ul>
                    <p>
                        Delivery estimates are not guaranteed and may be affected by courier
                        delays, public holidays, or extreme weather.
                    </p>
                </section>

                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">Our carriers</h2>
                    <p>
                        We use <strong>Royal Mail</strong> and <strong>DPD</strong> to fulfil
                        deliveries. Once your order is dispatched you will receive a shipping
                        confirmation email. Tracking information (where available) will be
                        included in that email.
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>
                            <strong>Royal Mail:</strong> used for smaller parcels and standard
                            deliveries.
                        </li>
                        <li>
                            <strong>DPD:</strong> used for larger or heavier orders. DPD will send
                            you a 1-hour delivery window notification on the morning of delivery.
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">Failed deliveries</h2>
                    <p>
                        If no one is available to receive the parcel, the carrier will attempt a
                        redelivery or leave a calling card with instructions to arrange a
                        convenient time. Unclaimed parcels will be returned to us after the
                        carrier&apos;s standard holding period.
                    </p>
                </section>

                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">Questions?</h2>
                    <p>
                        If you have not received your order within the expected timeframe, please
                        contact us at{" "}
                        <a
                            href={`mailto:${BRAND.contact.ordersEmail}`}
                            className="text-accent underline"
                        >
                            {BRAND.contact.ordersEmail}
                        </a>{" "}
                        with your order number and we will look into it right away.
                    </p>
                </section>
            </div>
        </div>
    );
}
