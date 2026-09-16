import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { saveBar, savePopup } from "./actions";
import { Megaphone, ImageIcon } from "lucide-react";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
    await requireAdmin();
    const supabase = await createClient();

    const { data: banners } = await supabase
        .from("banners")
        .select("*")
        .in("type", ["bar", "popup"]);

    const bar = banners?.find((b) => b.type === "bar");
    const popup = banners?.find((b) => b.type === "popup");

    return (
        <div>
            <div className="mb-10">
                <h1 className="font-display text-5xl text-ink mb-2">Promotions</h1>
                <p className="text-ink-mute">Manage the announcement bar and promotional popup shown to customers.</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Announcement Bar */}
                <div className="bg-cream-soft border border-cream-deep rounded-3xl p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-2xl bg-accent-soft flex items-center justify-center">
                            <Megaphone size={18} className="text-accent" />
                        </div>
                        <div>
                            <h2 className="font-display text-2xl text-ink">Announcement Bar</h2>
                            <p className="text-xs text-ink-mute">Thin bar shown at the top of every page</p>
                        </div>
                    </div>

                    <form action={saveBar} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">Message</label>
                            <input
                                name="message"
                                defaultValue={bar?.message ?? ""}
                                placeholder="Free delivery on orders over £40 🎉"
                                className="w-full px-4 py-3 rounded-2xl border border-cream-deep bg-white focus:outline-none focus:border-accent text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">Link URL (optional)</label>
                            <input
                                name="link_url"
                                defaultValue={bar?.link_url ?? ""}
                                placeholder="/products?category=Sale"
                                className="w-full px-4 py-3 rounded-2xl border border-cream-deep bg-white focus:outline-none focus:border-accent text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">Background colour</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    name="bg_color"
                                    defaultValue={bar?.bg_color ?? "#c66b3d"}
                                    className="h-10 w-14 rounded-xl border border-cream-deep cursor-pointer"
                                />
                                <span className="text-xs text-ink-mute">Pick a colour for the bar background</span>
                            </div>
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer pt-2">
                            <input
                                type="checkbox"
                                name="is_active"
                                defaultChecked={bar?.is_active ?? false}
                                className="h-4 w-4 rounded accent-accent"
                            />
                            <span className="text-sm font-semibold text-ink">Show on website</span>
                        </label>
                        <button type="submit" className="btn-primary w-full py-3 text-sm mt-2">
                            Save Bar
                        </button>
                    </form>
                </div>

                {/* Promotional Popup */}
                <div className="bg-cream-soft border border-cream-deep rounded-3xl p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-2xl bg-accent-soft flex items-center justify-center">
                            <ImageIcon size={18} className="text-accent" />
                        </div>
                        <div>
                            <h2 className="font-display text-2xl text-ink">Promotional Popup</h2>
                            <p className="text-xs text-ink-mute">Modal shown to visitors on the homepage</p>
                        </div>
                    </div>

                    {popup?.image_url && (
                        <div className="mb-4 rounded-2xl overflow-hidden border border-cream-deep">
                            <Image
                                src={popup.image_url}
                                alt="Current popup banner"
                                width={600}
                                height={400}
                                className="w-full object-cover max-h-48"
                            />
                            <p className="text-xs text-ink-mute text-center py-2">Current image</p>
                        </div>
                    )}

                    <form action={savePopup} encType="multipart/form-data" className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">
                                Upload poster / image
                            </label>
                            <input
                                type="file"
                                name="image"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                className="w-full text-sm text-ink-soft file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-accent-soft file:text-accent hover:file:bg-accent hover:file:text-white file:transition-colors cursor-pointer"
                            />
                            <p className="text-xs text-ink-mute mt-1">JPG, PNG, WebP or GIF · max 5 MB. Leave empty to keep current image.</p>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">Link URL (optional)</label>
                            <input
                                name="link_url"
                                defaultValue={popup?.link_url ?? ""}
                                placeholder="/products?category=Sale"
                                className="w-full px-4 py-3 rounded-2xl border border-cream-deep bg-white focus:outline-none focus:border-accent text-sm"
                            />
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer pt-2">
                            <input
                                type="checkbox"
                                name="is_active"
                                defaultChecked={popup?.is_active ?? false}
                                className="h-4 w-4 rounded accent-accent"
                            />
                            <span className="text-sm font-semibold text-ink">Show on website</span>
                        </label>
                        <button type="submit" className="btn-primary w-full py-3 text-sm mt-2">
                            Save Popup
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
