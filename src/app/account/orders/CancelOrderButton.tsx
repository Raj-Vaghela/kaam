"use client";

import { useState, useTransition } from "react";
import { X, Loader2 } from "lucide-react";
import { cancelOrder } from "./cancelOrder";

interface CancelOrderButtonProps {
    orderId: string;
    orderTotal: number;
    paymentCaptured: boolean; // true if status is "paid" or "payment_processing"
}

export default function CancelOrderButton({
    orderId,
    orderTotal,
    paymentCaptured,
}: CancelOrderButtonProps) {
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cancelled, setCancelled] = useState(false);
    const [isPending, startTransition] = useTransition();

    function handleCancel() {
        setError(null);
        startTransition(async () => {
            const res = await cancelOrder(orderId);
            if (res.ok) {
                setCancelled(true);
                setConfirming(false);
            } else {
                setError(res.error || "Could not cancel. Please try again.");
            }
        });
    }

    if (cancelled) {
        return (
            <p role="status" className="text-sm text-emerald-700 font-medium mt-3">
                Order cancelled. {paymentCaptured ? "Refund issued — check your email." : "No charge was taken."}
            </p>
        );
    }

    return (
        <div className="mt-3 pt-3 border-t border-cream-deep">
            {!confirming ? (
                <button
                    type="button"
                    onClick={() => setConfirming(true)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-700 hover:text-rose-900 transition-colors"
                >
                    <X size={14} />
                    Cancel order
                </button>
            ) : (
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 space-y-3">
                    <div>
                        <p className="text-sm font-semibold text-ink mb-1">Cancel this order?</p>
                        <p className="text-xs text-ink-soft">
                            {paymentCaptured
                                ? `A full refund of £${orderTotal.toFixed(2)} will be issued to your original payment method. It usually appears within 5–10 business days.`
                                : "No charge will be taken — the pending authorisation on your card will be released."}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={isPending}
                            className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-full disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
                        >
                            {isPending && <Loader2 size={14} className="animate-spin" />}
                            {isPending ? "Cancelling…" : "Yes, cancel order"}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setConfirming(false);
                                setError(null);
                            }}
                            disabled={isPending}
                            className="px-4 py-2 text-sm text-ink-soft hover:text-ink transition-colors disabled:opacity-50"
                        >
                            Keep order
                        </button>
                    </div>
                    {error && (
                        <p role="alert" className="text-xs text-rose-700">
                            {error}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
