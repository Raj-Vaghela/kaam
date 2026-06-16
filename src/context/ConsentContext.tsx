"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
    ReactNode,
} from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Consent = { analytics: boolean; errorTracking: boolean };

export type ConsentState = {
    consent: Consent;
    hasDecided: boolean;
    isBannerOpen: boolean;
    setConsent: (c: Partial<Consent>) => void;
    acceptAll: () => void;
    rejectAll: () => void;
    reopen: () => void;
    closeBanner: () => void;
};

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = "gx_consent_v1";

const DEFAULT_CONSENT: Consent = { analytics: false, errorTracking: false };

type PersistedPayload = { consent: Consent; hasDecided: boolean };

function buildCookieValue(payload: PersistedPayload): string {
    return JSON.stringify(payload);
}

function setCookieAndStorage(payload: PersistedPayload): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
        // localStorage unavailable — continue
    }

    try {
        const value = encodeURIComponent(buildCookieValue(payload));
        const maxAge = 60 * 60 * 24 * 365; // 12 months
        const secure =
            typeof window !== "undefined" &&
            window.location.protocol === "https:"
                ? "; Secure"
                : "";
        document.cookie = `${STORAGE_KEY}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
    } catch {
        // cookies unavailable — continue
    }
}

function readPersistedPayload(): PersistedPayload | null {
    // Prefer localStorage for read (always available client-side)
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as PersistedPayload;
            if (
                parsed &&
                typeof parsed.hasDecided === "boolean" &&
                parsed.consent &&
                typeof parsed.consent.analytics === "boolean" &&
                typeof parsed.consent.errorTracking === "boolean"
            ) {
                return parsed;
            }
        }
    } catch {
        // ignore
    }
    return null;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ConsentContext = createContext<ConsentState | undefined>(undefined);

export function ConsentProvider({ children }: { children: ReactNode }) {
    const [consent, setConsentState] = useState<Consent>(DEFAULT_CONSENT);
    const [hasDecided, setHasDecided] = useState(false);
    // Banner is hidden until hydration resolves to avoid flash
    const [isBannerOpen, setIsBannerOpen] = useState(false);
    const [hydrated, setHydrated] = useState(false);

    // Hydrate from storage on mount (client only)
    useEffect(() => {
        const persisted = readPersistedPayload();
        if (persisted) {
            setConsentState(persisted.consent);
            setHasDecided(persisted.hasDecided);
            setIsBannerOpen(!persisted.hasDecided);
        } else {
            // No prior decision — show banner
            setIsBannerOpen(true);
        }
        setHydrated(true);
    }, []);

    const persistAndApply = useCallback(
        (newConsent: Consent, decided: boolean) => {
            setConsentState((prev) => {
                // If error tracking was previously on and is now off, signal
                // Sentry to shut down for this session. A page reload is needed
                // to re-enable (intentional — prevents partial SDK state).
                if (
                    prev.errorTracking === true &&
                    newConsent.errorTracking === false &&
                    typeof window !== "undefined"
                ) {
                    window.dispatchEvent(
                        new CustomEvent("gx:consent:revoke-error-tracking")
                    );
                }
                return newConsent;
            });
            setHasDecided(decided);
            const payload: PersistedPayload = {
                consent: newConsent,
                hasDecided: decided,
            };
            setCookieAndStorage(payload);
        },
        []
    );

    const setConsent = useCallback(
        (partial: Partial<Consent>) => {
            const merged: Consent = { ...consent, ...partial };
            persistAndApply(merged, true);
            setIsBannerOpen(false);
        },
        [consent, persistAndApply]
    );

    const acceptAll = useCallback(() => {
        persistAndApply({ analytics: true, errorTracking: true }, true);
        setIsBannerOpen(false);
    }, [persistAndApply]);

    const rejectAll = useCallback(() => {
        persistAndApply({ analytics: false, errorTracking: false }, true);
        setIsBannerOpen(false);
    }, [persistAndApply]);

    const reopen = useCallback(() => {
        setIsBannerOpen(true);
    }, []);

    const closeBanner = useCallback(() => {
        setIsBannerOpen(false);
    }, []);

    const value = useMemo<ConsentState>(
        () => ({
            consent,
            hasDecided,
            isBannerOpen: hydrated && isBannerOpen,
            setConsent,
            acceptAll,
            rejectAll,
            reopen,
            closeBanner,
        }),
        [
            consent,
            hasDecided,
            hydrated,
            isBannerOpen,
            setConsent,
            acceptAll,
            rejectAll,
            reopen,
            closeBanner,
        ]
    );

    return (
        <ConsentContext.Provider value={value}>
            {children}
        </ConsentContext.Provider>
    );
}

export function useConsent(): ConsentState {
    const ctx = useContext(ConsentContext);
    if (!ctx) {
        throw new Error("useConsent must be used inside <ConsentProvider>");
    }
    return ctx;
}
