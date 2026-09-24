"use client";

import { useState } from "react";
import Link from "next/link";
import { SlidersHorizontal, X, ChevronLeft } from "lucide-react";

export interface FilterLink {
    label: string;
    href: string;
    active: boolean;
    count?: number;
}

export interface FilterGroup {
    title: string;
    links: FilterLink[];
}

interface Props {
    groups: FilterGroup[];
    /** Number of filters currently applied — surfaced on the mobile trigger. */
    activeCount: number;
    /** Href that clears every filter but keeps the search term. */
    clearHref: string;
}

/**
 * Collapsible filter rail.
 *
 * Every link is rendered server-side and stays in the DOM regardless of
 * collapsed state — only visibility is toggled. Crawlers still see the full
 * set of filter URLs, and the page works with JavaScript disabled (the rail
 * is expanded by default on desktop; on mobile the drawer simply starts
 * closed and the grid is unaffected).
 */
export default function FilterSidebar({ groups, activeCount, clearHref }: Props) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    const rail = (
        <div className="space-y-7">
            {groups.map((group, i) => (
                <div key={group.title}>
                    <h3 className="text-[11px] font-bold uppercase tracking-[.09em] text-ink-mute mb-3">
                        {group.title}
                    </h3>
                    <ul className="space-y-0.5">
                        {group.links.map((link) => (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    scroll={false}
                                    onClick={() => setMobileOpen(false)}
                                    aria-current={link.active ? "true" : undefined}
                                    className={`flex items-center justify-between gap-2 py-1.5 px-2.5 -mx-2.5 rounded-lg text-sm transition-colors ${
                                        link.active
                                            ? "text-[var(--gajju-teal-deep)] font-semibold bg-brand-soft"
                                            : "text-ink-soft hover:text-accent hover:bg-cream-soft"
                                    }`}
                                >
                                    <span className="truncate">{link.label}</span>
                                    {link.count != null && (
                                        <span className="text-[11px] text-ink-mute shrink-0">
                                            {link.count}
                                        </span>
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                    {i < groups.length - 1 && (
                        <div className="bandhani-divider mt-6 opacity-40" aria-hidden />
                    )}
                </div>
            ))}

            {activeCount > 0 && (
                <Link
                    href={clearHref}
                    scroll={false}
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
                >
                    <X size={13} /> Clear all filters
                </Link>
            )}
        </div>
    );

    return (
        <>
            {/* Mobile trigger */}
            <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-cream-soft border border-cream-deep text-sm font-semibold text-ink-soft hover:border-ink-mute transition-colors"
            >
                <SlidersHorizontal size={15} />
                Filters
                {activeCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
                        {activeCount}
                    </span>
                )}
            </button>

            {/* Desktop rail */}
            <aside
                className={`hidden lg:block shrink-0 transition-all duration-300 ${
                    collapsed ? "w-0 overflow-hidden opacity-0" : "w-56 opacity-100"
                }`}
                aria-hidden={collapsed}
            >
                <div className="pr-6 border-r border-cream-deep">{rail}</div>
            </aside>

            {/* Desktop collapse handle — a slim tab against the rail edge so it
                reads as part of the shelf rather than a floating control. */}
            <button
                type="button"
                onClick={() => setCollapsed((v) => !v)}
                aria-expanded={!collapsed}
                aria-label={collapsed ? "Show filters" : "Hide filters"}
                className="hidden lg:flex shrink-0 self-start items-center gap-1 mt-0.5 mr-5 px-1.5 py-3 rounded-full bg-cream-soft border border-cream-deep text-ink-mute hover:text-accent hover:border-ink-mute transition-colors"
            >
                {collapsed ? (
                    <SlidersHorizontal size={14} />
                ) : (
                    <ChevronLeft size={14} />
                )}
            </button>

            {/* Mobile drawer */}
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    <div
                        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
                        onClick={() => setMobileOpen(false)}
                    />
                    <div className="relative ml-auto w-[82%] max-w-xs bg-cream h-full overflow-y-auto shadow-[var(--shadow-lift)] animate-in slide-in-from-right">
                        <div className="sticky top-0 bg-[var(--gajju-teal-deep)] text-cream px-5 py-4 flex items-center justify-between">
                            <span className="font-display text-xl">Filters</span>
                            <button
                                type="button"
                                onClick={() => setMobileOpen(false)}
                                aria-label="Close filters"
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="bandhani-divider" aria-hidden />
                        <div className="p-5">{rail}</div>
                    </div>
                </div>
            )}
        </>
    );
}
