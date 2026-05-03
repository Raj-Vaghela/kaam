"use client";

import { useState, useTransition } from "react";
import { submitReturnRequest } from "@/app/account/returns/actions";
import { RotateCcw } from "lucide-react";

interface ReturnRequestButtonProps {
    orderId: string;
}

export default function ReturnRequestButton({ orderId }: ReturnRequestButtonProps) {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState("");
    const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);
    const [isPending, startTransition] = useTransition();

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!reason.trim()) return;
        startTransition(async () => {
            const res = await submitReturnRequest(orderId, reason);
            setResult(res);
            if (res.success) {
                setOpen(false);
                setReason("");
            }
        });
    }

    if (result?.success) {
        return (
            <p className="text-sm text-emerald-700 font-medium mt-3">
                Return request submitted. We&apos;ll be in touch soon.
            </p>
        );
    }

    return (
        <div className="mt-3 pt-3 border-t border-cream-deep">
            {!open ? (
                <button
                    onClick={() => setOpen(true)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-accent transition-colors"
                >
                    <RotateCcw size={14} />
                    Request Return
                </button>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-ink-mute">
                        Reason for return
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        maxLength={500}
                        required
                        rows={3}
                        placeholder="Please describe why you&apos;d like to return this order…"
                        className="w-full px-4 py-2.5 text-sm bg-white border border-cream-deep rounded-2xl focus:outline-none focus:border-accent text-ink resize-none placeholder:text-ink-mute"
                    />
                    <div className="flex items-center gap-2">
                        <button
                            type="submit"
                            disabled={isPending || !reason.trim()}
                            className="px-5 py-2 text-sm font-semibold text-white bg-[var(--gajju-teal-deep)] rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {isPending ? "Submitting…" : "Submit Return Request"}
                        </button>
                        <button
                            type="button"
                            onClick={() => { setOpen(false); setResult(null); }}
                            className="px-4 py-2 text-sm text-ink-mute hover:text-ink transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                    {result?.error && (
                        <p className="text-sm text-rose-600">{result.error}</p>
                    )}
                </form>
            )}
        </div>
    );
}
