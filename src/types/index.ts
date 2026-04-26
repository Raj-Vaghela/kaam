export interface Product {
    id: string;
    name: string;
    category: string;
    imgUrl: string;
    price: number;
    unit: string;
    weight_kg: number;
    rating: number;
    bestseller: boolean;
    clubPrice: number | null;
    stock: number;
}

export interface CartItem {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
    qty: number;
    unit: string;
}

export interface Category {
    name: string;
    image: string;
}

/**
 * Raw column shape returned by Supabase for the `products` table.
 * Keep in sync with the DB schema — or replace with `supabase gen types`.
 * Price and club_price are returned as strings by PostgREST for numeric columns.
 */
interface DbProductRow {
    id: string;
    name: string;
    category: string;
    price: string | number;
    image_url: string | null;
    unit: string;
    weight_kg: number | null;
    rating: number | null;
    bestseller: boolean | null;
    club_price: string | number | null;
    stock: number | null;
}

/** Maps a raw Supabase product row to the typed frontend Product shape. */
export function toProduct(row: DbProductRow): Product {
    return {
        id: row.id,
        name: row.name,
        category: row.category,
        price: Number(row.price),
        imgUrl: row.image_url || "https://placehold.co/400",
        unit: row.unit,
        weight_kg: row.weight_kg ?? 0,
        rating: row.rating || 0,
        bestseller: row.bestseller || false,
        clubPrice: row.club_price != null ? Number(row.club_price) : null,
        stock: row.stock ?? 0,
    };
}
