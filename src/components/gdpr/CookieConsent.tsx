"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useConsent } from "@/context/ConsentContext";

// ---------------------------------------------------------------------------
// Main banner component
// ---------------------------------------------------------------------------

export default function CookieConsent() {
    const { isBannerOpen, consent, acceptAll, rejectAll, setConsent, closeBanner } =
        useConsent();

    const [view, setView] = useState<"main" | "customize">("main");
    const [draftAnalytics, setDraftAnalytics] = useState(consent.analytics);
    const [draftErrorTracking, setDraftErrorTracking] = useState(
        consent.errorTracking
    );

    // Reset draft values whenever banner opens
    useEffect(() => {
        if (isBannerOpen) {
            setView("main");
            setDraftAnalytics(consent.analytics);
            setDraftErrorTracking(consent.errorTracking);
        }
    }, [isBannerOpen, consent.analytics, consent.errorTracking]);

    // Focus management: move focus into dialog when it opens
    const dialogRef = useRef<HTMLDivElement>(null);
    const defaultFocusRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (isBannerOpen) {
            // Small delay to allow the DOM to paint before stealing focus
            const id = setTimeout(() => {
                defaultFocusRef.current?.focus();
            }, 50);
            return () => clearTimeout(id);
        }
    }, [isBannerOpen, view]);

    // Trap focus within the dialog
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Escape") {
            // Escape closes only if user has previously decided — otherwise
            // they must make an explicit choice (PECR requirement)
            closeBanner();
            return;
        }
        if (e.key !== "Tab") return;

        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
        } else {
            if (document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    };

    if (!isBannerOpen) return null;

    const handleSaveCustom = () => {
        setConsent({ analytics: draftAnalytics, errorTracking: draftErrorTracking });
    };

    return (
        // Backdrop overlay — subtle, not blocking
        <div
            className="fixed inset-0 z-[200] flex items-end justify-center p-4 sm:p-6 sm:items-end pointer-events-none"
            aria-hidden="true"
        >
            {/* Dialog */}
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="cookie-dialog-title"
                aria-describedby="cookie-dialog-desc"
                onKeyDown={handleKeyDown}
                className="pointer-events-auto w-full max-w-xl bg-white border border-[#e8dfd0] rounded-2xl shadow-xl px-6 py-5 focus:outline-none"
                tabIndex={-1}
            >
                {view === "main" ? (
                    <MainView
                        onAcceptAll={acceptAll}
                        onRejectAll={rejectAll}
                        onCustomize={() => setView("customize")}
                        defaultFocusRef={defaultFocusRef}
                    />
                ) : (
                    <CustomizeView
                        draftAnalytics={draftAnalytics}
                        draftErrorTracking={draftErrorTracking}
                        onChangeAnalytics={setDraftAnalytics}
                        onChangeErrorTracking={setDraftErrorTracking}
                        onSave={handleSaveCustom}
                        onBack={() => setView("main")}
                        defaultFocusRef={defaultFocusRef}
                    />
                )}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

type MainViewProps = {
    onAcceptAll: () => void;
    onRejectAll: () => void;
    onCustomize: () => void;
    defaultFocusRef: React.RefObject<HTMLButtonElement | null>;
};

function MainView({ onAcceptAll, onRejectAll, onCustomize, defaultFocusRef }: MainViewProps) {
    return (
        <>
            <h2
                id="cookie-dialog-title"
                className="text-base font-semibold text-[#1a1a1a] mb-2"
            >
                Cookies &amp; your privacy
            </h2>
            <p
                id="cookie-dialog-desc"
                className="text-sm text-[#6b6355] mb-4 leading-relaxed"
            >
                We use essential cookies to keep you signed in and to process orders
                securely. With your consent, we also collect{" "}
                <strong>anonymised page views</strong> to improve our site and use{" "}
                <strong>error monitoring</strong> to fix problems quickly — no
                personal details are captured. You can change your choice at any time.{" "}
                <Link
                    href="/privacy"
                    className="text-[#b45309] underline underline-offset-2 hover:text-[#92400e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b45309] rounded-sm"
                >
                    Privacy policy
                </Link>
                .
            </p>

            <div className="flex flex-wrap items-center gap-3">
                {/* "Reject non-essential" is default-focused per spec */}
                <button
                    ref={defaultFocusRef}
                    onClick={onRejectAll}
                    className="min-h-[44px] min-w-[44px] px-5 py-2.5 rounded-full text-sm font-semibold bg-[#f5f0e8] text-[#4a4035] border border-[#e8dfd0] hover:border-[#a89070] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b45309]"
                >
                    Reject non-essential
                </button>
                <button
                    onClick={onAcceptAll}
                    className="min-h-[44px] min-w-[44px] px-5 py-2.5 rounded-full text-sm font-semibold bg-[#b45309] text-white hover:bg-[#92400e] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b45309]"
                >
                    Accept all
                </button>
                <button
                    onClick={onCustomize}
                    className="min-h-[44px] min-w-[44px] px-5 py-2.5 rounded-full text-sm font-semibold text-[#4a4035] underline underline-offset-2 hover:text-[#1a1a1a] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b45309]"
                >
                    Customize
                </button>
            </div>
        </>
    );
}

// ---------------------------------------------------------------------------
// Customize view
// ---------------------------------------------------------------------------

type CustomizeViewProps = {
    draftAnalytics: boolean;
    draftErrorTracking: boolean;
    onChangeAnalytics: (v: boolean) => void;
    onChangeErrorTracking: (v: boolean) => void;
    onSave: () => void;
    onBack: () => void;
    defaultFocusRef: React.RefObject<HTMLButtonElement | null>;
};

function CustomizeView({
    draftAnalytics,
    draftErrorTracking,
    onChangeAnalytics,
    onChangeErrorTracking,
    onSave,
    onBack,
    defaultFocusRef,
}: CustomizeViewProps) {
    return (
        <>
            <h2
                id="cookie-dialog-title"
                className="text-base font-semibold text-[#1a1a1a] mb-1"
            >
                Customize cookie preferences
            </h2>
            <p
                id="cookie-dialog-desc"
                className="text-sm text-[#6b6355] mb-4 leading-relaxed"
            >
                Essential cookies are always active. Toggle optional cookies below.
            </p>

            <fieldset className="mb-5 space-y-3">
                <legend className="sr-only">Optional cookie categories</legend>

                {/* Essential — always on, non-interactive */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#faf7f2] border border-[#e8dfd0]">
                    <span
                        aria-hidden="true"
                        className="mt-0.5 h-5 w-5 rounded border-2 border-[#c4b89a] bg-[#c4b89a] flex items-center justify-center flex-shrink-0"
                    >
                        <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 12 12"
                            aria-hidden="true"
                        >
                            <path
                                d="M2 6l3 3 5-5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </span>
                    <div>
                        <p className="text-sm font-medium text-[#1a1a1a]">
                            Essential cookies{" "}
                            <span className="text-xs font-normal text-[#6b6355]">
                                (always on)
                            </span>
                        </p>
                        <p className="text-xs text-[#6b6355] mt-0.5">
                            Required for login, cart, and checkout. Cannot be disabled.
                        </p>
                    </div>
                </div>

                {/* Analytics toggle */}
                <CheckboxRow
                    id="consent-analytics"
                    checked={draftAnalytics}
                    onChange={onChangeAnalytics}
                    label="Analytics"
                    description="Anonymised page-view counts to help us improve the site. No personal data is collected."
                />

                {/* Error tracking toggle */}
                <CheckboxRow
                    id="consent-error-tracking"
                    checked={draftErrorTracking}
                    onChange={onChangeErrorTracking}
                    label="Error monitoring"
                    description="Helps us detect and fix problems quickly. All text and inputs are masked before any data is sent."
                />
            </fieldset>

            <div className="flex items-center gap-3">
                <button
                    ref={defaultFocusRef}
                    onClick={onSave}
                    className="min-h-[44px] min-w-[44px] px-5 py-2.5 rounded-full text-sm font-semibold bg-[#b45309] text-white hover:bg-[#92400e] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b45309]"
                >
                    Save preferences
                </button>
                <button
                    onClick={onBack}
                    className="min-h-[44px] min-w-[44px] px-4 py-2.5 text-sm font-medium text-[#6b6355] hover:text-[#1a1a1a] underline underline-offset-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b45309] rounded-sm"
                >
                    Back
                </button>
            </div>
        </>
    );
}

// ---------------------------------------------------------------------------
// Checkbox row sub-component
// ---------------------------------------------------------------------------

type CheckboxRowProps = {
    id: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
    description: string;
};

function CheckboxRow({ id, checked, onChange, label, description }: CheckboxRowProps) {
    return (
        <label
            htmlFor={id}
            className="flex items-start gap-3 p-3 rounded-xl bg-[#faf7f2] border border-[#e8dfd0] cursor-pointer hover:border-[#b45309] transition-colors group"
        >
            {/* Custom checkbox visual */}
            <span
                className={`mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    checked
                        ? "border-[#b45309] bg-[#b45309]"
                        : "border-[#c4b89a] bg-white group-hover:border-[#b45309]"
                }`}
                aria-hidden="true"
            >
                {checked && (
                    <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 12 12"
                        aria-hidden="true"
                    >
                        <path
                            d="M2 6l3 3 5-5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                )}
            </span>
            <input
                id={id}
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
            />
            <div>
                <p className="text-sm font-medium text-[#1a1a1a]">{label}</p>
                <p className="text-xs text-[#6b6355] mt-0.5">{description}</p>
            </div>
        </label>
    );
}
