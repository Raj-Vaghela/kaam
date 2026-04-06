"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { ArrowLeft, Mail, Lock, Loader2, UserPlus } from "lucide-react";
import { linkGuestOrdersToAccount } from "@/app/actions";

export default function CreateAccountFromOrderPage() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;

    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch order to get email
    useEffect(() => {
        async function fetchOrder() {
            const { data, error } = await supabase
                .from("orders")
                .select("*")
                .eq("guest_token", token)
                .single();

            if (error || !data) {
                setError("Order not found");
            } else {
                setOrder(data);
                setEmail(data.guest_email || "");
            }
            setLoading(false);
        }

        fetchOrder();
    }, [token, supabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            // Create account with Supabase
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: order?.shipping_address?.fullName || "",
                    },
                },
            });

            if (authError) throw authError;

            // Link guest orders to the new account
            if (authData.user) {
                await linkGuestOrdersToAccount(email);
            }

            setSuccess(true);

            // Redirect to account after a moment
            setTimeout(() => {
                router.push("/account");
            }, 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-md mx-auto px-4 py-16 text-center">
                <Loader2 size={32} className="animate-spin mx-auto text-emerald-600" />
            </div>
        );
    }

    if (success) {
        return (
            <div className="max-w-md mx-auto px-4 py-16 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <UserPlus size={32} className="text-emerald-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Account Created!</h1>
                <p className="text-slate-600 mb-4">
                    Check your email to confirm your account. Your past orders have been linked.
                </p>
                <p className="text-sm text-slate-500">Redirecting to your account...</p>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto px-4 py-8">
            <Link
                href={`/orders/${token}`}
                className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium mb-8"
            >
                <ArrowLeft size={16} />
                Back to Order
            </Link>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserPlus size={28} className="text-emerald-600" />
                    </div>
                    <h1 className="text-2xl font-serif font-bold text-slate-900 mb-2">
                        Create Your Account
                    </h1>
                    <p className="text-slate-500 text-sm">
                        Track orders, re-order favourites, and get exclusive offers.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled
                                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Using the email from your order
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Create Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="At least 6 characters"
                                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                Creating Account...
                            </>
                        ) : (
                            "Create Account"
                        )}
                    </button>
                </form>

                <p className="mt-6 text-center text-xs text-slate-500">
                    Your order is confirmed regardless of whether you create an account.
                </p>
            </div>
        </div>
    );
}
