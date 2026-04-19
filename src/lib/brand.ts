// GajjuExpress brand constants. Single source of truth for all
// user-facing brand strings, contact info, and tagline copy.

export const BRAND = {
    name: "GajjuExpress",
    nameShort: "Gajju",
    legalName: "GajjuExpress Ltd",
    tagline: "Ghar jaisi cheezein, ek click pe.",
    taglineEn: "Home-grown flavours. One click away.",
    description:
        "Authentic Indian and Gujarati groceries, snacks, and pantry staples — sourced with care, delivered to your door.",
    foundedYear: 2010,
    contact: {
        email: "hello@gajjuexpress.co.uk",
        ordersEmail: "orders@gajjuexpress.co.uk",
        phone: "+44 20 7946 0123",
        whatsapp: "+44 7946 000 123",
    },
    address: {
        line1: "47 Wembley High Road",
        line2: "Unit B",
        city: "London",
        postcode: "HA9 7QU",
        country: "United Kingdom",
    },
    social: {
        instagram: "https://instagram.com/gajjuexpress",
        facebook: "https://facebook.com/gajjuexpress",
        whatsapp: "https://wa.me/447946000123",
    },
    logo: {
        horizontal: "/gajjuexpress-logo-h.png",
        stacked: "/gajjuexpress-logo-v.png",
        horizontalWhite: "/gajjuexpress-logo-h-white.png",
        stackedWhite: "/gajjuexpress-logo-v-white.png",
    },
} as const;
