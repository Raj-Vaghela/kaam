"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const CONSENT_KEY = "cookie-consent-v2";

export default function CookieConsent() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const decision = localStorage.getItem(CONSENT_KEY);
        if (!decision) setVisible(true);
    }, []);

    const accept = () => {
        localStorage.setItem(CONSENT_KEY, "accepted");
        setVisible(false);
    };

    const decline = () => {
        localStorage.setItem(CONSENT_KEY, "declined");
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div className="fixed bottom-0 inset-x-0 z-[100] p-4 sm:p-6">
            <div className="max-w-xl mx-auto bg-white border border-cream-deep rounded-2xl shadow-lg px-6 py-5">
                <p className="text-sm text-ink-soft mb-4">
                    We use essential cookies to keep you signed in and process orders. No advertising or tracking cookies are used.{" "}
                    <Link href="/privacy" className="text-accent underline">
                        Privacy Policy
                    </Link>
                </p>
                <div className="flex items-center gap-3">
                    <button
                        onClick={accept}
                        className="bg-accent text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-accent-deep transition-colors"
                    >
                        Accept
                    </button>
                    <button
                        onClick={decline}
                        className="bg-cream text-ink-mute border border-cream-deep px-5 py-2.5 rounded-full text-sm font-semibold hover:border-ink-mute transition-colors"
                    >
                        Decline
                    </button>
                </div>
            </div>
        </div>
    );
}
