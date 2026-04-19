"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const CONSENT_KEY = "cookie-consent-accepted";

export default function CookieConsent() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const accepted = localStorage.getItem(CONSENT_KEY);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (!accepted) setVisible(true);
    }, []);

    const accept = () => {
        localStorage.setItem(CONSENT_KEY, "true");
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div className="fixed bottom-0 inset-x-0 z-[100] p-4 sm:p-6">
            <div className="max-w-lg mx-auto bg-white border border-cream-deep rounded-2xl shadow-lg px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <p className="text-sm text-ink-soft flex-1">
                    We use essential cookies to keep you signed in and process orders.
                    See our{" "}
                    <Link href="/privacy" className="text-accent underline">
                        Privacy Policy
                    </Link>
                    .
                </p>
                <button
                    onClick={accept}
                    className="shrink-0 bg-accent text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-accent-deep transition-colors"
                >
                    Got it
                </button>
            </div>
        </div>
    );
}
