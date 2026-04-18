"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Lock, Loader2, UserPlus } from "lucide-react";
import { linkGuestOrdersToAccount } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function CreateAccountFromOrderPage() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        async function fetchOrder() {
            const { data, error } = await supabase
                .from("orders")
                .select("*")
                .eq("guest_token", token)
                .single();
            if (error || !data) setError("Order not found");
            else { setOrder(data); setEmail(data.guest_email || ""); }
            setLoading(false);
        }
        fetchOrder();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");
        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: order?.shipping_address?.fullName || "" } },
            });
            if (authError) throw authError;
            if (authData.user) await linkGuestOrdersToAccount(email);
            setSuccess(true);
            setTimeout(() => router.push("/account"), 2000);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-md mx-auto px-4 py-24 text-center">
                <Loader2 size={32} className="animate-spin mx-auto text-accent" />
            </div>
        );
    }

    if (success) {
        return (
            <div className="max-w-md mx-auto px-4 py-24 text-center">
                <div className="w-20 h-20 bg-leaf-soft rounded-full flex items-center justify-center mx-auto mb-6">
                    <UserPlus size={36} className="text-leaf" />
                </div>
                <h1 className="font-display text-4xl text-ink mb-3">You&apos;re in!</h1>
                <p className="text-ink-mute mb-2">Check your inbox to confirm your account.</p>
                <p className="text-sm text-ink-mute">Past orders linked. Redirecting…</p>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto px-4 py-12">
            <Link href={`/orders/${token}`} className="inline-flex items-center gap-2 text-ink-mute hover:text-accent text-sm font-medium mb-8">
                <ArrowLeft size={16} /> Back to order
            </Link>

            <div className="bg-cream-soft border border-cream-deep rounded-3xl p-8">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-accent-soft rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserPlus size={28} className="text-accent" />
                    </div>
                    <h1 className="font-display text-3xl text-ink mb-2">
                        Create your account
                    </h1>
                    <p className="text-sm text-ink-mute">
                        Track orders, save favourites, get member pricing.
                    </p>
                </div>

                {error && (
                    <div className="mb-5 bg-red-50 border border-red-100 text-rose px-4 py-3 rounded-2xl text-sm">{error}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-mute" size={18} />
                            <input
                                type="email"
                                value={email}
                                disabled
                                className="w-full pl-11 pr-4 py-3.5 border border-cream-deep rounded-2xl bg-cream text-ink-mute"
                            />
                        </div>
                        <p className="text-xs text-ink-mute mt-1">Using the email from your order</p>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">Create password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-mute" size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="At least 6 characters"
                                className="w-full pl-11 pr-4 py-3.5 border border-cream-deep rounded-2xl bg-white focus:outline-none focus:border-accent"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="btn-primary w-full py-3.5 flex items-center justify-center gap-2"
                    >
                        {submitting && <Loader2 className="animate-spin" size={18} />}
                        Create account
                    </button>
                </form>

                <p className="mt-6 text-center text-xs text-ink-mute">
                    Your order is confirmed regardless.
                </p>
            </div>
        </div>
    );
}
