"use client";

import { useState } from "react";
import { ArrowLeft, Upload, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addProduct } from "@/app/actions";
import { createBrowserClient } from "@supabase/ssr";

export default function AddProductPage() {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [imageUrl, setImageUrl] = useState("");
    const router = useRouter();

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);

        try {
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(filePath);

            setImageUrl(publicUrl);
        } catch (error: any) {
            alert('Error uploading image: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);

        // If we have an uploaded image URL, ensure it's used
        if (imageUrl) {
            formData.set("image_url", imageUrl);
        }

        const result = await addProduct(formData);

        if (!result.success) {
            alert("Error creating product: " + result.message);
            setLoading(false);
        } else {
            alert("Product created successfully!");
            router.push("/admin/products");
            router.refresh();
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <Link href="/admin/products" className="text-slate-500 hover:text-slate-900 flex items-center gap-2 mb-4 text-sm font-bold">
                    <ArrowLeft size={16} /> Back to Products
                </Link>
                <h1 className="text-2xl font-bold text-slate-900">Add New Product</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Product Name</label>
                    <input
                        name="name"
                        required
                        type="text"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="e.g., Royal Basmati Rice"
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">Category</label>
                        <select
                            name="category"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option>Grains & Rice</option>
                            <option>Spices</option>
                            <option>Snacks</option>
                            <option>Beverages</option>
                            <option>Flour & Atta</option>
                            <option>Dairy & Pantry</option>
                            <option>Personal Care</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">Price (£)</label>
                        <input
                            name="price"
                            required
                            type="number"
                            step="0.01"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Product Image</label>

                    {!imageUrl ? (
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:bg-slate-50 transition-colors relative">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={uploading}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                                {uploading ? (
                                    <>
                                        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-sm font-medium">Uploading...</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                            <Upload className="text-slate-400" size={20} />
                                        </div>
                                        <div className="text-sm">
                                            <span className="font-bold text-emerald-600">Click to upload</span> or drag and drop
                                        </div>
                                        <span className="text-xs">PNG, JPG up to 10MB</span>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="relative w-full h-64 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 group">
                            <img src={imageUrl} alt="Product preview" className="w-full h-full object-contain" />
                            <button
                                type="button"
                                onClick={() => setImageUrl("")}
                                className="absolute top-2 right-2 p-2 bg-white/90 text-slate-700 rounded-full shadow-sm hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                                <X size={16} />
                            </button>
                            <input type="hidden" name="image_url" value={imageUrl} />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">Unit</label>
                        <input
                            name="unit"
                            type="text"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="e.g., 5kg"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">Stock Count</label>
                        <input
                            name="stock"
                            type="number"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="100"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <input name="bestseller" type="checkbox" id="bestseller" className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" />
                    <label htmlFor="bestseller" className="text-sm font-medium text-slate-700">Mark as Best Seller</label>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-4">
                    <Link href="/admin/products" className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={loading || uploading || !imageUrl}
                        className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Creating..." : "Create Product"}
                    </button>
                </div>
            </form>
        </div>
    );
}
