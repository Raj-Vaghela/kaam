"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, ArrowLeft, Loader2 } from "lucide-react";
import Image from "next/image";
import { BRAND } from "@/lib/brand";

function GoogleIcon() {
    return (
        <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
    );
}

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
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
                if (error) throw error;
                router.push(redirect);
                router.refresh();
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { full_name: fullName } },
                });
                if (error) throw error;
                setMessage("Check your email for the confirmation link!");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        setError("");
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: { redirectTo: `${window.location.origin}/auth/callback?next=${redirect}` },
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message);
            setGoogleLoading(false);
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
                        src={BRAND.logo.horizontal}
                        alt={BRAND.name}
                        width={220}
                        height={56}
                        className="brightness-0 invert mb-12"
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

                    <button
                        onClick={handleGoogleSignIn}
                        disabled={googleLoading}
                        className="w-full flex items-center justify-center gap-3 bg-cream-soft hover:bg-white border border-cream-deep text-ink font-semibold py-3.5 rounded-full transition-all mb-5 disabled:opacity-70"
                    >
                        {googleLoading ? <Loader2 className="animate-spin" size={20} /> : <GoogleIcon />}
                        Continue with Google
                    </button>

                    <div className="relative mb-5">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-cream-deep" /></div>
                        <div className="relative flex justify-center text-xs uppercase tracking-wider">
                            <span className="bg-cream px-4 text-ink-mute">or with email</span>
                        </div>
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
                        By continuing, you agree to our Terms and Privacy Policy.
                    </p>
                </div>
            </div>
        </div>
    );
}
