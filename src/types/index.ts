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
