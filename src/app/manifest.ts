import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

// Web app manifest — enables "Add to Home Screen" / installability, a proper
// app name + theme on mobile, and contributes to mobile SEO signals.
export default function manifest(): MetadataRoute.Manifest {
    return {
        name: `${BRAND.name} — ${BRAND.taglineEn}`,
        short_name: BRAND.name,
        description: BRAND.description,
        start_url: "/",
        display: "standalone",
        background_color: "#f5f0e6",
        theme_color: "#134048",
        lang: "en-GB",
        categories: ["shopping", "food"],
        icons: [
            { src: "/icon", sizes: "any", type: "image/png" },
            { src: "/apple-icon", sizes: "180x180", type: "image/png" },
        ],
    };
}
