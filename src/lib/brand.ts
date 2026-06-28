// GajjuExpress brand constants. Single source of truth for all
// user-facing brand strings, contact info, and tagline copy.
//
// Business-fact fields (company number, VAT, registered address, phone) are
// read from environment variables so they are never hardcoded. See env.ts for
// the full list of required/optional keys and production assertions.

import {
    COMPANY_NUMBER,
    VAT_NUMBER,
    VAT_REGISTERED,
    SUPPORT_PHONE,
    SUPPORT_WHATSAPP_URL,
    SUPPORT_WHATSAPP_DISPLAY,
    REGISTERED_ADDRESS_LINE1,
    REGISTERED_ADDRESS_LINE2,
    REGISTERED_ADDRESS_CITY,
    REGISTERED_ADDRESS_POSTCODE,
    REGISTERED_ADDRESS_COUNTRY,
} from "./env";

// TODO(launch): populate REGISTERED_ADDRESS_* env vars with the real registered
// office address as filed at Companies House before going live. The address
// below falls back to placeholder strings so the site renders in development;
// the production assertion in env.ts will prevent deployment without real values.

export const BRAND = {
    name: "GajjuExpress",
    nameShort: "Gajju",
    legalName: "GajjuExpress Ltd",
    tagline: "Ghar jaisi cheezein, ek click pe.",
    taglineEn: "Home-grown flavours. One click away.",
    description:
        "Authentic Indian and Gujarati groceries, snacks, and pantry staples — sourced with care, delivered to your door.",
    foundedYear: 2010,

    // ── Legal / compliance fields ──────────────────────────────────────────
    // TODO(launch): ensure Companies House registration is complete and
    // COMPANY_NUMBER env var is set before going live.
    companyNumber: COMPANY_NUMBER ?? "COMPANY_NUMBER_NOT_SET",

    // TODO(launch): set VAT_REGISTERED=true and VAT_NUMBER=GBxxxxxxxxx once
    // VAT-registered. Leave VAT_REGISTERED=false until then.
    vatRegistered: VAT_REGISTERED === "true",
    vatNumber: VAT_NUMBER,

    // ── Contact ────────────────────────────────────────────────────────────
    // Phone / WhatsApp are only rendered when the env vars are explicitly provided.
    // Do NOT add fallback numbers — only real, answered numbers should appear (the
    // 07946 range used previously is Ofcom-reserved for drama use and must never
    // ship to consumers).
    contact: {
        email: "info@gajjuexpress.co.uk",
        ordersEmail: "orders@gajjuexpress.co.uk",
        phone: SUPPORT_PHONE,
        whatsapp: SUPPORT_WHATSAPP_DISPLAY,
    },

    // ── Registered office address (Companies House / E-commerce Regs reg. 6) ──
    // Reads from env; falls back to clear placeholder strings in development.
    registeredAddress: {
        line1: REGISTERED_ADDRESS_LINE1 ?? "REGISTERED_ADDRESS_LINE1_NOT_SET",
        line2: REGISTERED_ADDRESS_LINE2,
        city: REGISTERED_ADDRESS_CITY ?? "REGISTERED_ADDRESS_CITY_NOT_SET",
        postcode: REGISTERED_ADDRESS_POSTCODE ?? "REGISTERED_ADDRESS_POSTCODE_NOT_SET",
        country: REGISTERED_ADDRESS_COUNTRY ?? "GB",
    },

    // ── Legacy address field — kept for backward compat with existing components
    // that reference BRAND.address. Points to registeredAddress data.
    // TODO(launch): migrate all BRAND.address usages to BRAND.registeredAddress
    // and remove this alias.
    address: {
        line1: REGISTERED_ADDRESS_LINE1 ?? "REGISTERED_ADDRESS_LINE1_NOT_SET",
        line2: REGISTERED_ADDRESS_LINE2,
        city: REGISTERED_ADDRESS_CITY ?? "REGISTERED_ADDRESS_CITY_NOT_SET",
        postcode: REGISTERED_ADDRESS_POSTCODE ?? "REGISTERED_ADDRESS_POSTCODE_NOT_SET",
        country: REGISTERED_ADDRESS_COUNTRY ?? "United Kingdom",
    },

    social: {
        instagram: "https://instagram.com/gajjuexpress",
        facebook: "https://facebook.com/gajjuexpress",
        whatsapp: SUPPORT_WHATSAPP_URL,
    },
    logo: {
        horizontal: "/gajjuexpress-logo-h.png",
        stacked: "/gajjuexpress-logo-v.png",
        horizontalWhite: "/gajjuexpress-logo-h-white.png",
        stackedWhite: "/gajjuexpress-logo-v-white.png",
    },
};
