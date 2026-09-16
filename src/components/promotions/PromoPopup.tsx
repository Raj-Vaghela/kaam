"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";

interface Banner {
    id: string;
    image_url: string;
    link_url: string | null;
}

export default function PromoPopup({ banner }: { banner: Banner | null }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!banner?.image_url) return;
        const dismissed = sessionStorage.getItem(`popup_dismissed_${banner.id}`);
        if (dismissed) return;
        const t = setTimeout(() => setVisible(true), 2000);
        return () => clearTimeout(t);
    }, [banner]);

    if (!visible || !banner?.image_url) return null;

    const dismiss = () => {
        sessionStorage.setItem(`popup_dismissed_${banner.id}`, "1");
        setVisible(false);
    };

    const inner = (
        <div className="relative max-w-md w-full mx-4">
            <button
                onClick={dismiss}
                aria-label="Close"
                className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-ink text-cream flex items-center justify-center hover:bg-accent transition-colors shadow-lg"
            >
                <X size={16} />
            </button>
            <div className="rounded-3xl overflow-hidden shadow-[var(--shadow-lift)]">
                <Image
                    src={banner.image_url}
                    alt="Promotion"
                    width={600}
                    height={600}
                    className="w-full object-cover"
                />
            </div>
        </div>
    );

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/60 backdrop-blur-sm"
            onClick={dismiss}
        >
            <div onClick={(e) => e.stopPropagation()}>
                {banner.link_url ? (
                    <Link href={banner.link_url} onClick={dismiss}>
                        {inner}
                    </Link>
                ) : (
                    inner
                )}
            </div>
        </div>
    );
}
