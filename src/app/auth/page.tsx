"use client";

import { useState, Suspense } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { BRAND } from "@/lib/brand";

type AuthMode = "signin" | "signup" | "forgot" | "magic";

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

    const handleGoogleSignIn = async () => {
        setError("");
        setMessage("");
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`,
                    // Request the minimum scopes — Google's OAuth consent screen will only ask
                    // for what we need. Per GDPR data-minimization (Art. 5).
                    scopes: "openid email profile",
                },
            });
            if (error) {
                console.error("[auth] google sign-in error:", error);
                setError("Couldn't start Google sign-in. Please try again or use email instead.");
                setLoading(false);
            }
            // On success the browser navigates to Google — no setLoading(false) here.
        } catch (err) {
            console.error("[auth] unexpected error during google sign-in:", err);
            setError("Something went wrong. Please try again.");
            setLoading(false);
        }
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
            } else if (mode === "forgot") {
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
            } else {
                // mode === "magic" — passwordless sign-in via emailed one-time link.
                const { error } = await supabase.auth.signInWithOtp({
                    email,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`,
                    },
                });
                if (error) {
                    const msg = error.message?.toLowerCase() ?? "";
                    if (msg.includes("rate")) {
                        setError("Too many requests. Please wait a minute and try again.");
                    } else if (msg.includes("invalid") || msg.includes("email")) {
                        setError("That email address doesn't look valid. Please check and try again.");
                    } else {
                        setError("Couldn't send the sign-in link. Please try again in a moment.");
                    }
                    return;
                }
                setMessage(`Check your inbox at ${email} — we've sent a one-click sign-in link.`);
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
    const isMagic = mode === "magic";

    const heading = isForgot
        ? "Reset your password"
        : isMagic
            ? "Sign in without a password"
            : isLogin
                ? "Welcome back"
                : "Create your account";

    const subheading = isForgot
        ? "Enter your email and we'll send you a link to reset it."
        : isMagic
            ? "Type your email — we'll send you a one-click sign-in link."
            : isLogin
                ? "Sign in to pick up where you left off."
                : "Start your pantry journey with us.";

    const submitLabel = isForgot
        ? "Send reset link"
        : isMagic
            ? "Send sign-in link"
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

                    {!isForgot && !isMagic && (
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

                        {!isForgot && !isMagic && (
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

                        {(isForgot || isMagic) && (
                            <button
                                type="button"
                                onClick={() => switchMode("signin")}
                                className="w-full text-sm text-ink-mute hover:text-accent font-medium"
                            >
                                ← Back to sign in
                            </button>
                        )}
                    </form>

                    {/* Social / passwordless entry points — only on sign-in or sign-up,
                        not on forgot/magic flows. Google sign-in is feature-flagged via
                        NEXT_PUBLIC_GOOGLE_AUTH_ENABLED to allow the button to be hidden
                        when the OAuth client is unavailable (e.g. while reprovisioning
                        the Google Cloud project). Magic link remains the fallback. */}
                    {(isLogin || isSignup) && (
                        <div className="mt-5">
                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-cream-deep"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase tracking-wider">
                                    <span className="bg-cream px-3 text-ink-mute">or</span>
                                </div>
                            </div>

                            {process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true" && (
                                <button
                                    type="button"
                                    onClick={handleGoogleSignIn}
                                    disabled={loading}
                                    className="w-full py-3.5 text-sm font-semibold text-ink bg-white border border-cream-deep hover:border-ink-mute rounded-2xl transition-colors flex items-center justify-center gap-3 disabled:opacity-50 mb-3"
                                >
                                    {/* Google "G" logomark — required by Google's branding guidelines */}
                                    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
                                        <path fill="#FBBC04" d="M5.84 14.09a6.61 6.61 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z"/>
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
                                    </svg>
                                    Continue with Google
                                </button>
                            )}

                            {isLogin && (
                                <button
                                    type="button"
                                    onClick={() => switchMode("magic")}
                                    disabled={loading}
                                    className="mt-3 w-full py-3.5 text-sm font-semibold text-accent bg-accent-soft hover:bg-accent hover:text-white rounded-2xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Mail size={16} />
                                    Email me a sign-in link
                                </button>
                            )}
                        </div>
                    )}

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
