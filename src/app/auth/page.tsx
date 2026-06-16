"use client";

import { useState, Suspense } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { BRAND } from "@/lib/brand";

type AuthMode = "signin" | "signup" | "forgot";

export default function AuthPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-cream"><Loader2 className="animate-spin text-ink-mute" size={32} /></div>}>
            <AuthPageInner />
        </Suspense>
    );
}

function AuthPageInner() {
    const [mode, setMode] = useState<AuthMode>("signin");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    const switchMode = (next: AuthMode) => {
        setMode(next);
        setError("");
        setMessage("");
        setPassword("");
        setConfirmPassword("");
        setShowPassword(false);
        setShowConfirmPassword(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");
        try {
            if (mode === "signin") {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) {
                    const code = (error as { code?: string }).code;
                    const msg = error.message?.toLowerCase() ?? "";
                    if (code === "email_not_confirmed" || msg.includes("not confirmed")) {
                        setError("Please confirm your email first. Check your inbox for the confirmation link we sent when you signed up.");
                    } else if (code === "over_request_rate_limit" || msg.includes("rate")) {
                        setError("Too many sign-in attempts. Please wait a minute and try again.");
                    } else if (code === "invalid_credentials" || msg.includes("invalid")) {
                        setError("Email or password is incorrect. Please try again.");
                    } else {
                        setError("Couldn't sign you in. Please try again in a moment.");
                    }
                    return;
                }
                router.push(redirect);
                router.refresh();
            } else if (mode === "signup") {
                if (password !== confirmPassword) {
                    setError("Passwords don't match. Please re-enter them.");
                    return;
                }
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { full_name: fullName } },
                });
                if (error) {
                    const code = (error as { code?: string }).code;
                    const msg = error.message?.toLowerCase() ?? "";
                    if (code === "weak_password" || msg.includes("password")) {
                        setError("Password is too weak. Use at least 8 characters with a mix of letters, numbers, and symbols.");
                    } else if (code === "user_already_exists" || msg.includes("already")) {
                        setError("An account with this email already exists. Try signing in instead.");
                    } else if (code === "validation_failed" || msg.includes("email")) {
                        setError("That email address doesn't look valid. Please check and try again.");
                    } else {
                        setError("Could not create account. Please try again in a moment.");
                    }
                    return;
                }
                if (data.user && data.user.identities && data.user.identities.length === 0) {
                    setError("An account with this email already exists. Try signing in instead.");
                    return;
                }
                setMessage("Check your email for the confirmation link!");
            } else {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset`,
                });
                if (error) {
                    const msg = error.message?.toLowerCase() ?? "";
                    if (msg.includes("rate")) {
                        setError("Too many requests. Please wait a minute and try again.");
                    } else {
                        setError("Couldn't send the reset link. Please try again in a moment.");
                    }
                    return;
                }
                setMessage("If that email is registered, we've sent a reset link. Check your inbox.");
            }
        } catch (err) {
            console.error("[auth] unexpected error during sign-in/up:", err);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const isLogin = mode === "signin";
    const isSignup = mode === "signup";
    const isForgot = mode === "forgot";

    const heading = isForgot
        ? "Reset your password"
        : isLogin
            ? "Welcome back"
            : "Create your account";

    const subheading = isForgot
        ? "Enter your email and we'll send you a link to reset it."
        : isLogin
            ? "Sign in to pick up where you left off."
            : "Start your pantry journey with us.";

    const submitLabel = isForgot
        ? "Send reset link"
        : isLogin
            ? "Sign In"
            : "Create Account";

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
                        <h2 className="font-display text-4xl text-ink mb-2">{heading}</h2>
                        <p className="text-ink-mute">{subheading}</p>
                    </div>

                    {!isForgot && (
                        <div className="flex p-1 bg-cream-soft border border-cream-deep rounded-full mb-6">
                            <button
                                type="button"
                                onClick={() => switchMode("signin")}
                                className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all ${isLogin ? "bg-white text-accent shadow-sm" : "text-ink-mute hover:text-ink"}`}
                            >
                                Sign In
                            </button>
                            <button
                                type="button"
                                onClick={() => switchMode("signup")}
                                className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all ${isSignup ? "bg-white text-accent shadow-sm" : "text-ink-mute hover:text-ink"}`}
                            >
                                Sign Up
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="mb-5 bg-red-50 border border-red-100 text-rose px-4 py-3 rounded-2xl text-sm">{error}</div>
                    )}
                    {message && (
                        <div className="mb-5 bg-leaf-soft border border-leaf/30 text-leaf px-4 py-3 rounded-2xl text-sm">{message}</div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isSignup && (
                            <div>
                                <label className="block text-xs font-semibold text-ink-soft mb-1.5 uppercase tracking-wider">Full name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-mute" size={18} />
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required={isSignup}
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

                        {!isForgot && (
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider">Password</label>
                                    {isLogin && (
                                        <button
                                            type="button"
                                            onClick={() => switchMode("forgot")}
                                            className="text-xs font-semibold text-accent hover:underline"
                                        >
                                            Forgot password?
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-mute" size={18} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={isSignup ? 8 : 6}
                                        placeholder="••••••••"
                                        className="w-full pl-11 pr-12 py-3.5 border border-cream-deep rounded-2xl bg-cream-soft focus:outline-none focus:border-accent focus:bg-white transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-mute hover:text-ink"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {isSignup && (
                            <div>
                                <label className="block text-xs font-semibold text-ink-soft mb-1.5 uppercase tracking-wider">Confirm password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-mute" size={18} />
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required={isSignup}
                                        minLength={8}
                                        placeholder="Re-enter your password"
                                        className={`w-full pl-11 pr-12 py-3.5 border rounded-2xl bg-cream-soft focus:outline-none focus:bg-white transition-all ${
                                            confirmPassword && password !== confirmPassword
                                                ? "border-rose focus:border-rose"
                                                : "border-cream-deep focus:border-accent"
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword((v) => !v)}
                                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-mute hover:text-ink"
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {confirmPassword && password !== confirmPassword && (
                                    <p className="mt-1.5 text-xs text-rose">Passwords don't match.</p>
                                )}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="animate-spin" size={18} />}
                            {submitLabel}
                        </button>

                        {isForgot && (
                            <button
                                type="button"
                                onClick={() => switchMode("signin")}
                                className="w-full text-sm text-ink-mute hover:text-accent font-medium"
                            >
                                ← Back to sign in
                            </button>
                        )}
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
