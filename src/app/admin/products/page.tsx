import Link from "next/link";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function AdminProductsPage() {
    const supabase = await createClient();
    const { data: products } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

    return (
        <div>
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="font-display text-5xl text-ink mb-2">Products</h1>
                    <p className="text-ink-mute">Everything in the aisle.</p>
                </div>
                <Link href="/admin/products/new" className="btn-primary inline-flex items-center gap-2 px-5 py-3">
                    <Plus size={18} /> Add Product
                </Link>
            </div>

            <div className="bg-cream-soft border border-cream-deep rounded-3xl overflow-hidden">
                <div className="p-5 border-b border-cream-deep">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-mute" size={18} />
                        <input
                            type="text"
                            placeholder="Search products…"
                            className="w-full pl-11 pr-4 py-3 bg-cream border border-cream-deep rounded-full focus:outline-none focus:border-accent text-sm"
                        />
                    </div>
                </div>

                <table className="w-full text-left text-sm">
                    <thead className="bg-cream text-ink-mute text-xs font-semibold uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Product</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4">Price</th>
                            <th className="px-6 py-4">Stock</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-deep">
                        {products?.map((product) => (
                            <tr key={product.id} className="hover:bg-cream/60 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={product.image_url || "https://placehold.co/100"}
                                            alt={product.name}
                                            className="w-11 h-11 rounded-xl object-cover bg-cream"
                                        />
                                        <span className="font-semibold text-ink">{product.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-ink-soft">{product.category}</td>
                                <td className="px-6 py-4 font-semibold text-ink">£{product.price.toFixed(2)}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex py-1 px-3 rounded-full text-xs font-semibold ${product.stock > 0 ? "bg-leaf-soft text-leaf" : "bg-rose/10 text-rose"}`}>
                                        {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button className="p-2 text-ink-mute hover:text-accent hover:bg-accent-soft rounded-xl transition-colors">
                                            <Edit size={16} />
                                        </button>
                                        <button className="p-2 text-ink-mute hover:text-rose hover:bg-rose/10 rounded-xl transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {(!products || products.length === 0) && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-ink-mute">
                                    No products yet. Add your first.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
