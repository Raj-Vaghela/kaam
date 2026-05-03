import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/data/mockData";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://gajjuexpress.co.uk";
    const now = new Date();

    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: APP_URL,
            lastModified: now,
            changeFrequency: "daily",
            priority: 1.0,
        },
        {
            url: `${APP_URL}/products`,
            lastModified: now,
            changeFrequency: "daily",
            priority: 0.9,
        },
        {
            url: `${APP_URL}/privacy`,
            lastModified: new Date("2026-04-13"),
            changeFrequency: "yearly",
            priority: 0.3,
        },
        {
            url: `${APP_URL}/terms`,
            lastModified: new Date("2026-04-13"),
            changeFrequency: "yearly",
            priority: 0.3,
        },
    ];

    const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.filter(
        (c) => c !== "All"
    ).map((category) => ({
        url: `${APP_URL}/products?category=${encodeURIComponent(category)}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
    }));

    let productRoutes: MetadataRoute.Sitemap = [];
    try {
        const supabase = await createClient();
        const { data: products } = await supabase
            .from("products")
            .select("id");
        if (products) {
            productRoutes = products.map(({ id }) => ({
                url: `${APP_URL}/products/${id}`,
                lastModified: now,
                changeFrequency: "weekly" as const,
                priority: 0.8,
            }));
        }
    } catch {
        // Sitemap generation must not fail hard — return without product URLs
    }

    return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
