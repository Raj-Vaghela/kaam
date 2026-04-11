import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

interface LogoProps {
    variant?: "horizontal" | "stacked" | "mark";
    size?: "sm" | "md" | "lg";
    href?: string | null;
    className?: string;
}

const sizeMap = {
    horizontal: { sm: { w: 140, h: 36 }, md: { w: 180, h: 46 }, lg: { w: 220, h: 56 } },
    stacked: { sm: { w: 88, h: 88 }, md: { w: 120, h: 120 }, lg: { w: 160, h: 160 } },
    mark: { sm: { w: 36, h: 36 }, md: { w: 44, h: 44 }, lg: { w: 56, h: 56 } },
};

export default function Logo({
    variant = "horizontal",
    size = "md",
    href = "/",
    className = "",
}: LogoProps) {
    const dims = sizeMap[variant][size];
    const src =
        variant === "stacked" || variant === "mark"
            ? BRAND.logo.stacked
            : BRAND.logo.horizontal;

    const img = (
        <Image
            src={src}
            alt={`${BRAND.name} logo`}
            width={dims.w}
            height={dims.h}
            priority
            className={`object-contain ${className}`}
        />
    );

    if (href === null) return img;
    return (
        <Link href={href} className="inline-flex items-center" aria-label={`${BRAND.name} home`}>
            {img}
        </Link>
    );
}
