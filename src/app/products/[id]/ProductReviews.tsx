"use client";

import { useState, useTransition } from "react";
import { submitReview } from "./review-actions";

interface Review {
    id: string;
    rating: number;
    body: string;
    created_at: string;
    user_id: string;
}

interface Props {
    productId: string;
    initialReviews: Review[];
    currentUserId: string | null;
}

function StarDisplay({ rating, max = 5 }: { rating: number; max?: number }) {
    return (
        <span className="text-haldi text-base leading-none" aria-label={`${rating} out of ${max} stars`}>
            {Array.from({ length: max }).map((_, i) => (
                <span key={i} className={i < rating ? "text-haldi" : "text-ink-mute opacity-30"}>
                    ★
                </span>
            ))}
        </span>
    );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    const [hovered, setHovered] = useState(0);
    return (
        <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
            {Array.from({ length: 5 }).map((_, i) => {
                const star = i + 1;
                const filled = star <= (hovered || value);
                return (
                    <button
                        key={star}
                        type="button"
                        role="radio"
                        aria-checked={value === star}
                        aria-label={`${star} star${star > 1 ? "s" : ""}`}
                        className={`text-3xl leading-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${filled ? "text-haldi" : "text-ink-mute opacity-30"}`}
                        onClick={() => onChange(star)}
                        onMouseEnter={() => setHovered(star)}
                        onMouseLeave={() => setHovered(0)}
                    >
                        ★
                    </button>
                );
            })}
        </div>
    );
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export default function ProductReviews({ productId, initialReviews, currentUserId }: Props) {
    const [reviews, setReviews] = useState<Review[]>(initialReviews);
    const [rating, setRating] = useState(0);
    const [body, setBody] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [isPending, startTransition] = useTransition();

    const userReview = currentUserId ? reviews.find((r) => r.user_id === currentUserId) : null;
    const hasReviewed = !!userReview;

    const handleEdit = () => {
        if (userReview) {
            setRating(userReview.rating);
            setBody(userReview.body);
            setEditing(true);
            setError(null);
            setSuccessMsg(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);

        if (rating < 1) {
            setError("Please select a star rating.");
            return;
        }
        if (body.trim().length < 10) {
            setError("Review must be at least 10 characters.");
            return;
        }

        startTransition(async () => {
            const result = await submitReview(productId, rating, body);
            if (!result.success) {
                setError(result.error ?? "Something went wrong.");
                return;
            }
            setSuccessMsg("Your review has been saved.");
            setEditing(false);
            // Optimistically update local state
            const now = new Date().toISOString();
            setReviews((prev) => {
                const without = prev.filter((r) => r.user_id !== currentUserId);
                return [
                    { id: "optimistic", rating, body: body.trim(), created_at: now, user_id: currentUserId! },
                    ...without,
                ];
            });
            setBody("");
            setRating(0);
        });
    };

    const showWriteForm = currentUserId && (!hasReviewed || editing);

    return (
        <section className="mt-16 pt-16 border-t border-cream-deep">
            <h2 className="font-display text-3xl text-ink mb-8">Customer Reviews</h2>

            {/* Reviews list */}
            {reviews.length === 0 && (
                <p className="text-ink-mute mb-8">Be the first to review this product.</p>
            )}
            {reviews.length > 0 && (
                <ul className="space-y-6 mb-10">
                    {reviews.map((review) => (
                        <li key={review.id} className="bg-cream-soft border border-cream-deep rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <StarDisplay rating={review.rating} />
                                <span className="text-xs text-ink-mute">{formatDate(review.created_at)}</span>
                                {currentUserId && review.user_id === currentUserId && (
                                    <span className="ml-auto text-xs font-semibold text-accent">Your review</span>
                                )}
                            </div>
                            <p className="text-sm text-ink leading-relaxed">{review.body}</p>
                            {currentUserId && review.user_id === currentUserId && !editing && (
                                <button
                                    onClick={handleEdit}
                                    className="mt-3 text-xs font-semibold text-accent hover:text-accent-deep underline underline-offset-2 transition-colors"
                                >
                                    Edit
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {/* Write / edit form */}
            {showWriteForm && (
                <div className="bg-cream-soft border border-cream-deep rounded-3xl p-6 sm:p-8">
                    <h3 className="font-display text-2xl text-ink mb-6">
                        {editing ? "Edit your review" : "Write a review"}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-widest text-ink-mute mb-2">
                                Your rating
                            </label>
                            <StarPicker value={rating} onChange={setRating} />
                        </div>
                        <div>
                            <label
                                htmlFor="review-body"
                                className="block text-xs font-semibold uppercase tracking-widest text-ink-mute mb-2"
                            >
                                Your review
                            </label>
                            <textarea
                                id="review-body"
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                minLength={10}
                                maxLength={1000}
                                rows={4}
                                placeholder="Share your experience with this product…"
                                className="w-full rounded-2xl border border-cream-deep bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-mute focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
                                required
                            />
                            <p className="text-xs text-ink-mute mt-1 text-right">
                                {body.length}/1000
                            </p>
                        </div>

                        {error && (
                            <p role="alert" className="text-sm text-rose font-medium">
                                {error}
                            </p>
                        )}

                        <div className="flex items-center gap-4">
                            <button
                                type="submit"
                                disabled={isPending}
                                className="btn-primary px-6 py-3 text-sm disabled:opacity-60"
                            >
                                {isPending ? "Saving…" : "Submit review"}
                            </button>
                            {editing && (
                                <button
                                    type="button"
                                    onClick={() => { setEditing(false); setError(null); }}
                                    className="text-sm text-ink-mute hover:text-ink transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            {/* Success message (shown when not editing) */}
            {successMsg && !showWriteForm && (
                <p className="text-sm font-semibold text-leaf mt-4">{successMsg}</p>
            )}

            {/* Prompt to log in */}
            {!currentUserId && (
                <p className="text-sm text-ink-mute mt-4">
                    <a href="/auth" className="text-accent font-semibold hover:underline">Sign in</a> to leave a review.
                </p>
            )}
        </section>
    );
}
