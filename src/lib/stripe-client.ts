"use client";

import { loadStripe, type Stripe, type Appearance } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
    if (!stripePromise) {
        const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        if (!key) {
            throw new Error("Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable");
        }
        stripePromise = loadStripe(key);
    }
    return stripePromise;
}

// Branded Stripe Elements appearance — matches GajjuExpress design tokens.
export const stripeAppearance: Appearance = {
    theme: "stripe" as const,
    variables: {
        colorPrimary: "#c66b3d",
        colorBackground: "#faf6ec",
        colorText: "#1a1714",
        colorTextSecondary: "#4a423b",
        colorTextPlaceholder: "#8a8178",
        colorDanger: "#b94a4a",
        colorSuccess: "#6b8e4e",
        fontFamily: "Inter, system-ui, sans-serif",
        fontSizeBase: "15px",
        spacingUnit: "5px",
        borderRadius: "12px",
    },
    rules: {
        ".Input": {
            border: "1px solid #ebe3d2",
            boxShadow: "none",
            padding: "14px",
        },
        ".Input:focus": {
            border: "1.5px solid #c66b3d",
            boxShadow: "0 0 0 4px rgba(198, 107, 61, 0.12)",
        },
        ".Label": {
            fontWeight: "500",
            fontSize: "13px",
            color: "#4a423b",
            marginBottom: "6px",
        },
        ".Tab": {
            border: "1px solid #ebe3d2",
            padding: "12px",
            borderRadius: "12px",
        },
        ".Tab--selected": {
            borderColor: "#c66b3d",
            backgroundColor: "#f7e8de",
        },
    },
};
