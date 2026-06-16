"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    CheckCircle,
    Package,
    ArrowRight,
    UserPlus,
    Mail,
    Loader2,
    Clock,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { getOrderByToken } from "@/app/actions";

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 30_000;

type ConfirmationState =
    | { phase: "checking" }
    | { phase: "confirmed" }
    | { phase: "timeout" }
    | { phase: "no_token" }; // logged-in user path: no guest token, skip polling

export default function CheckoutSuccessPage() {
    return (
        <Suspense
            fallback={
                <div className="max-w-2xl mx-auto px-4 py-20 text-center">
                    <Loader2 className="animate-spin text-ink-mute mx-auto" size={32} />
                </div>
            }
        >
            <CheckoutSuccessInner />
        </Suspense>
    );
}

function CheckoutSuccessInner() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const orderId = searchParams.get("order_id");
    const redirectStatus = searchParams.get("redirect_status");
    const { clearCart } = useCart();

    const [confirmationState, setConfirmationState] = useState<ConfirmationState>(
        token ? { phase: "checking" } : { phase: "no_token" }
    );
    const pollStartRef = useRef<number>(Date.now());
    const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const clearedRef = useRef(false);

    const isSuccess = redirectStatus === "succeeded";

    const clearCartOnce = useCallback(() => {
        if (!clearedRef.current) {
            clearedRef.current = true;
            clearCart();
        }
    }, [clearCart]);

    const stopPolling = useCallback(() => {
        if (pollTimerRef.current) {
            clearTimeout(pollTimerRef.current);
            pollTimerRef.current = null;
        }
    }, []);

    // For logged-in users (no guest token), we cannot query order status without
    // an authenticated server action that checks ownership. Stripe's redirect_status=succeeded
    // is a strong enough signal here — clear the cart immediately.
    useEffect(() => {
        if (isSuccess && confirmationState.phase === "no_token" && orderId) {
            clearCartOnce();
        }
    }, [isSuccess, confirmationState.phase, orderId, clearCartOnce]);

    // Guest path: poll until the webhook has set the order to paid/payment_received,
    // then clear the cart. Cap at POLL_TIMEOUT_MS to avoid polling indefinitely.
    useEffect(() => {
        if (!isSuccess || !token || confirmationState.phase !== "checking") return;

        let cancelled = false;

        async function poll() {
            if (cancelled) return;

            const elapsed = Date.now() - pollStartRef.current;
            if (elapsed >= POLL_TIMEOUT_MS) {
                setConfirmationState({ phase: "timeout" });
                return;
            }

            try {
                const result = await getOrderByToken(token as string);
                if (
                    result.success &&
                    result.order &&
                    (result.order.status === "paid" || result.order.status === "payment_received")
                ) {
                    if (!cancelled) {
                        setConfirmationState({ phase: "confirmed" });
                        clearCartOnce();
                    }
                    return;
                }
            } catch {
                // Transient network error — continue polling
            }

            if (!cancelled) {
                pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
            }
        }

        poll();

        return () => {
            cancelled = true;
            stopPolling();
        };
    }, [isSuccess, token, confirmationState.phase, clearCartOnce, stopPolling]);

    if (!isSuccess) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-20 text-center">
                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-7">
                    <CheckCircle size={52} className="text-rose" strokeWidth={1.6} />
                </div>
                <h1 className="font-display text-4xl text-ink mb-3">Payment not completed</h1>
                <p className="text-lg text-ink-mute mb-8">
                    Your payment was not successful. Please try again.
                </p>
                <Link href="/checkout" className="btn-primary inline-block px-8 py-3.5">
                    Return to checkout
                </Link>
            </div>
        );
    }

    // Show a loading state while polling for webhook confirmation
    if (confirmationState.phase === "checking") {
        return (
            <div className="max-w-2xl mx-auto px-4 py-20 text-center">
                <Loader2 className="animate-spin text-ink-mute mx-auto mb-6" size={40} />
                <h1 className="font-display text-3xl text-ink mb-3">Confirming your order...</h1>
                <p className="text-ink-mute">
                    Your payment was received. We&apos;re confirming your order — this takes just a moment.
                </p>
            </div>
        );
    }

    // Webhook timed out — show success UI with a note that the cart will clear shortly.
    const isProcessingDelayed = confirmationState.phase === "timeout";

    return (
        <div className="max-w-2xl mx-auto px-4 py-20">
            <div className="text-center mb-10">
                <div className="w-24 h-24 bg-leaf-soft rounded-full flex items-center justify-center mx-auto mb-7">
                    <CheckCircle size={52} className="text-leaf" strokeWidth={1.6} />
                </div>
                <p className="text-xs font-semibold tracking-widest uppercase text-leaf mb-3">
                    Order confirmed
                </p>
                <h1 className="font-display text-5xl text-ink mb-3 leading-tight">
                    Bahot bahot dhanyavaad!
                </h1>
                <p className="text-lg text-ink-mute">
                    Your order is being prepared with love. Check your inbox in a moment.
                </p>
            </div>

            {isProcessingDelayed && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6 flex items-start gap-3">
                    <Clock size={18} className="text-amber-700 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">
                        Your payment is being processed by your bank. Your cart will be cleared
                        and your confirmation email sent once the payment is confirmed — usually
                        within a few minutes.
                    </p>
                </div>
            )}

            <div className="bg-cream-soft border border-cream-deep rounded-3xl p-8 mb-6">
                <div className="flex items-start gap-4 mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
                        <Mail size={22} />
                    </div>
                    <div>
                        <h2 className="font-display text-xl text-ink mb-1">Email on its way</h2>
                        <p className="text-sm text-ink-mute">
                            We&apos;ve sent your invoice and tracking link to the email on file.
                        </p>
                    </div>
                </div>
                {token && (
                    <Link
                        href={`/orders/${encodeURIComponent(token)}`}
                        className="inline-flex items-center gap-2 text-accent font-semibold text-sm hover:gap-3 transition-all"
                    >
                        <Package size={16} />
                        Track your order
                        <ArrowRight size={14} />
                    </Link>
                )}
                {orderId && !token && (
                    <Link
                        href="/account/orders"
                        className="inline-flex items-center gap-2 text-accent font-semibold text-sm hover:gap-3 transition-all"
                    >
                        <Package size={16} /> View order in your account
                        <ArrowRight size={14} />
                    </Link>
                )}
            </div>

            {token && (
                <div className="bg-[var(--gajju-teal-deep)] text-cream rounded-3xl p-8 mb-6">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-haldi/20 text-haldi flex items-center justify-center shrink-0">
                            <UserPlus size={22} />
                        </div>
                        <div>
                            <h2 className="font-display text-xl text-cream mb-1">
                                Make it easier next time
                            </h2>
                            <p className="text-sm text-cream/70">
                                Create a free account to track every order and re-order
                                favourites in one tap.
                            </p>
                        </div>
                    </div>
                    <Link
                        href={`/orders/${encodeURIComponent(token!)}/create-account`}
                        className="inline-flex items-center gap-2 bg-accent hover:bg-[var(--gajju-terracotta-deep)] text-white px-6 py-3 rounded-full font-semibold text-sm transition-colors"
                    >
                        Create my account <ArrowRight size={14} />
                    </Link>
                </div>
            )}

            <div className="text-center">
                <Link
                    href="/products"
                    className="btn-secondary inline-flex items-center gap-2 px-8 py-3.5"
                >
                    Continue shopping
                </Link>
            </div>
        </div>
    );
}
