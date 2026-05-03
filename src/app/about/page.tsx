import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
    title: "Our Story",
    description:
        "Learn about GajjuExpress — our founding story, how we source authentic Indian groceries, our sustainability commitments, and career opportunities.",
};

export default function AboutPage() {
    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Link
                href="/"
                className="inline-flex items-center gap-2 text-ink-mute hover:text-accent text-sm font-medium mb-8"
            >
                <ArrowLeft size={16} /> Back to {BRAND.name}
            </Link>

            <h1 className="font-display text-5xl text-ink mb-3">Our Story</h1>
            <p className="text-ink-mute mb-10">
                {BRAND.name} &mdash; bringing home closer since {BRAND.foundedYear}.
            </p>

            <div className="prose prose-ink max-w-none space-y-8 text-ink-soft leading-relaxed">
                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">Where it all began</h2>
                    <p>
                        {BRAND.name} was founded in {BRAND.foundedYear} from a simple, heartfelt
                        need: to make it easy for Indian families across the UK to find the
                        groceries they grew up with. Our founder, a Gujarati family man living in
                        Wembley, was tired of the long trips and the compromises — the wrong
                        brand of atta, masalas past their prime, namkeen that tasted nothing like
                        home.
                    </p>
                    <p>
                        What started as a small operation out of {BRAND.address.line1} in{" "}
                        {BRAND.address.city} has grown into one of the UK&apos;s most trusted
                        online Indian grocery stores, serving thousands of families from
                        Edinburgh to Exeter with next-day delivery and the same care you would
                        expect from a family-run shop.
                    </p>
                </section>

                <section>
                    <h2 className="font-display text-2xl text-ink mb-3">Our values</h2>
                    <p>
                        Three things have guided us from day one:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>
                            <strong>Authenticity:</strong> every product we stock is the genuine
                            article — the same brands your family trusts back home.
                        </li>
                        <li>
                            <strong>Community:</strong> we exist to serve the British Indian
                            community, and we give back through partnerships with local temples,
                            cultural events, and food banks.
                        </li>
                        <li>
                            <strong>Freshness:</strong> we rotate stock rigorously so you always
                            receive products well within their shelf life.
                        </li>
                    </ul>
                </section>

                <section id="sourcing">
                    <h2 className="font-display text-2xl text-ink mb-3">How we source</h2>
                    <p>
                        We work directly with importers and authorised UK distributors who share
                        our commitment to quality. Our products arrive through official supply
                        chains — never grey-market, never repackaged. This means you can be
                        confident that the Aashirvaad, MDH, Haldiram&apos;s, or Amul product in
                        your basket is exactly what it says on the label.
                    </p>
                    <p>
                        Where possible, we also stock products from British Asian producers and
                        food artisans, celebrating the vibrant culinary culture that has taken
                        root in cities like Leicester, Birmingham, and London.
                    </p>
                </section>

                <section id="sustainability">
                    <h2 className="font-display text-2xl text-ink mb-3">Sustainability</h2>
                    <p>
                        We know that a grocery delivery service has an environmental footprint,
                        and we are working hard to reduce ours. Our current commitments include:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>
                            <strong>Recyclable packaging:</strong> all our boxes, void fill, and
                            tape are made from recycled or recyclable materials.
                        </li>
                        <li>
                            <strong>Route optimisation:</strong> we consolidate deliveries to
                            reduce the number of vans on the road.
                        </li>
                        <li>
                            <strong>Food waste reduction:</strong> near-expiry stock is donated
                            to local food banks and charities rather than discarded.
                        </li>
                        <li>
                            <strong>Carbon offsetting:</strong> we are currently reviewing
                            accredited offset schemes to neutralise our remaining emissions.
                        </li>
                    </ul>
                    <p>
                        We have more to do, and we will publish a full sustainability report
                        later this year.
                    </p>
                </section>

                <section id="careers">
                    <h2 className="font-display text-2xl text-ink mb-3">Join our team</h2>
                    <p>
                        We are a small, passionate team based in{" "}
                        {BRAND.address.city} and we are always on the lookout for people who
                        share our love of food and community. Whether you are interested in
                        warehouse operations, customer care, or digital marketing, we would love
                        to hear from you.
                    </p>
                    <p>
                        Send your CV and a short note about yourself to{" "}
                        <a
                            href={`mailto:${BRAND.contact.email}`}
                            className="text-accent underline"
                        >
                            {BRAND.contact.email}
                        </a>{" "}
                        with the subject line <strong>Careers at {BRAND.name}</strong>. We review
                        all applications and will get back to you if there is a suitable
                        opening.
                    </p>
                    <p>
                        {BRAND.legalName} is an equal opportunities employer. We celebrate
                        diversity and are committed to creating an inclusive environment for
                        all employees.
                    </p>
                </section>
            </div>
        </div>
    );
}
