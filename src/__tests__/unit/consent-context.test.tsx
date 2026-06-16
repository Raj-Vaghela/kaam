import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { renderHook, act } from "@testing-library/react";
import { ConsentProvider, useConsent } from "@/context/ConsentContext";

// ---------------------------------------------------------------------------
// localStorage mock (same pattern as cart.test.ts)
// ---------------------------------------------------------------------------

const createLocalStorageMock = () => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; },
        get length() { return Object.keys(store).length; },
        key: (index: number) => Object.keys(store)[index] ?? null,
    };
};

const localStorageMock = createLocalStorageMock();
Object.defineProperty(globalThis, "localStorage", {
    value: localStorageMock,
    writable: true,
});

// Minimal document.cookie stub
let cookieStore = "";
Object.defineProperty(globalThis.document, "cookie", {
    get: () => cookieStore,
    set: (v: string) => { cookieStore = v; },
    configurable: true,
});

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ConsentProvider>{children}</ConsentProvider>
);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ConsentContext", () => {
    beforeEach(() => {
        localStorageMock.clear();
        cookieStore = "";
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("starts with default state (no decision, both false)", async () => {
        const { result } = renderHook(() => useConsent(), { wrapper });

        // Wait for hydration effect
        await act(async () => {});

        expect(result.current.hasDecided).toBe(false);
        expect(result.current.consent.analytics).toBe(false);
        expect(result.current.consent.errorTracking).toBe(false);
        expect(result.current.isBannerOpen).toBe(true);
    });

    it("acceptAll sets both consent flags to true and closes banner", async () => {
        const { result } = renderHook(() => useConsent(), { wrapper });
        await act(async () => {});

        act(() => {
            result.current.acceptAll();
        });

        expect(result.current.consent.analytics).toBe(true);
        expect(result.current.consent.errorTracking).toBe(true);
        expect(result.current.hasDecided).toBe(true);
        expect(result.current.isBannerOpen).toBe(false);
    });

    it("rejectAll sets both consent flags to false and closes banner", async () => {
        const { result } = renderHook(() => useConsent(), { wrapper });
        await act(async () => {});

        // First accept so flags are true, then reject
        act(() => { result.current.acceptAll(); });
        act(() => { result.current.rejectAll(); });

        expect(result.current.consent.analytics).toBe(false);
        expect(result.current.consent.errorTracking).toBe(false);
        expect(result.current.hasDecided).toBe(true);
        expect(result.current.isBannerOpen).toBe(false);
    });

    it("persists consent decision to localStorage after acceptAll", async () => {
        const { result } = renderHook(() => useConsent(), { wrapper });
        await act(async () => {});

        act(() => { result.current.acceptAll(); });

        const raw = localStorageMock.getItem("gx_consent_v1");
        expect(raw).not.toBeNull();
        const parsed = JSON.parse(raw!);
        expect(parsed.hasDecided).toBe(true);
        expect(parsed.consent.analytics).toBe(true);
        expect(parsed.consent.errorTracking).toBe(true);
    });

    it("persists rejection to localStorage after rejectAll", async () => {
        const { result } = renderHook(() => useConsent(), { wrapper });
        await act(async () => {});

        act(() => { result.current.rejectAll(); });

        const raw = localStorageMock.getItem("gx_consent_v1");
        const parsed = JSON.parse(raw!);
        expect(parsed.hasDecided).toBe(true);
        expect(parsed.consent.analytics).toBe(false);
        expect(parsed.consent.errorTracking).toBe(false);
    });

    it("reopen() re-shows the banner after a decision has been made", async () => {
        const { result } = renderHook(() => useConsent(), { wrapper });
        await act(async () => {});

        act(() => { result.current.rejectAll(); });
        expect(result.current.isBannerOpen).toBe(false);

        act(() => { result.current.reopen(); });
        expect(result.current.isBannerOpen).toBe(true);
    });

    it("setConsent merges partial updates", async () => {
        const { result } = renderHook(() => useConsent(), { wrapper });
        await act(async () => {});

        act(() => { result.current.setConsent({ analytics: true }); });

        expect(result.current.consent.analytics).toBe(true);
        expect(result.current.consent.errorTracking).toBe(false);
        expect(result.current.hasDecided).toBe(true);
    });

    it("hydrates from localStorage on mount", async () => {
        // Pre-seed localStorage with a previous decision
        localStorageMock.setItem(
            "gx_consent_v1",
            JSON.stringify({
                consent: { analytics: true, errorTracking: false },
                hasDecided: true,
            })
        );

        const { result } = renderHook(() => useConsent(), { wrapper });
        await act(async () => {});

        expect(result.current.consent.analytics).toBe(true);
        expect(result.current.consent.errorTracking).toBe(false);
        expect(result.current.hasDecided).toBe(true);
        // Banner should NOT be open since hasDecided is true
        expect(result.current.isBannerOpen).toBe(false);
    });
});
