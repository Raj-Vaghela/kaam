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

// Maps a raw Supabase product row to the frontend Product shape.
export function toProduct(row: any): Product {
    return {
        id: row.id,
        name: row.name,
        category: row.category,
        price: Number(row.price),
        imgUrl: row.image_url || "https://placehold.co/400",
        unit: row.unit,
        weight_kg: 0,
        rating: row.rating || 0,
        bestseller: row.bestseller || false,
        clubPrice: row.club_price != null ? Number(row.club_price) : null,
    };
}
