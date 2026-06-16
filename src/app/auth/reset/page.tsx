"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowLeft, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { BRAND } from "@/lib/brand";

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const [hasRecoverySession, setHasRecoverySession] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const router = useRouter();

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const { data } = await supabase.auth.getSession();
            if (!cancelled) {
                setHasRecoverySession(!!data.session);
                setCheckingSession(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [supabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords don't match.");
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) {
                const msg = error.message?.toLowerCase() ?? "";
                if (msg.includes("weak") || msg.includes("password")) {
                    setError("Password is too weak. Use at least 8 characters with a mix of letters, numbers, and symbols.");
                } else if (msg.includes("same")) {
                    setError("Please choose a password different from your current one.");
                } else {
                    setError("Couldn't update your password. The reset link may have expired — please request a new one.");
                }
                return;
            }
            setSuccess(true);
            setTimeout(() => router.push("/"), 2000);
        } catch (err) {
            console.error("[auth/reset] unexpected error:", err);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-cream">
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
                        Almost there.
                    </h1>
                    <p className="text-cream/70 text-lg leading-relaxed">
                        Choose a new password to get back into your account.
                    </p>
                </div>
                <div className="bandhani-divider opacity-50 mt-auto" />
            </div>

            <div className="w-full lg:w-[45%] flex flex-col justify-center px-6 sm:px-12 py-12 overflow-y-auto">
                <div className="w-full max-w-md mx-auto">
                    <Link href="/auth" className="lg:hidden inline-flex items-center gap-2 text-ink-mute hover:text-accent text-sm font-medium mb-8">
                        <ArrowLeft size={16} /> Back to sign in
                    </Link>

                    <div className="mb-8">
                        <h2 className="font-display text-4xl text-ink mb-2">Set a new password</h2>
                        <p className="text-ink-mute">Choose something strong and memorable.</p>
                    </div>

                    {checkingSession ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="animate-spin text-ink-mute" size={28} />
                        </div>
                    ) : !hasRecoverySession ? (
                        <div className="bg-red-50 border border-red-100 text-rose px-4 py-4 rounded-2xl text-sm">
                            This reset link is invalid or has expired.{" "}
                            <Link href="/auth" className="font-semibold underline">
                                Request a new one
                            </Link>
                            .
                        </div>
                    ) : success ? (
                        <div className="bg-leaf-soft border border-leaf/30 text-leaf px-4 py-4 rounded-2xl text-sm flex items-start gap-3">
                            <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold">Password updated.</p>
                                <p className="text-leaf/80">Redirecting you home…</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="mb-5 bg-red-50 border border-red-100 text-rose px-4 py-3 rounded-2xl text-sm">{error}</div>
                            )}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-ink-soft mb-1.5 uppercase tracking-wider">New password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-mute" size={18} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            minLength={8}
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

                                <div>
                                    <label className="block text-xs font-semibold text-ink-soft mb-1.5 uppercase tracking-wider">Confirm new password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-mute" size={18} />
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
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

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2"
                                >
                                    {loading && <Loader2 className="animate-spin" size={18} />}
                                    Update password
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
