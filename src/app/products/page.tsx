import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/product/ProductCard";
import { toProduct } from "@/types";
import { BRAND } from "@/lib/brand";
import Link from "next/link";
import { CATEGORIES } from "@/data/mockData";
import FilterSidebar, { type FilterGroup } from "@/components/product/FilterSidebar";

export const revalidate = 60; // revalidate product listings every 60 seconds

const PAGE_SIZE = 12;

// Sort options are a closed set. The `?sort=` value is only ever used as a key
// into this map — column names are never taken from user input.
const SORT_OPTIONS = {
    featured: {
        label: "Featured",
        order: [
            { column: "bestseller", ascending: false },
            { column: "name", ascending: true },
        ],
    },
    "price-asc": {
        label: "Price: low to high",
        order: [{ column: "price", ascending: true }],
    },
    "price-desc": {
        label: "Price: high to low",
        order: [{ column: "price", ascending: false }],
    },
    rating: {
        label: "Top rated",
        order: [{ column: "rating", ascending: false }],
    },
    name: {
        label: "A–Z",
        order: [{ column: "name", ascending: true }],
    },
} as const;

type SortKey = keyof typeof SORT_OPTIONS;

// Price bands, also a closed set — bounds are never read from the query string.
const PRICE_BANDS = {
    "under-5": { label: "Under £5", min: undefined, max: 5 },
    "5-10": { label: "£5 – £10", min: 5, max: 10 },
    "over-10": { label: "Over £10", min: 10, max: undefined },
} as const;

type PriceKey = keyof typeof PRICE_BANDS;

interface Props {
    searchParams: Promise<{
        category?: string;
        search?: string;
        page?: string;
        sort?: string;
        stock?: string;
        price?: string;
    }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
    const { category, search } = await searchParams;
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://gajjuexpress.co.uk";

    if (search) {
        const title = `Results for "${search}" — ${BRAND.name}`;
        const description = `Search results for "${search}" at ${BRAND.name}. Authentic Indian groceries delivered across the UK.`;
        return {
            title,
            description,
            alternates: { canonical: `${APP_URL}/products?search=${encodeURIComponent(search)}` },
            openGraph: { title, description, url: `${APP_URL}/products?search=${encodeURIComponent(search)}` },
        };
    }

    if (category) {
        const title = `${category} — Authentic Indian Groceries`;
        const description = `Shop authentic ${category.toLowerCase()} at ${BRAND.name}. Hand-picked Indian and Gujarati brands, delivered to your door across the UK.`;
        return {
            title,
            description,
            alternates: { canonical: `${APP_URL}/products?category=${encodeURIComponent(category)}` },
            openGraph: { title, description, url: `${APP_URL}/products?category=${encodeURIComponent(category)}` },
        };
    }

    const title = "Indian Groceries & Pantry Staples";
    const description = `Shop ${BRAND.name}'s full range of authentic Indian groceries — spices, flours, snacks, dairy and more. Next-day delivery across the UK.`;
    return {
        title,
        description,
        alternates: { canonical: `${APP_URL}/products` },
        openGraph: { title, description, url: `${APP_URL}/products` },
    };
}

export default async function ProductsPage({ searchParams }: Props) {
    const { category, search, page: pageParam, sort, stock, price } = await searchParams;
    const supabase = await createClient();

    const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
    const offset = (page - 1) * PAGE_SIZE;

    // Sanitise search term
    const sanitisedSearch = search
        ? decodeURIComponent(search).trim().slice(0, 100).replace(/[%_]/g, "")
        : undefined;

    // Sort is resolved against a fixed whitelist — the incoming value is never
    // passed to .order(), so a crafted ?sort= can't reach the query builder.
    const activeSort = sort && sort in SORT_OPTIONS ? (sort as SortKey) : "featured";
    const inStockOnly = stock === "in";
    const activePrice = price && price in PRICE_BANDS ? (price as PriceKey) : undefined;
    const band = activePrice ? PRICE_BANDS[activePrice] : undefined;

    // The search filter is shared so the two queries can't drift apart.
    const searchFilter = sanitisedSearch
        ? `name.ilike.%${sanitisedSearch}%,category.ilike.%${sanitisedSearch}%`
        : undefined;

    // NOTE: the data and count queries must apply the SAME filters. If they
    // diverge, the pagination total stops matching the rows returned and users
    // land on empty pages.
    let dataQuery = supabase
        .from("products")
        .select("id, name, category, price, image_url, unit, weight_kg, rating, bestseller, club_price, stock");
    if (category) dataQuery = dataQuery.eq("category", category);
    if (searchFilter) dataQuery = dataQuery.or(searchFilter);
    if (inStockOnly) dataQuery = dataQuery.gt("stock", 0);
    if (band?.min !== undefined) dataQuery = dataQuery.gte("price", band.min);
    if (band?.max !== undefined) dataQuery = dataQuery.lt("price", band.max);

    for (const { column, ascending } of SORT_OPTIONS[activeSort].order) {
        dataQuery = dataQuery.order(column, { ascending, nullsFirst: false });
    }
    dataQuery = dataQuery.range(offset, offset + PAGE_SIZE - 1);

    let countQuery = supabase.from("products").select("*", { count: "exact", head: true });
    if (category) countQuery = countQuery.eq("category", category);
    if (searchFilter) countQuery = countQuery.or(searchFilter);
    if (inStockOnly) countQuery = countQuery.gt("stock", 0);
    if (band?.min !== undefined) countQuery = countQuery.gte("price", band.min);
    if (band?.max !== undefined) countQuery = countQuery.lt("price", band.max);

    const [{ data: products }, { count: totalCount }] = await Promise.all([dataQuery, countQuery]);

    const totalPages = totalCount ? Math.ceil(totalCount / PAGE_SIZE) : 1;

    // Shared URL builder so sort/filter/pagination never drop each other's state.
    function buildHref(
        overrides: Partial<{
            page: number;
            sort: string;
            stock: string | null;
            price: string | null;
            category: string | null;
        }>
    ): string {
        const params = new URLSearchParams();

        const nextCategory =
            overrides.category !== undefined ? overrides.category : category ?? null;
        if (nextCategory) params.set("category", nextCategory);

        if (search) params.set("search", search);

        const nextSort = overrides.sort ?? (activeSort !== "featured" ? activeSort : undefined);
        if (nextSort && nextSort !== "featured") params.set("sort", nextSort);

        const nextStock = overrides.stock !== undefined ? overrides.stock : inStockOnly ? "in" : null;
        if (nextStock) params.set("stock", nextStock);

        const nextPrice =
            overrides.price !== undefined ? overrides.price : activePrice ?? null;
        if (nextPrice) params.set("price", nextPrice);

        // Changing a filter must reset to page 1 — page 6 of the old result
        // set is usually empty under the new one.
        if (overrides.page && overrides.page > 1) params.set("page", String(overrides.page));

        const qs = params.toString();
        return qs ? `/products?${qs}` : "/products";
    }

    // Filter rail contents. Selecting an already-active option clears it, so
    // every row doubles as its own toggle.
    const filterGroups: FilterGroup[] = [
        {
            title: "Category",
            links: [
                { label: "All products", href: buildHref({ category: null }), active: !category },
                ...CATEGORIES.filter((c) => c !== "All").map((c) => ({
                    label: c,
                    href: buildHref({ category: category === c ? null : c }),
                    active: category === c,
                })),
            ],
        },
        {
            title: "Price",
            links: (Object.keys(PRICE_BANDS) as PriceKey[]).map((key) => ({
                label: PRICE_BANDS[key].label,
                href: buildHref({ price: activePrice === key ? null : key }),
                active: activePrice === key,
            })),
        },
        {
            title: "Availability",
            links: [
                {
                    label: "In stock only",
                    href: buildHref({ stock: inStockOnly ? null : "in" }),
                    active: inStockOnly,
                },
            ],
        },
    ];

    const activeFilterCount =
        (category ? 1 : 0) + (activePrice ? 1 : 0) + (inStockOnly ? 1 : 0);

    const pageHref = (p: number) => buildHref({ page: p });

    // Build page numbers to show (always show first, last, current ±1)
    function getPageNumbers(): (number | "ellipsis")[] {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const pages: (number | "ellipsis")[] = [1];
        if (page > 3) pages.push("ellipsis");
        for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) pages.push(p);
        if (page < totalPages - 2) pages.push("ellipsis");
        pages.push(totalPages);
        return pages;
    }

    const pageNumbers = getPageNumbers();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="mb-12 max-w-3xl">
                <p className="text-xs font-semibold tracking-widest uppercase text-accent mb-3">
                    {sanitisedSearch ? "Search results" : category ? category : "The pantry"}
                </p>
                <h1 className="font-display text-5xl sm:text-6xl text-ink mb-4 leading-[1]">
                    {sanitisedSearch
                        ? `Results for "${sanitisedSearch}"`
                        : category
                        ? `${category} collection.`
                        : "Every aisle of an Indian kitchen."}
                </h1>
                <p className="text-lg text-ink-mute leading-relaxed">
                    {sanitisedSearch
                        ? `Showing products matching your search across our range.`
                        : "Browse our hand-picked collection of authentic groceries, spices, snacks and more — sourced with care, delivered tomorrow."}
                </p>
            </div>

            <div className="flex items-start gap-0">
                <FilterSidebar
                    groups={filterGroups}
                    activeCount={activeFilterCount}
                    clearHref={buildHref({ category: null, price: null, stock: null })}
                />

                <div className="flex-1 min-w-0">
                    {/* Sort bar. Links rather than a select so each sort order is
                        its own URL and the page needs no JS to change order. */}
                    <div className="mb-7 flex flex-wrap items-center gap-x-5 gap-y-3 pb-4 border-b border-cream-deep">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute mr-1">
                                Sort
                            </span>
                            {(Object.keys(SORT_OPTIONS) as SortKey[]).map((key) => {
                                const isActive = key === activeSort;
                                return (
                                    <Link
                                        key={key}
                                        href={buildHref({ sort: key })}
                                        scroll={false}
                                        aria-current={isActive ? "true" : undefined}
                                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                                            isActive
                                                ? "bg-[var(--gajju-teal-deep)] text-cream"
                                                : "bg-cream-soft border border-cream-deep text-ink-soft hover:border-ink-mute"
                                        }`}
                                    >
                                        {SORT_OPTIONS[key].label}
                                    </Link>
                                );
                            })}
                        </div>
                        {totalCount != null && (
                            <span className="ml-auto text-xs text-ink-mute">
                                {totalCount} {totalCount === 1 ? "product" : "products"}
                            </span>
                        )}
                    </div>

            {products && products.length > 0 ? (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
                        {products.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={toProduct(product)}
                            />
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <nav
                            aria-label="Product pagination"
                            className="mt-16 flex items-center justify-center gap-2 flex-wrap"
                        >
                            {page > 1 ? (
                                <Link
                                    href={pageHref(page - 1)}
                                    className="px-4 py-2 rounded-full border border-cream-deep text-sm font-medium text-ink hover:border-accent hover:text-accent transition-colors"
                                >
                                    ← Previous
                                </Link>
                            ) : (
                                <span className="px-4 py-2 rounded-full border border-cream-deep text-sm font-medium text-ink-mute opacity-40 cursor-not-allowed">
                                    ← Previous
                                </span>
                            )}

                            {pageNumbers.map((p, idx) =>
                                p === "ellipsis" ? (
                                    <span key={`ellipsis-${idx}`} className="px-2 text-ink-mute select-none">
                                        …
                                    </span>
                                ) : p === page ? (
                                    <span
                                        key={p}
                                        aria-current="page"
                                        className="w-10 h-10 flex items-center justify-center rounded-full bg-accent text-white text-sm font-semibold"
                                    >
                                        {p}
                                    </span>
                                ) : (
                                    <Link
                                        key={p}
                                        href={pageHref(p)}
                                        className="w-10 h-10 flex items-center justify-center rounded-full border border-cream-deep text-sm font-medium text-ink hover:border-accent hover:text-accent transition-colors"
                                    >
                                        {p}
                                    </Link>
                                )
                            )}

                            {page < totalPages ? (
                                <Link
                                    href={pageHref(page + 1)}
                                    className="px-4 py-2 rounded-full border border-cream-deep text-sm font-medium text-ink hover:border-accent hover:text-accent transition-colors"
                                >
                                    Next →
                                </Link>
                            ) : (
                                <span className="px-4 py-2 rounded-full border border-cream-deep text-sm font-medium text-ink-mute opacity-40 cursor-not-allowed">
                                    Next →
                                </span>
                            )}
                        </nav>
                    )}
                </>
            ) : (
                <div className="text-center py-24 text-ink-mute">
                    <p className="font-display text-2xl mb-2">
                        {sanitisedSearch
                            ? `No products found for "${sanitisedSearch}".`
                            : category
                            ? `No products found in "${category}".`
                            : "The shelves are being restocked."}
                    </p>
                    <p>
                        {sanitisedSearch
                            ? "Try a different search term or browse all products."
                            : "Check back soon."}
                    </p>
                    {sanitisedSearch && (
                        <Link
                            href="/products"
                            className="mt-6 inline-block px-6 py-2.5 rounded-full border border-cream-deep text-sm font-medium text-ink hover:border-accent hover:text-accent transition-colors"
                        >
                            Browse all products
                        </Link>
                    )}
                </div>
            )}
                </div>
            </div>
        </div>
    );
}
