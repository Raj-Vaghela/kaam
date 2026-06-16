"use client";

import { Analytics } from "@vercel/analytics/next";
import { useConsent } from "@/context/ConsentContext";

/**
 * Renders Vercel Analytics only when the user has consented to analytics
 * cookies. Renders nothing before a decision is made or after rejection.
 */
export default function GatedAnalytics() {
    const { consent, hasDecided } = useConsent();

    if (!hasDecided || !consent.analytics) return null;

    return <Analytics />;
}
