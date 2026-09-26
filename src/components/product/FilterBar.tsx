"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SlidersHorizontal, ArrowUpDown, ChevronDown, X, Check } from "lucide-react";

export interface FilterLink {
    label: string;
    href: string;
    active: boolean;
}

export interface FilterGroup {
    title: string;
    links: FilterLink[];
}

interface Props {
    filterGroups: FilterGroup[];
    sortLinks: FilterLink[];
    activeSortLabel: string;
    activeFilterCount: number;
    clearHref: string;
    totalCount: number | null;
}

/**
 * Sort and filter as dropdown popovers.
 *
 * Options are plain links, so every filter combination stays a shareable,
 * bookmarkable URL and the server does the actual filtering.
 *
 * Panels are conditionally rendered rather than hidden with CSS, so the links
 * are absent from the initial HTML. That is intentional: sort permutations are
 * duplicate content and not worth crawling. Category pages remain discoverable
 * through the header nav.
 */
export default function FilterBar({
    filterGroups,
    sortLinks,
    activeSortLabel,
    activeFilterCount,
    clearHref,
    totalCount,
}: Props) {
    const [open, setOpen] = useState<"sort" | "filters" | null>(null);
    const wrapRef = useRef<HTMLDivElement>(null);

    // Dismiss on outside click and Escape, so the popover never traps the user.
    useEffect(() => {
        if (!open) return;

        const onPointerDown = (e: MouseEvent | TouchEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setOpen(null);
            }
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(null);
        };

        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("touchstart", onPointerDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("touchstart", onPointerDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    const trigger = (
        id: "sort" | "filters",
        icon: React.ReactNode,
        label: string,
        badge?: number
    ) => {
        const isOpen = open === id;
        return (
            <button
                type="button"
                onClick={() => setOpen(isOpen ? null : id)}
                aria-expanded={isOpen}
                aria-haspopup="true"
                className={`inline-flex items-center gap-2 pl-4 pr-3 py-2.5 rounded-2xl border text-sm font-semibold transition-colors ${
                    isOpen || badge
                        ? "bg-white border-ink-mute text-ink shadow-[var(--shadow-soft)]"
                        : "bg-cream-soft border-cream-deep text-ink-soft hover:border-ink-mute"
                }`}
            >
                {icon}
                {label}
                {badge ? (
                    <span className="w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
                        {badge}
                    </span>
                ) : null}
                <ChevronDown
                    size={15}
                    className={`text-ink-mute transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
            </button>
        );
    };

    const panel = (children: React.ReactNode, width: string) => (
        <div
            className={`absolute left-0 top-full mt-2 z-40 ${width} bg-white border border-cream-deep rounded-3xl shadow-[var(--shadow-lift)] overflow-hidden animate-fade-in`}
        >
            {children}
        </div>
    );

    const optionRow = (link: FilterLink) => (
        <Link
            key={link.href + link.label}
            href={link.href}
            scroll={false}
            onClick={() => setOpen(null)}
            aria-current={link.active ? "true" : undefined}
            className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                link.active
                    ? "bg-brand-soft text-[var(--gajju-teal-deep)] font-semibold"
                    : "text-ink-soft hover:bg-cream-soft hover:text-ink"
            }`}
        >
            <span className="truncate">{link.label}</span>
            {link.active && <Check size={14} className="shrink-0" />}
        </Link>
    );

    return (
        <div
            ref={wrapRef}
            className="mb-8 flex flex-wrap items-center gap-3 pb-5 border-b border-cream-deep"
        >
            {/* Sort */}
            <div className="relative">
                {trigger("sort", <ArrowUpDown size={15} />, activeSortLabel)}
                {open === "sort" &&
                    panel(
                        <div className="p-2">{sortLinks.map(optionRow)}</div>,
                        "w-60"
                    )}
            </div>

            {/* Filters */}
            <div className="relative">
                {trigger(
                    "filters",
                    <SlidersHorizontal size={15} />,
                    "Filters",
                    activeFilterCount || undefined
                )}
                {open === "filters" &&
                    panel(
                        <>
                            <div className="flex items-center justify-between px-4 pt-4 pb-1">
                                <p className="font-display text-lg text-ink">
                                    {activeFilterCount
                                        ? `${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""} applied`
                                        : "No filters applied"}
                                </p>
                                {activeFilterCount > 0 && (
                                    <Link
                                        href={clearHref}
                                        scroll={false}
                                        onClick={() => setOpen(null)}
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline shrink-0"
                                    >
                                        <X size={12} /> Clear
                                    </Link>
                                )}
                            </div>
                            <p className="px-4 pb-3 text-xs text-ink-mute">
                                Narrow the shelves down to what you need.
                            </p>
                            <div className="bandhani-divider opacity-50" aria-hidden />
                            <div className="p-2 max-h-[22rem] overflow-y-auto">
                                {filterGroups.map((group, i) => (
                                    <div key={group.title} className={i > 0 ? "mt-3" : ""}>
                                        <p className="px-3 pt-2 pb-1.5 text-[11px] font-bold uppercase tracking-[.09em] text-ink-mute">
                                            {group.title}
                                        </p>
                                        {group.links.map(optionRow)}
                                    </div>
                                ))}
                            </div>
                        </>,
                        "w-72"
                    )}
            </div>

            {totalCount != null && (
                <span className="ml-auto text-xs text-ink-mute">
                    {totalCount} {totalCount === 1 ? "product" : "products"}
                </span>
            )}
        </div>
    );
}
