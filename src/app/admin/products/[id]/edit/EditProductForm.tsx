"use client";

import { useState } from "react";
import { ArrowLeft, Upload, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateProduct } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

const CATEGORIES = [
    "Grains & Rice",
    "Spices",
    "Snacks",
    "Beverages",
    "Flour & Atta",
    "Dairy & Pantry",
    "Personal Care",
];

interface ProductRow {
    id: string;
    name: string;
    category: string | null;
    price: number;
    image_url: string | null;
    unit: string | null;
    stock: number | null;
    bestseller: boolean | null;
}

export default function EditProductForm({ product }: { product: ProductRow }) {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [imageUrl, setImageUrl] = useState(product.image_url || "");
    const router = useRouter();

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!ALLOWED_TYPES.includes(file.type)) {
            alert("Only PNG, JPEG, and WebP images are allowed.");
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            alert("File size must be under 10MB.");
            return;
        }
        setUploading(true);
        try {
            const supabase = createClient();
            const fileExt = file.name.split(".").pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from("products").upload(fileName, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from("products").getPublicUrl(fileName);
            setImageUrl(publicUrl);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Upload failed";
            alert("Error uploading image: " + msg);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData(e.currentTarget);
            if (imageUrl) formData.set("image_url", imageUrl);
            const result = await updateProduct(product.id, formData);
            if (!result.success) {
                alert("Error updating product: " + result.message);
            } else {
                router.push("/admin/products");
                router.refresh();
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Update failed";
            alert("Error updating product: " + msg);
        } finally {
            setLoading(false);
        }
    };

    const labelCls = "block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5";
    const inputCls = "w-full px-4 py-3 bg-white border border-cream-deep rounded-2xl focus:outline-none focus:border-accent text-sm";

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <Link href="/admin/products" className="inline-flex items-center gap-2 text-ink-mute hover:text-accent text-sm font-medium mb-4">
                    <ArrowLeft size={16} /> Back to Products
                </Link>
                <h1 className="font-display text-5xl text-ink">Edit product</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-cream-soft border border-cream-deep rounded-3xl p-8 space-y-6">
                <div>
                    <label htmlFor="product-name" className={labelCls}>Product Name</label>
                    <input id="product-name" name="name" required type="text" defaultValue={product.name} className={inputCls} />
                </div>

                <div className="grid grid-cols-2 gap-5">
                    <div>
                        <label htmlFor="product-category" className={labelCls}>Category</label>
                        <select id="product-category" name="category" defaultValue={product.category ?? CATEGORIES[0]} className={inputCls}>
                            {CATEGORIES.map((c) => (
                                <option key={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="product-price" className={labelCls}>Price (£)</label>
                        <input id="product-price" name="price" required type="number" step="0.01" defaultValue={product.price} className={inputCls} />
                    </div>
                </div>

                <div>
                    <label className={labelCls}>Product Image</label>
                    {!imageUrl ? (
                        <div className="border-2 border-dashed border-cream-deep rounded-2xl p-10 text-center hover:bg-cream/60 transition-colors relative">
                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={handleImageUpload}
                                disabled={uploading}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <div className="flex flex-col items-center gap-2 text-ink-mute">
                                {uploading ? (
                                    <>
                                        <Loader2 className="animate-spin text-accent" size={28} />
                                        <span className="text-sm font-medium">Uploading…</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 rounded-2xl bg-accent-soft flex items-center justify-center">
                                            <Upload className="text-accent" size={20} />
                                        </div>
                                        <div className="text-sm">
                                            <span className="font-semibold text-accent">Click to upload</span> or drag and drop
                                        </div>
                                        <span className="text-xs">PNG, JPG, WebP up to 10MB</span>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="relative w-full h-64 bg-cream rounded-2xl overflow-hidden border border-cream-deep">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imageUrl} alt="Preview" className="w-full h-full object-contain" />
                            <button
                                type="button"
                                onClick={() => setImageUrl("")}
                                className="absolute top-3 right-3 p-2 bg-white/95 text-ink-soft rounded-full shadow-sm hover:text-rose transition-colors"
                            >
                                <X size={16} />
                            </button>
                            <input type="hidden" name="image_url" value={imageUrl} />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-5">
                    <div>
                        <label htmlFor="product-unit" className={labelCls}>Unit</label>
                        <input id="product-unit" name="unit" type="text" defaultValue={product.unit ?? ""} className={inputCls} />
                    </div>
                    <div>
                        <label htmlFor="product-stock" className={labelCls}>Stock count</label>
                        <input id="product-stock" name="stock" type="number" defaultValue={product.stock ?? 0} className={inputCls} />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <input name="bestseller" type="checkbox" id="bestseller" defaultChecked={product.bestseller ?? false} className="w-4 h-4 accent-accent rounded" />
                    <label htmlFor="bestseller" className="text-sm text-ink-soft">Mark as bestseller</label>
                </div>

                <div className="pt-5 border-t border-cream-deep flex justify-end gap-3">
                    <Link href="/admin/products" className="px-6 py-3 text-ink-soft font-medium hover:bg-cream rounded-full transition-colors">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={loading || uploading}
                        className="btn-primary px-6 py-3 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading && <Loader2 className="animate-spin" size={16} />}
                        {loading ? "Saving…" : "Save changes"}
                    </button>
                </div>
            </form>
        </div>
    );
}
