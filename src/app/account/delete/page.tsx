"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function DeleteAccountPage() {
    const [password, setPassword] = useState("");
    const [confirmText, setConfirmText] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleDelete = async (e: React.FormEvent) => {
        e.preventDefault();
        if (confirmText !== "DELETE") {
            setError("Please type DELETE to confirm.");
            return;
        }
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/account/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to delete account.");
                setLoading(false);
                return;
            }

            // Sign out locally and redirect
            const supabase = createClient();
            await supabase.auth.signOut();
            router.push("/?account_deleted=true");
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Link
                href="/account"
                className="inline-flex items-center gap-2 text-ink-mute hover:text-accent text-sm font-medium mb-8"
            >
                <ArrowLeft size={16} /> Back to account
            </Link>

            <div className="bg-red-50 border border-red-100 rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-rose/10 flex items-center justify-center">
                        <AlertTriangle size={24} className="text-rose" />
                    </div>
                    <div>
                        <h1 className="font-display text-2xl text-ink">Delete your account</h1>
                        <p className="text-sm text-ink-mute">This action is permanent and cannot be undone.</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 mb-6 text-sm text-ink-soft space-y-2">
                    <p>When you delete your account:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Your profile and personal data will be permanently deleted.</li>
                        <li>Your order history will be anonymised (we must keep financial records for tax purposes, but your name, email, and address will be removed).</li>
                        <li>You will be signed out immediately.</li>
                        <li>This cannot be reversed.</li>
                    </ul>
                </div>

                {error && (
                    <div className="mb-5 bg-red-100 border border-red-200 text-rose px-4 py-3 rounded-xl text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleDelete} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">
                            Confirm your password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 border border-red-200 rounded-xl bg-white focus:outline-none focus:border-rose text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">
                            Type DELETE to confirm
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            required
                            placeholder="DELETE"
                            className="w-full px-4 py-3 border border-red-200 rounded-xl bg-white focus:outline-none focus:border-rose text-sm font-mono"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || confirmText !== "DELETE"}
                        className="w-full bg-rose text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-rose/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={16} />
                        ) : (
                            <Trash2 size={16} />
                        )}
                        Permanently delete my account
                    </button>
                </form>
            </div>
        </div>
    );
}
