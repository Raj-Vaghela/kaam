"use client";

import { useState, Suspense } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, ArrowLeft, Loader2 } from "lucide-react";
import Image from "next/image";
import { BRAND } from "@/lib/brand";

export default function AuthPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-cream"><Loader2 className="animate-spin text-ink-mute" size={32} /></div>}>
            <AuthPageInner />
        </Suspense>
    );
}

function AuthPageInner() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get("redirect") || "/";

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");
        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) {
                    setError("Invalid email or password. Please try again.");
                    return;
                }
                router.push(redirect);
                router.refresh();
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { full_name: fullName } },
                });
                if (error) {
                    setError("Could not create account. The email may already be in use, or try a stronger password.");
                    return;
                }
                setMessage("Check your email for the confirmation link!");
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-cream">
            {/* Left side — editorial brand panel */}
            <div className="hidden lg:flex lg:w-[55%] relative bg-[var(--gajju-teal-deep)] text-cream p-12 flex-col">
                <Link href="/" className="inline-flex items-center gap-2 text-cream/80 hover:text-haldi text-sm font-medium mb-12">
                    <ArrowLeft size={16} /> Back to {BRAND.name}
                </Link>

                <div className="my-auto max-w-lg">
                    <Image
                        src={BRAND.logo.horizontalWhite}
                        alt={BRAND.name}
                        width={220}
                        height={56}
                        className="mb-12"
                    />
                    <h1 className="font-display text-6xl leading-[0.95] mb-6">
                        Welcome to the family.
                    </h1>
                    <p className="font-[var(--font-hind)] text-2xl text-haldi mb-6">
                        {BRAND.tagline}
                    </p>
                    <p className="text-cream/70 text-lg leading-relaxed">
                        Sign in to track orders, save your favourite masalas, and unlock
                        member pricing on the brands you grew up with.
                    </p>
                </div>

                <div className="bandhani-divider opacity-50 mt-auto" />
            </div>

            {/* Right side — form */}
            <div className="w-full lg:w-[45%] flex flex-col justify-center px-6 sm:px-12 py-12 overflow-y-auto">
                <div className="w-full max-w-md mx-auto">
                    <Link href="/" className="lg:hidden inline-flex items-center gap-2 text-ink-mute hover:text-accent text-sm font-medium mb-8">
                        <ArrowLeft size={16} /> Back
                    </Link>

                    <div className="mb-8">
                        <h2 className="font-display text-4xl text-ink mb-2">
                            {isLogin ? "Welcome back" : "Create your account"}
                        </h2>
                        <p className="text-ink-mute">
                            {isLogin
                                ? "Sign in to pick up where you left off."
                                : "Start your pantry journey with us."}
                        </p>
                    </div>

                    <div className="flex p-1 bg-cream-soft border border-cream-deep rounded-full mb-6">
                        <button
                            onClick={() => { setIsLogin(true); setError(""); setMessage(""); }}
                            className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all ${isLogin ? "bg-white text-accent shadow-sm" : "text-ink-mute hover:text-ink"}`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => { setIsLogin(false); setError(""); setMessage(""); }}
                            className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all ${!isLogin ? "bg-white text-accent shadow-sm" : "text-ink-mute hover:text-ink"}`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {error && (
                        <div className="mb-5 bg-red-50 border border-red-100 text-rose px-4 py-3 rounded-2xl text-sm">{error}</div>
                    )}
                    {message && (
                        <div className="mb-5 bg-leaf-soft border border-leaf/30 text-leaf px-4 py-3 rounded-2xl text-sm">{message}</div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label className="block text-xs font-semibold text-ink-soft mb-1.5 uppercase tracking-wider">Full name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-mute" size={18} />
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required={!isLogin}
                                        placeholder="Priya Patel"
                                        className="w-full pl-11 pr-4 py-3.5 border border-cream-deep rounded-2xl bg-cream-soft focus:outline-none focus:border-accent focus:bg-white transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-semibold text-ink-soft mb-1.5 uppercase tracking-wider">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-mute" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="you@example.com"
                                    className="w-full pl-11 pr-4 py-3.5 border border-cream-deep rounded-2xl bg-cream-soft focus:outline-none focus:border-accent focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-ink-soft mb-1.5 uppercase tracking-wider">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-mute" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-4 py-3.5 border border-cream-deep rounded-2xl bg-cream-soft focus:outline-none focus:border-accent focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="animate-spin" size={18} />}
                            {isLogin ? "Sign In" : "Create Account"}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-xs text-ink-mute">
                        By continuing, you agree to our{" "}
                        <a href="/terms" className="underline hover:text-accent">Terms</a> and{" "}
                        <a href="/privacy" className="underline hover:text-accent">Privacy Policy</a>.
                    </p>
                </div>
            </div>
        </div>
    );
}
