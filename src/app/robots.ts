import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://gajjuexpress.co.uk";

    if (process.env.SITE_PASSWORD) {
        return {
            rules: [{ userAgent: "*", disallow: ["/"] }],
        };
    }

    // Public, non-sensitive paths that every crawler (search + AI) may index.
    const disallow = [
        "/admin/",
        "/account/",
        "/checkout/",
        "/auth/",
        "/api/",
        "/orders/",
    ];

    // AI / LLM crawlers — explicitly welcomed so the brand and catalogue can
    // surface in ChatGPT, Claude, Gemini, Perplexity, etc. (same access as
    // search engines; admin/account/checkout paths stay private).
    const aiBots = [
        "GPTBot",            // OpenAI training
        "OAI-SearchBot",     // ChatGPT search
        "ChatGPT-User",      // ChatGPT browsing
        "ClaudeBot",         // Anthropic training
        "Claude-Web",        // Claude browsing
        "anthropic-ai",      // Anthropic
        "Google-Extended",   // Gemini / Vertex
        "PerplexityBot",     // Perplexity
        "Applebot-Extended", // Apple Intelligence
        "Amazonbot",
        "Bytespider",
    ];

    return {
        rules: [
            {
                userAgent: "*",
                allow: ["/", "/products", "/privacy", "/terms"],
                disallow,
            },
            ...aiBots.map((userAgent) => ({ userAgent, allow: ["/"], disallow })),
        ],
        sitemap: `${APP_URL}/sitemap.xml`,
        host: APP_URL,
    };
}
