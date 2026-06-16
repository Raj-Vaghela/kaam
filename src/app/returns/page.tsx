import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { renderModelCancellationForm } from "@/lib/legal/cancellation-form";

export const metadata: Metadata = {
    title: "Returns, Refunds & Cancellations",
    description:
        "GajjuExpress returns, refunds and cancellations policy — your statutory rights under the Consumer Contracts Regulations 2013 and Consumer Rights Act 2015.",
};

export default function ReturnsPage() {
    const registeredAddressStr = [
        BRAND.registeredAddress.line1,
        BRAND.registeredAddress.line2,
        BRAND.registeredAddress.city,
        BRAND.registeredAddress.postcode,
        BRAND.registeredAddress.country === "GB" ? "United Kingdom" : BRAND.registeredAddress.country,
    ]
        .filter(Boolean)
        .join(", ");

    const modelForm = renderModelCancellationForm({
        traderName: BRAND.legalName,
        traderAddress: registeredAddressStr,
        traderEmail: BRAND.contact.ordersEmail,
    });

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Link
                href="/"
                className="inline-flex items-center gap-2 text-ink-mute hover:text-accent text-sm font-medium mb-8"
            >
                <ArrowLeft size={16} /> Back to {BRAND.name}
            </Link>

            <h1 className="font-display text-5xl text-ink mb-3">Returns, Refunds &amp; Cancellations</h1>
            <p className="text-ink-mute mb-10">Last updated: 31 May 2026</p>

            <div className="prose prose-ink max-w-none space-y-10 text-ink-soft leading-relaxed">

                {/* ── 1. Statutory rights overview ─────────────────────────────── */}
                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">
                        1. Your statutory rights
                    </h2>
                    <p>
                        Your statutory rights are protected by UK law. These rights apply regardless
                        of anything else stated in this policy. In particular:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mt-3">
                        <li>
                            <strong>Consumer Contracts (Information, Cancellation and Additional Charges)
                            Regulations 2013 (SI 2013/3134)</strong> — gives you the right to cancel
                            most online orders within 14 days without giving any reason, and to
                            receive a full refund.
                        </li>
                        <li>
                            <strong>Consumer Rights Act 2015 (CRA 2015)</strong> — goods must be of
                            satisfactory quality, fit for purpose, and as described. If they are not,
                            you have remedies including a short-term right to reject, repair or
                            replacement, and price reduction or a final right to reject.
                        </li>
                    </ul>
                    <p className="mt-3">
                        Nothing in this policy limits or excludes these statutory rights.
                    </p>
                </section>

                {/* ── 2. Right to cancel (14 days) ─────────────────────────────── */}
                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">
                        2. Right to cancel within 14 days
                    </h2>
                    <p>
                        You have the right to cancel this contract within 14 days without giving
                        any reason. The cancellation period will expire after 14 days from the day
                        on which you (or a third party other than the carrier and indicated by you)
                        acquires physical possession of the goods.
                    </p>
                    <p className="mt-3">
                        Where you order multiple goods in a single order delivered separately, the
                        14-day period runs from the day you receive the last item.
                    </p>
                </section>

                {/* ── 3. How to cancel ─────────────────────────────────────────── */}
                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">3. How to cancel</h2>
                    <p>
                        To exercise the right to cancel, you must inform us —{" "}
                        <strong>{BRAND.legalName}</strong>,{" "}
                        {registeredAddressStr},{" "}
                        email:{" "}
                        <a href={`mailto:${BRAND.contact.ordersEmail}`} className="text-accent underline">
                            {BRAND.contact.ordersEmail}
                        </a>
                        {BRAND.contact.phone ? (
                            <>, phone: {BRAND.contact.phone}</>
                        ) : null}{" "}
                        — of your decision to cancel this contract by a clear statement (e.g. a
                        letter sent by post or e-mail).
                    </p>
                    <p className="mt-3">
                        You may use the model cancellation form below, but it is not obligatory.
                        To meet the cancellation deadline it is sufficient for you to send your
                        communication concerning your exercise of the right to cancel before the
                        cancellation period has expired.
                    </p>
                </section>

                {/* ── 4. Model cancellation form ───────────────────────────────── */}
                <section id="model-form">
                    <h2 className="font-display text-2xl text-ink mb-3">
                        4. Model cancellation form
                    </h2>
                    <p className="text-sm text-ink-mute mb-3">
                        (Schedule 3 Part B, Consumer Contracts Regulations 2013 — complete and
                        return only if you wish to cancel)
                    </p>
                    <pre className="bg-cream border border-ink/10 rounded-xl p-6 text-sm whitespace-pre-wrap font-mono leading-relaxed">
                        {modelForm}
                    </pre>
                </section>

                {/* ── 5. Effects of cancellation ───────────────────────────────── */}
                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">
                        5. Effects of cancellation
                    </h2>
                    <p>
                        If you cancel this contract, we will reimburse all payments received from
                        you, including the cost of standard delivery (except for any supplementary
                        costs arising if you chose a type of delivery other than the least expensive
                        type of standard delivery offered by us).
                    </p>
                    <p className="mt-3">
                        We will make the reimbursement without undue delay, and not later than:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mt-2">
                        <li>
                            14 days after the day we receive back from you any goods supplied, or
                        </li>
                        <li>
                            (if earlier) 14 days after the day you provide evidence that you have
                            returned the goods, or
                        </li>
                        <li>
                            if there were no goods supplied, 14 days after the day on which we are
                            informed about your decision to cancel this contract.
                        </li>
                    </ul>
                    <p className="mt-3">
                        We will make the reimbursement using the same means of payment as you used
                        for the initial transaction, unless you have expressly agreed otherwise;
                        in any event, you will not incur any fees as a result of the reimbursement.
                    </p>
                    <p className="mt-3">
                        You must send back the goods or hand them over to us without undue delay and
                        in any event not later than 14 days from the day on which you communicate
                        your cancellation. The deadline is met if you send back the goods before
                        the period of 14 days has expired.
                    </p>
                </section>

                {/* ── 6. Return shipping ───────────────────────────────────────── */}
                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">6. Return shipping costs</h2>
                    <p>
                        You will have to bear the direct cost of returning the goods, unless the
                        return is due to our error (e.g. wrong item sent, item damaged in transit,
                        or item not as described), in which case we will cover the return postage.
                    </p>
                    <p className="mt-3">
                        To arrange a return, email{" "}
                        <a
                            href={`mailto:${BRAND.contact.ordersEmail}`}
                            className="text-accent underline"
                        >
                            {BRAND.contact.ordersEmail}
                        </a>{" "}
                        with your order number and reason for return. We will respond within 1–2
                        working days.
                    </p>
                </section>

                {/* ── 7. Diminished value ──────────────────────────────────────── */}
                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">7. Diminished value</h2>
                    <p>
                        You are only liable for any diminished value of the goods resulting from
                        handling other than what is necessary to establish the nature,
                        characteristics and functioning of the goods.
                    </p>
                </section>

                {/* ── 8. Exceptions to the right to cancel ─────────────────────── */}
                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">
                        8. Goods exempt from the right to cancel
                    </h2>
                    <p>
                        Certain categories of goods are exempt from the right to cancel under
                        Regulation 28 of the Consumer Contracts Regulations 2013:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mt-3">
                        <li>
                            <strong>Perishable goods</strong> — items liable to deteriorate or
                            expire rapidly (e.g. fresh produce, chilled or frozen goods, fresh
                            bread and pastries).
                        </li>
                        <li>
                            <strong>Sealed goods opened after delivery</strong> — goods which are
                            not suitable for return due to health protection or hygiene reasons and
                            were sealed before delivery but have been unsealed by you after delivery
                            (e.g. opened food packages, unsealed spice blends or oils).
                        </li>
                        <li>
                            <strong>Customised or personalised goods</strong> — goods made to your
                            specification or clearly personalised.
                        </li>
                    </ul>
                    <p className="mt-3">
                        The exemptions above do not affect your rights under the Consumer Rights
                        Act 2015 if the goods are faulty, not as described, or not fit for purpose.
                    </p>
                </section>

                {/* ── 9. Faulty / non-conforming goods (CRA 2015) ──────────────── */}
                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">
                        9. Faulty or non-conforming goods (Consumer Rights Act 2015)
                    </h2>
                    <p>
                        Under the Consumer Rights Act 2015, goods must be of satisfactory quality,
                        fit for purpose, and as described. If your goods do not meet these
                        standards, you have the following statutory remedies:
                    </p>
                    <ol className="list-decimal pl-6 space-y-3 mt-3">
                        <li>
                            <strong>Short-term right to reject (within 30 days of delivery)</strong> —
                            you can reject the goods and receive a full refund, without needing to
                            give us the opportunity to repair or replace them first.
                        </li>
                        <li>
                            <strong>Right to repair or replacement</strong> — after 30 days (or if
                            you choose not to exercise the short-term right to reject), you can ask
                            us to repair or replace the goods. We must do so within a reasonable
                            time and without significant inconvenience to you.
                        </li>
                        <li>
                            <strong>Price reduction or final right to reject</strong> — if repair or
                            replacement is impossible or fails, you are entitled to a price reduction
                            of up to 100% of the price paid, or to reject the goods and receive a
                            full or partial refund.
                        </li>
                    </ol>
                    <p className="mt-3">
                        If your order arrives damaged or you receive the wrong item, please contact
                        us at{" "}
                        <a
                            href={`mailto:${BRAND.contact.ordersEmail}`}
                            className="text-accent underline"
                        >
                            {BRAND.contact.ordersEmail}
                        </a>{" "}
                        as soon as possible with a photo of the issue and your order number.
                        For perishable items, please contact us within 48 hours of delivery.
                    </p>
                </section>

                {/* ── 10. Voluntary returns terms ──────────────────────────────── */}
                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">
                        10. Our voluntary returns policy (additional to your statutory rights)
                    </h2>
                    <p>
                        In addition to your statutory rights above, we offer the following as a
                        goodwill measure. These voluntary terms do not limit or replace your
                        statutory rights — they are provided on top of them:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mt-3">
                        <li>
                            For eligible non-perishable, sealed items we will accept returns up to
                            28 days from delivery (14 days longer than the statutory minimum) as a
                            gesture of goodwill.
                        </li>
                        <li>
                            Our customer care team aims to process all returns requests within 1–2
                            working days and to issue refunds within 3–5 working days of receiving
                            returned goods.
                        </li>
                    </ul>
                    <p className="mt-3 text-ink-mute text-sm">
                        This voluntary policy does not affect your legal rights. For your statutory
                        rights under the Consumer Contracts Regulations 2013 and Consumer Rights Act
                        2015, see sections 1–9 above.
                    </p>
                </section>

                {/* ── Contact ─────────────────────────────────────────────────── */}
                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">Contact us</h2>
                    <p>
                        For any questions about returns or refunds, contact our customer care team:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mt-2">
                        <li>
                            Email:{" "}
                            <a
                                href={`mailto:${BRAND.contact.ordersEmail}`}
                                className="text-accent underline"
                            >
                                {BRAND.contact.ordersEmail}
                            </a>
                        </li>
                        {BRAND.contact.phone && (
                            <li>Phone: {BRAND.contact.phone} (Mon–Fri, 9am–5pm)</li>
                        )}
                        <li>Post: {registeredAddressStr}</li>
                    </ul>
                </section>

            </div>
        </div>
    );
}
