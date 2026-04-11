"use client";

import { useState } from "react";
import {
    PaymentElement,
    AddressElement,
    ExpressCheckoutElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import { Loader2, Lock, CreditCard } from "lucide-react";
import { updateOrderShipping } from "@/app/actions";

interface Props {
    orderId: string;
    guestToken: string | null;
    email: string;
    amount: number;
}

export default function CheckoutForm({ orderId, guestToken, email, amount }: Props) {
    const stripe = useStripe();
    const elements = useElements();

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const returnUrl = (() => {
        if (typeof window === "undefined") return "/checkout/success";
        const tokenParam = guestToken ? `&token=${guestToken}` : "";
        return `${window.location.origin}/checkout/success?order_id=${orderId}${tokenParam}`;
    })();

    const confirm = async () => {
        if (!stripe || !elements) return;
        setSubmitting(true);
        setError(null);

        // Validate AddressElement and persist to order before confirming.
        const addressElement = elements.getElement(AddressElement);
        if (addressElement) {
            const { complete, value } = await addressElement.getValue();
            if (!complete) {
                setError("Please complete your delivery address.");
                setSubmitting(false);
                return;
            }
            const addr = value.address;
            const result = await updateOrderShipping(orderId, {
                fullName: value.name || "",
                phone: value.phone || "",
                addressLine1: addr.line1 || "",
                addressLine2: addr.line2 || "",
                city: addr.city || "",
                postcode: addr.postal_code || "",
                country: addr.country || "",
            });
            if (!result.success) {
                setError(result.error || "Could not save address");
                setSubmitting(false);
                return;
            }
        }

        const { error: stripeError } = await stripe.confirmPayment({
            elements,
            confirmParams: { return_url: returnUrl, receipt_email: email },
        });

        if (stripeError) {
            setError(stripeError.message || "Payment failed");
            setSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await confirm();
    };

    const onExpressConfirm = async () => {
        // ExpressCheckoutElement triggers its own confirmation flow via Stripe;
        // we still validate and persist the address first.
        await confirm();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Express checkout (Apple Pay / Google Pay / Link) */}
            <div className="bg-cream-soft border border-cream-deep rounded-3xl p-6">
                <h2 className="font-display text-xl text-ink mb-4">Express checkout</h2>
                <ExpressCheckoutElement onConfirm={onExpressConfirm} />
                <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-cream-deep"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase tracking-wider">
                        <span className="bg-cream-soft px-4 text-ink-mute">or pay manually</span>
                    </div>
                </div>

                {/* Address */}
                <h3 className="font-display text-lg text-ink mb-3">Delivery address</h3>
                <AddressElement
                    options={{
                        mode: "shipping",
                        allowedCountries: ["GB", "IE"],
                        fields: { phone: "always" },
                        validation: { phone: { required: "always" } },
                    }}
                />
            </div>

            {/* Payment */}
            <div className="bg-cream-soft border border-cream-deep rounded-3xl p-6">
                <h2 className="font-display text-xl text-ink mb-4 flex items-center gap-2">
                    <CreditCard size={20} className="text-accent" />
                    Payment details
                </h2>
                <PaymentElement options={{ layout: "tabs" }} />
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 text-rose px-4 py-3 rounded-2xl text-sm">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={!stripe || submitting}
                className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {submitting ? (
                    <>
                        <Loader2 className="animate-spin" size={18} /> Processing…
                    </>
                ) : (
                    <>
                        <Lock size={16} /> Pay £{amount.toFixed(2)}
                    </>
                )}
            </button>

            <p className="text-center text-xs text-ink-mute">
                By placing your order, you agree to our Terms and Privacy Policy.
            </p>
        </form>
    );
}
