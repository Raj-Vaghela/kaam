import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { BRAND } from "@/lib/brand";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-cream flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <p className="text-8xl font-display text-cream-deep select-none mb-2">404</p>
                <h1 className="font-display text-4xl text-ink mb-3">Page not found</h1>
                <p className="text-ink-mute text-lg mb-8">
                    Looks like this page has gone missing — like the last packet of Haldirams at a family do.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/products" className="btn-primary inline-flex items-center justify-center gap-2 px-7 py-3.5">
                        <Search size={16} />
                        Browse the pantry
                    </Link>
                    <Link href="/" className="btn-secondary inline-flex items-center justify-center gap-2 px-7 py-3.5">
                        <ArrowLeft size={16} />
                        Back to {BRAND.name}
                    </Link>
                </div>
            </div>
        </div>
    );
}
