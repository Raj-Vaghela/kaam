import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { renderHook, act } from "@testing-library/react";
import { CartProvider, useCart } from "@/context/CartContext";
import { Product } from "@/types";

// happy-dom ships with a non-functional localStorage stub when no storage file
// path is configured. Replace it with a real in-memory implementation so that
// CartContext's useEffect persistence logic works correctly during tests.
const createLocalStorageMock = () => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; },
        get length() { return Object.keys(store).length; },
        key: (index: number) => Object.keys(store)[index] ?? null,
    };
};

vi.stubGlobal("localStorage", createLocalStorageMock());

const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(CartProvider, null, children);

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
    id: "prod-1",
    name: "Test Product",
    category: "Grocery",
    imgUrl: "https://example.com/img.jpg",
    price: 10,
    unit: "kg",
    weight_kg: 1,
    rating: 4,
    bestseller: false,
    clubPrice: null,
    stock: 100,
    ...overrides,
});

beforeEach(() => {
    localStorage.clear();
});

describe("CartContext", () => {
    it("starts with an empty cart: cartTotal=0, cartCount=0", () => {
        const { result } = renderHook(() => useCart(), { wrapper });

        expect(result.current.cart).toHaveLength(0);
        expect(result.current.cartTotal).toBe(0);
        expect(result.current.cartCount).toBe(0);
    });

    it("addToCart sets cartTotal = price × qty and cartCount = qty", async () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        const product = makeProduct({ price: 5 });

        await act(async () => {
            result.current.addToCart(product, 3);
        });

        expect(result.current.cartTotal).toBe(15);
        expect(result.current.cartCount).toBe(3);
    });

    it("accumulates multiple different products correctly", async () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        const productA = makeProduct({ id: "prod-a", price: 4 });
        const productB = makeProduct({ id: "prod-b", price: 6 });

        await act(async () => {
            result.current.addToCart(productA, 2);
            result.current.addToCart(productB, 3);
        });

        expect(result.current.cartCount).toBe(5);
        expect(result.current.cartTotal).toBe(4 * 2 + 6 * 3);
        expect(result.current.cart).toHaveLength(2);
    });

    it("adding the same product twice increments qty on the existing item (no duplicate)", async () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        const product = makeProduct({ id: "prod-1", price: 10 });

        await act(async () => {
            result.current.addToCart(product, 1);
            result.current.addToCart(product, 2);
        });

        expect(result.current.cart).toHaveLength(1);
        expect(result.current.cart[0].qty).toBe(3);
        expect(result.current.cartCount).toBe(3);
        expect(result.current.cartTotal).toBe(30);
    });

    it("uses clubPrice over price when clubPrice is set", async () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        const product = makeProduct({ price: 20, clubPrice: 15 });

        await act(async () => {
            result.current.addToCart(product, 2);
        });

        expect(result.current.cart[0].price).toBe(15);
        expect(result.current.cartTotal).toBe(30);
    });

    it("removeFromCart removes the correct item by id", async () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        const productA = makeProduct({ id: "prod-a" });
        const productB = makeProduct({ id: "prod-b", price: 8 });

        await act(async () => {
            result.current.addToCart(productA, 1);
            result.current.addToCart(productB, 1);
        });

        expect(result.current.cart).toHaveLength(2);

        await act(async () => {
            result.current.removeFromCart("prod-a");
        });

        expect(result.current.cart).toHaveLength(1);
        expect(result.current.cart[0].id).toBe("prod-b");
    });

    it("updateQty changes the quantity of an item", async () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        const product = makeProduct({ id: "prod-1", price: 5 });

        await act(async () => {
            result.current.addToCart(product, 2);
        });

        await act(async () => {
            result.current.updateQty("prod-1", 5);
        });

        expect(result.current.cart[0].qty).toBe(5);
        expect(result.current.cartCount).toBe(5);
        expect(result.current.cartTotal).toBe(25);
    });

    it("updateQty with 0 removes the item from the cart", async () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        const product = makeProduct({ id: "prod-1" });

        await act(async () => {
            result.current.addToCart(product, 3);
        });

        expect(result.current.cart).toHaveLength(1);

        await act(async () => {
            result.current.updateQty("prod-1", 0);
        });

        expect(result.current.cart).toHaveLength(0);
        expect(result.current.cartCount).toBe(0);
        expect(result.current.cartTotal).toBe(0);
    });

    it("clearCart empties the cart completely", async () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        const productA = makeProduct({ id: "prod-a", price: 10 });
        const productB = makeProduct({ id: "prod-b", price: 20 });

        await act(async () => {
            result.current.addToCart(productA, 2);
            result.current.addToCart(productB, 1);
        });

        expect(result.current.cart).toHaveLength(2);

        await act(async () => {
            result.current.clearCart();
        });

        expect(result.current.cart).toHaveLength(0);
        expect(result.current.cartTotal).toBe(0);
        expect(result.current.cartCount).toBe(0);
    });
});
