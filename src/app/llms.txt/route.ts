import { BRAND } from "@/lib/brand";

// /llms.txt — a concise, AI-readable summary of the site (see llmstxt.org).
// Helps ChatGPT, Claude, Gemini, Perplexity, etc. understand what GajjuExpress
// is and which pages matter. Stays minimal while the site is behind the gate.

export const dynamic = "force-dynamic";

export async function GET() {
    const APP_URL =
        process.env.NEXT_PUBLIC_APP_URL || "https://gajjuexpress.co.uk";

    if (process.env.SITE_PASSWORD) {
        return new Response("# GajjuExpress\n\n> Launching soon.\n", {
            headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
    }

    const body = `# ${BRAND.name}

> ${BRAND.description}

${BRAND.legalName} is a UK-based online Indian and Gujarati grocery store, delivering authentic groceries, snacks, spices, and pantry staples across the United Kingdom.

## Main pages
- [Shop all products](${APP_URL}/products): Full catalogue of Indian & Gujarati groceries
- [About](${APP_URL}/about): About ${BRAND.name}
- [Delivery](${APP_URL}/delivery): Delivery options and timescales (UK-wide)
- [FAQ](${APP_URL}/faq): Frequently asked questions
- [Returns](${APP_URL}/returns): Returns and refunds policy

## Categories
- Grains & Rice
- Flour & Atta
- Spices
- Snacks
- Beverages
- Dairy & Pantry
- Personal Care

## Contact
- Email: ${BRAND.contact.email}
- Orders: ${BRAND.contact.ordersEmail}

## Policies
- [Privacy policy](${APP_URL}/privacy)
- [Terms & conditions](${APP_URL}/terms)
`;

    return new Response(body, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
}
