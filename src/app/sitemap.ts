import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/data/mockData";

export default function sitemap(): MetadataRoute.Sitemap {
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

    return [...staticRoutes, ...categoryRoutes];
}
