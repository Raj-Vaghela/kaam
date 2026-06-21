import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BRAND } from "@/lib/brand";
import CookieReopenButton from "@/components/gdpr/CookieReopenButton";

export const metadata: Metadata = {
    title: "Privacy Notice",
    description: `Read the GajjuExpress privacy notice to understand how we collect, use and protect your personal data under the UK GDPR.`,
    robots: { index: true, follow: false },
};

export default function PrivacyPolicyPage() {
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

            <h1 className="font-display text-5xl text-ink mb-3">Privacy Notice</h1>
            <p className="text-ink-mute mb-2">Last updated: 31 May 2026 · Version 2.0</p>
            <p className="text-sm text-ink-mute mb-10">
                This notice is provided under Article 13 of the UK General Data Protection
                Regulation (UK GDPR) and the Data Protection Act 2018.
            </p>

            <div className="prose prose-ink max-w-none space-y-10 text-ink-soft leading-relaxed">

                {/* ── 1. Controller identity ────────────────────────────────────── */}
                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">1. Who we are (data controller)</h2>
                    <p>
                        <strong>{BRAND.legalName}</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;,
                        &ldquo;our&rdquo;) is the data controller for personal data collected
                        through the {BRAND.name} website (gajjuexpress.co.uk).
                    </p>
                    <ul className="list-none pl-0 space-y-1 mt-3">
                        <li>
                            <strong>Company number:</strong> {BRAND.companyNumber}
                        </li>
                        <li>
                            <strong>Registered office:</strong> {registeredAddressStr}
                        </li>
                        <li>
                            <strong>Contact email:</strong>{" "}
                            <a
                                href={`mailto:${BRAND.contact.email}`}
                                className="text-accent underline"
                            >
                                {BRAND.contact.email}
                            </a>
                        </li>
                        {BRAND.contact.phone && (
                            <li>
                                <strong>Phone:</strong> {BRAND.contact.phone}
                            </li>
                        )}
                    </ul>
                </section>

                {/* ── 2. DPO ────────────────────────────────────────────────────── */}
                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">
                        2. Data Protection Officer (DPO)
                    </h2>
                    <p>
                        We have not appointed a DPO as we are not required to do so under
                        Article 37 of the UK GDPR (we do not carry out large-scale systematic
                        monitoring of individuals and our core activities do not involve
                        large-scale processing of special category data).
                    </p>
                    <p className="mt-2">
                        Data protection queries can be directed to{" "}
                        <a
                            href={`mailto:${BRAND.contact.email}`}
                            className="text-accent underline"
                        >
                            {BRAND.contact.email}
                        </a>
                        .
                    </p>
                </section>

                {/* ── 3. Data we collect ────────────────────────────────────────── */}
                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">3. What data we collect</h2>
                    <ul className="list-disc pl-6 space-y-3">
                        <li>
                            <strong>Account data:</strong> name, email address, hashed password
                            (we never see your plaintext password), account creation date.
                            If you sign in with Google, we receive your email address and basic
                            profile (full name) from Google in place of a password — never your
                            Google contacts, files, or any other Google data.
                        </li>
                        <li>
                            <strong>Order and transaction data:</strong> delivery address, phone
                            number, order history, itemised invoices, payment status.
                        </li>
                        <li>
                            <strong>Payment data:</strong> processed entirely by Stripe. We
                            receive only a tokenised reference and payment status — we never
                            store card numbers, CVVs, or full payment details.
                        </li>
                        <li>
                            <strong>Communications:</strong> messages you send us via email or
                            contact forms, including returns and complaints.
                        </li>
                        <li>
                            <strong>Technical and usage data:</strong> IP address, browser type,
                            device type, referring URL, pages visited, and session identifiers
                            (via essential cookies and, with your consent, analytics tools).
                        </li>
                        <li>
                            <strong>Marketing preferences:</strong> whether you have opted in to
                            receive marketing emails, your consent timestamp, consent text, and
                            IP address at the time of subscription.
                        </li>
                    </ul>
                </section>

                {/* ── 4. Purposes and legal bases ───────────────────────────────── */}
                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">
                        4. Why we collect it — purposes and legal bases
                    </h2>
                    <p className="mb-4">
                        The table below sets out each purpose for which we process your data and
                        the lawful basis under Article 6 of the UK GDPR.
                    </p>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-cream border-b border-ink/10">
                                    <th className="text-left p-3 font-semibold text-ink">Purpose</th>
                                    <th className="text-left p-3 font-semibold text-ink">Legal basis</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-ink/5">
                                <tr>
                                    <td className="p-3">Account creation and management</td>
                                    <td className="p-3">Contract — Art. 6(1)(b)</td>
                                </tr>
                                <tr>
                                    <td className="p-3">Order fulfilment and delivery</td>
                                    <td className="p-3">Contract — Art. 6(1)(b)</td>
                                </tr>
                                <tr>
                                    <td className="p-3">Payment processing and fraud prevention</td>
                                    <td className="p-3">Contract + Legitimate Interest — Art. 6(1)(b) &amp; (f)</td>
                                </tr>
                                <tr>
                                    <td className="p-3">Transactional emails (order confirmation, dispatch, refunds)</td>
                                    <td className="p-3">Contract — Art. 6(1)(b)</td>
                                </tr>
                                <tr>
                                    <td className="p-3">Marketing emails and newsletters</td>
                                    <td className="p-3">Consent — Art. 6(1)(a) + PECR reg. 22</td>
                                </tr>
                                <tr>
                                    <td className="p-3">Website analytics and performance monitoring</td>
                                    <td className="p-3">Consent — Art. 6(1)(a)</td>
                                </tr>
                                <tr>
                                    <td className="p-3">Error monitoring and session diagnostics</td>
                                    <td className="p-3">Consent — Art. 6(1)(a)</td>
                                </tr>
                                <tr>
                                    <td className="p-3">Tax and accounting records (invoices, VAT)</td>
                                    <td className="p-3">Legal obligation — Art. 6(1)(c) (HMRC, 6 years)</td>
                                </tr>
                                <tr>
                                    <td className="p-3">Defending or establishing legal claims</td>
                                    <td className="p-3">Legitimate Interest — Art. 6(1)(f)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* ── 5. Sub-processors ─────────────────────────────────────────── */}
                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">
                        5. Who we share your data with (sub-processors)
                    </h2>
                    <p>We share your data only with the third parties listed below:</p>
                    <div className="overflow-x-auto mt-4">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-cream border-b border-ink/10">
                                    <th className="text-left p-3 font-semibold text-ink">Provider</th>
                                    <th className="text-left p-3 font-semibold text-ink">Purpose</th>
                                    <th className="text-left p-3 font-semibold text-ink">Location</th>
                                    <th className="text-left p-3 font-semibold text-ink">Safeguards</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-ink/5">
                                <tr>
                                    <td className="p-3">
                                        <a href="https://stripe.com/privacy" className="text-accent underline" target="_blank" rel="noopener noreferrer">Stripe</a>
                                    </td>
                                    <td className="p-3">Payment processing, fraud detection</td>
                                    <td className="p-3">US</td>
                                    <td className="p-3">UK IDTA / SCCs</td>
                                </tr>
                                <tr>
                                    <td className="p-3">
                                        <a href="https://supabase.com/privacy" className="text-accent underline" target="_blank" rel="noopener noreferrer">Supabase</a>
                                    </td>
                                    <td className="p-3">Database, authentication, file storage</td>
                                    <td className="p-3">EU region — verify with your project dashboard</td>
                                    <td className="p-3">EU adequacy / SCCs</td>
                                </tr>
                                <tr>
                                    <td className="p-3">
                                        <a href="https://resend.com/privacy" className="text-accent underline" target="_blank" rel="noopener noreferrer">Resend</a>
                                    </td>
                                    <td className="p-3">Transactional and marketing email delivery</td>
                                    <td className="p-3">US</td>
                                    <td className="p-3">UK IDTA / SCCs</td>
                                </tr>
                                <tr>
                                    <td className="p-3">Sendcloud</td>
                                    <td className="p-3">Shipping label generation and tracking</td>
                                    <td className="p-3">EU (NL)</td>
                                    <td className="p-3">UK adequacy (EU adequacy)</td>
                                </tr>
                                <tr>
                                    <td className="p-3">Evri (Hermes UK)</td>
                                    <td className="p-3">Parcel delivery</td>
                                    <td className="p-3">UK</td>
                                    <td className="p-3">UK domestic</td>
                                </tr>
                                <tr>
                                    <td className="p-3">
                                        <a href="https://policies.google.com/privacy" className="text-accent underline" target="_blank" rel="noopener noreferrer">Google</a>
                                    </td>
                                    <td className="p-3">Sign-in identity verification (only when you choose &ldquo;Sign in with Google&rdquo;)</td>
                                    <td className="p-3">EU/US</td>
                                    <td className="p-3">UK IDTA / SCCs</td>
                                </tr>
                                <tr>
                                    <td className="p-3">
                                        <a href="https://vercel.com/legal/privacy-policy" className="text-accent underline" target="_blank" rel="noopener noreferrer">Vercel</a>
                                    </td>
                                    <td className="p-3">Hosting, CDN, Vercel Analytics</td>
                                    <td className="p-3">US</td>
                                    <td className="p-3">UK IDTA / SCCs</td>
                                </tr>
                                <tr>
                                    <td className="p-3">
                                        <a href="https://sentry.io/privacy/" className="text-accent underline" target="_blank" rel="noopener noreferrer">Sentry</a>
                                    </td>
                                    <td className="p-3">Error monitoring and session replay (masked)</td>
                                    <td className="p-3">US</td>
                                    <td className="p-3">UK IDTA / SCCs</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p className="mt-3">We do not sell your data to any third party.</p>
                </section>

                {/* ── 6. International transfers ────────────────────────────────── */}
                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">6. International transfers</h2>
                    <p>
                        Some of our sub-processors are based in the United States. Transfers
                        to the US are protected by the UK International Data Transfer Agreement
                        (IDTA) or UK-approved Standard Contractual Clauses (SCCs) as required
                        under the UK GDPR and the International Data Transfer Agreement
                        Regulations 2022. This means any personal data transferred to the US
                        is subject to equivalent protections to those provided under UK law.
                    </p>
                    <p className="mt-3">
                        Transfers to EU/EEA-based processors are covered by the UK&apos;s
                        adequacy regulations in respect of the EEA.
                    </p>
                </section>

                {/* ── 7. Retention ─────────────────────────────────────────────── */}
                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">7. How long we keep your data</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-cream border-b border-ink/10">
                                    <th className="text-left p-3 font-semibold text-ink">Category</th>
                                    <th className="text-left p-3 font-semibold text-ink">Retention period</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-ink/5">
                                <tr>
                                    <td className="p-3">Account data</td>
                                    <td className="p-3">Until account deletion; financial records retained 6 years (anonymised)</td>
                                </tr>
                                <tr>
                                    <td className="p-3">Orders and invoices</td>
                                    <td className="p-3">6 years from transaction date (HMRC requirement), then deleted</td>
                                </tr>
                                <tr>
                                    <td className="p-3">Guest checkout data</td>
                                    <td className="p-3">6 years from order date (HMRC), then anonymised</td>
                                </tr>
                                <tr>
                                    <td className="p-3">Newsletter subscriptions</td>
                                    <td className="p-3">Until you unsubscribe; consent record retained 3 years thereafter for compliance evidence</td>
                                </tr>
                                <tr>
                                    <td className="p-3">Error logs (Sentry)</td>
                                    <td className="p-3">90 days</td>
                                </tr>
                                <tr>
                                    <td className="p-3">Analytics data (Vercel)</td>
                                    <td className="p-3">Aggregated; retained per Vercel&apos;s default retention. No individual-level data stored by us.</td>
                                </tr>
                                <tr>
                                    <td className="p-3">Support communications</td>
                                    <td className="p-3">3 years from last contact</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* ── 8. Your rights ────────────────────────────────────────────── */}
                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">8. Your rights under the UK GDPR</h2>
                    <p>You have the following rights regarding your personal data:</p>
                    <ul className="list-disc pl-6 space-y-3 mt-3">
                        <li>
                            <strong>Right of access (Art. 15)</strong> — request a copy of all
                            personal data we hold about you. Submit a request to{" "}
                            <a href={`mailto:${BRAND.contact.email}`} className="text-accent underline">
                                {BRAND.contact.email}
                            </a>
                            {" "}or from your{" "}
                            <Link href="/account" className="text-accent underline">account settings</Link>.
                        </li>
                        <li>
                            <strong>Right to rectification (Art. 16)</strong> — correct inaccurate
                            or incomplete data. Update most data directly in your{" "}
                            <Link href="/account" className="text-accent underline">account settings</Link>.
                        </li>
                        <li>
                            <strong>Right to erasure / &apos;right to be forgotten&apos; (Art. 17)</strong>{" "}
                            — request deletion of your account and associated personal data. Note: we
                            must retain financial records for 6 years under HMRC requirements, but
                            these will be anonymised. Request via your{" "}
                            <Link href="/account" className="text-accent underline">account settings</Link>{" "}
                            or by emailing us.
                        </li>
                        <li>
                            <strong>Right to restriction of processing (Art. 18)</strong> — ask us
                            to pause processing of your data in certain circumstances (e.g. while a
                            dispute is resolved).
                        </li>
                        <li>
                            <strong>Right to data portability (Art. 20)</strong> — receive your
                            data in a structured, commonly used, machine-readable format. Available
                            from your account settings.
                        </li>
                        <li>
                            <strong>Right to object (Art. 21)</strong> — object to processing based
                            on legitimate interest at any time. You may also opt out of marketing
                            emails at any time via the unsubscribe link in any email or by emailing
                            us.
                        </li>
                        <li>
                            <strong>Right to withdraw consent (Art. 7(3))</strong> — where
                            processing is based on consent (marketing, analytics, error monitoring),
                            you may withdraw that consent at any time without affecting the
                            lawfulness of processing before withdrawal.
                        </li>
                    </ul>
                    <p className="mt-4">
                        To exercise any of these rights, contact us at{" "}
                        <a href={`mailto:${BRAND.contact.email}`} className="text-accent underline">
                            {BRAND.contact.email}
                        </a>
                        . We will respond within one month (or notify you if we need up to three
                        months for complex requests).
                    </p>
                    <p className="mt-3">
                        You have the right to lodge a complaint with the UK&apos;s supervisory
                        authority:
                    </p>
                    <p className="mt-2 pl-4 border-l-4 border-accent/30">
                        <strong>Information Commissioner&apos;s Office (ICO)</strong><br />
                        <a
                            href="https://ico.org.uk/make-a-complaint/"
                            className="text-accent underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            https://ico.org.uk/make-a-complaint/
                        </a>{" "}
                        · 0303 123 1113
                    </p>
                </section>

                {/* ── 9. Automated decision-making ──────────────────────────────── */}
                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">
                        9. Automated decision-making and profiling
                    </h2>
                    <p>
                        We use <strong>Stripe Radar</strong>, Stripe&apos;s fraud detection
                        service, which applies machine-learning models to assess transaction risk.
                        This constitutes automated processing but does not constitute solely
                        automated decision-making within the meaning of Article 22 UK GDPR:
                        disputed transactions are subject to manual review by our team or by Stripe.
                    </p>
                    <p className="mt-3">
                        We do not otherwise make solely automated decisions that produce legal or
                        similarly significant effects on you.
                    </p>
                </section>

                {/* ── 10. Cookies ───────────────────────────────────────────────── */}
                <section id="cookies">
                    <h2 className="font-display text-2xl text-ink mb-3">10. Cookies and similar technologies</h2>
                    <p>
                        We use cookies and similar storage technologies. You can manage your
                        preferences at any time using the button below:
                    </p>
                    <div className="mt-4 mb-4">
                        <CookieReopenButton />
                    </div>

                    <h3 className="font-semibold text-ink mt-5 mb-2">Always-on (essential) cookies</h3>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>
                            <strong>Supabase auth session</strong> — stores your login session
                            (JWT). Essential for account access. Expires with browser session or
                            after 7 days.
                        </li>
                        <li>
                            <strong>Stripe</strong> — fraud prevention token associated with
                            payment initiation. Essential for payment. See{" "}
                            <a
                                href="https://stripe.com/cookies-policy"
                                className="text-accent underline"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Stripe&apos;s cookies policy
                            </a>
                            .
                        </li>
                        <li>
                            <strong>Cookie consent preference</strong> — stores your consent
                            choices. Essential for remembering your settings.
                        </li>
                    </ul>

                    <h3 className="font-semibold text-ink mt-5 mb-2">Consent-gated cookies (only set with your permission)</h3>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>
                            <strong>Vercel Analytics</strong> — page view and performance
                            analytics. Aggregated; no individual tracking. Activated only after
                            analytics consent.
                        </li>
                        <li>
                            <strong>Sentry error monitoring</strong> — captures JavaScript errors
                            and (if enabled) masked session replays to help us fix bugs. Personal
                            data in errors is scrubbed. Activated only after analytics/error
                            monitoring consent.
                        </li>
                    </ul>
                </section>

                {/* ── 11. Changes ───────────────────────────────────────────────── */}
                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">11. Changes to this notice</h2>
                    <p>
                        We review and update this notice periodically. The version number and
                        &ldquo;last updated&rdquo; date at the top of this page reflect the current version.
                    </p>
                    <p className="mt-3">
                        We will notify you of material changes by email (if you have an account)
                        and/or by a prominent notice on the website before the change takes effect.
                    </p>
                </section>

                {/* ── 12. Contact ───────────────────────────────────────────────── */}
                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">12. Contact us</h2>
                    <p>
                        For any data protection query, access request, or complaint:
                    </p>
                    <ul className="list-none pl-0 space-y-1 mt-3">
                        <li>
                            <strong>Email:</strong>{" "}
                            <a
                                href={`mailto:${BRAND.contact.email}`}
                                className="text-accent underline"
                            >
                                {BRAND.contact.email}
                            </a>
                        </li>
                        {BRAND.contact.phone && (
                            <li><strong>Phone:</strong> {BRAND.contact.phone}</li>
                        )}
                        <li><strong>Post:</strong> {registeredAddressStr}</li>
                    </ul>
                    <p className="mt-4">
                        You also have the right to complain directly to the ICO at{" "}
                        <a
                            href="https://ico.org.uk/make-a-complaint/"
                            className="text-accent underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            https://ico.org.uk/make-a-complaint/
                        </a>
                        .
                    </p>
                </section>

            </div>
        </div>
    );
}
