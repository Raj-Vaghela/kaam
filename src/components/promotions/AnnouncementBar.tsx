"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

interface Banner {
    id: string;
    message: string;
    link_url: string | null;
    bg_color: string;
}

export default function AnnouncementBar({ banner }: { banner: Banner | null }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!banner) return;
        const dismissed = sessionStorage.getItem(`bar_dismissed_${banner.id}`);
        if (!dismissed) setVisible(true);
    }, [banner]);

    if (!visible || !banner?.message) return null;

    const dismiss = () => {
        sessionStorage.setItem(`bar_dismissed_${banner.id}`, "1");
        setVisible(false);
    };

    const content = (
        <span className="text-sm font-semibold text-white text-center px-8">
            {banner.message}
        </span>
    );

    return (
        <div
            className="relative flex items-center justify-center px-4 py-2.5 min-h-[44px]"
            style={{ backgroundColor: banner.bg_color }}
        >
            {banner.link_url ? (
                <Link href={banner.link_url} className="hover:opacity-90 transition-opacity">
                    {content}
                </Link>
            ) : (
                content
            )}
            <button
                onClick={dismiss}
                aria-label="Dismiss"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
            >
                <X size={16} />
            </button>
        </div>
    );
}
