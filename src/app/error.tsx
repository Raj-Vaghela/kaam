"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { BRAND } from "@/lib/brand";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        Sentry.captureException(error);
    }, [error]);

    return (
        <div className="min-h-screen bg-cream flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <p className="text-8xl font-display text-cream-deep select-none mb-2">500</p>
                <h1 className="font-display text-4xl text-ink mb-3">Something went wrong</h1>
                <p className="text-ink-mute text-lg mb-8">
                    Something unexpected happened on our end. Our team has been notified. Please try again.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="btn-primary inline-flex items-center justify-center gap-2 px-7 py-3.5"
                    >
                        <RefreshCw size={16} />
                        Try again
                    </button>
                    <Link href="/" className="btn-secondary inline-flex items-center justify-center gap-2 px-7 py-3.5">
                        <ArrowLeft size={16} />
                        Back to {BRAND.name}
                    </Link>
                </div>
                {error.digest && (
                    <p className="mt-6 text-xs text-ink-mute font-mono">Error ID: {error.digest}</p>
                )}
            </div>
        </div>
    );
}
