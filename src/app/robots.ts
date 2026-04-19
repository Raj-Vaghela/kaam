import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://gajjuexpress.co.uk";

    return {
        rules: [
            {
                userAgent: "*",
                allow: ["/", "/products", "/privacy", "/terms"],
                disallow: [
                    "/admin/",
                    "/account/",
                    "/checkout/",
                    "/auth/",
                    "/api/",
                    "/orders/",
                ],
            },
        ],
        sitemap: `${APP_URL}/sitemap.xml`,
    };
}
