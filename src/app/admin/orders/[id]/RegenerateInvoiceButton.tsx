"use client";

import { useState, useTransition } from "react";
import { FileText, Loader2 } from "lucide-react";
import { regenerateInvoice } from "../actions";

export default function RegenerateInvoiceButton({ orderId }: { orderId: string }) {
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);

    function handleClick() {
        setResult(null);
        startTransition(async () => {
            const res = await regenerateInvoice(orderId);
            setResult(res);
        });
    }

    if (result?.ok) {
        return (
            <p role="status" className="text-sm text-emerald-700 mt-2">
                Invoice generated. Refresh the page to see it.
            </p>
        );
    }

    return (
        <div>
            <button
                type="button"
                onClick={handleClick}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-accent bg-accent-soft rounded-full hover:bg-accent hover:text-white transition-colors disabled:opacity-50"
            >
                {isPending ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                {isPending ? "Generating…" : "Generate invoice"}
            </button>
            {result && !result.ok && (
                <p role="alert" className="text-xs text-rose-700 mt-2">
                    {result.error}
                </p>
            )}
        </div>
    );
}
