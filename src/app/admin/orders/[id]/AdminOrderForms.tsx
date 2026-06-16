"use client";

import { useActionState } from "react";
import {
    updateOrderStatus,
    updateOrderTracking,
    processRefund,
    rejectReturn,
    type ActionResult,
} from "../actions";

const initialState: ActionResult | null = null;

function Feedback({ state }: { state: ActionResult | null }) {
    if (!state) return null;
    if (state.ok)
        return (
            <p role="status" className="text-xs text-emerald-700 mt-2">
                Saved.
            </p>
        );
    return (
        <p role="alert" className="text-xs text-rose-700 mt-2">
            {state.error}
        </p>
    );
}

interface StatusFormProps {
    orderId: string;
    currentStatus: string;
    options: { value: string; label: string }[];
}

export function UpdateStatusForm({ orderId, currentStatus, options }: StatusFormProps) {
    const [state, formAction, pending] = useActionState(
        async (_prev: ActionResult | null, formData: FormData) => updateOrderStatus(formData),
        initialState
    );
    return (
        <form action={formAction}>
            <div className="flex items-center gap-3">
                <input type="hidden" name="orderId" value={orderId} />
                <select
                    name="status"
                    defaultValue={currentStatus}
                    className="flex-1 px-4 py-2.5 text-sm bg-cream border border-cream-deep rounded-full focus:outline-none focus:border-accent text-ink"
                >
                    {options.map((s) => (
                        <option key={s.value} value={s.value}>
                            {s.label}
                        </option>
                    ))}
                </select>
                <button
                    type="submit"
                    disabled={pending}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-[var(--gajju-teal-deep)] rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {pending ? "Saving…" : "Update Status"}
                </button>
            </div>
            <Feedback state={state} />
        </form>
    );
}

interface TrackingFormProps {
    orderId: string;
    trackingNumber: string | null;
    trackingUrl: string | null;
}

export function UpdateTrackingForm({ orderId, trackingNumber, trackingUrl }: TrackingFormProps) {
    const [state, formAction, pending] = useActionState(
        async (_prev: ActionResult | null, formData: FormData) => updateOrderTracking(formData),
        initialState
    );
    return (
        <form action={formAction} className="mt-3 space-y-3">
            <input type="hidden" name="orderId" value={orderId} />
            <div>
                <label className="block text-xs font-semibold text-ink-mute uppercase tracking-wide mb-1.5">
                    Tracking Number
                </label>
                <input
                    type="text"
                    name="trackingNumber"
                    defaultValue={trackingNumber ?? ""}
                    placeholder="e.g. JD123456789GB"
                    className="w-full px-4 py-2.5 text-sm bg-cream border border-cream-deep rounded-2xl focus:outline-none focus:border-accent text-ink font-mono placeholder:font-sans placeholder:text-ink-mute"
                />
            </div>
            <div>
                <label className="block text-xs font-semibold text-ink-mute uppercase tracking-wide mb-1.5">
                    Tracking URL
                </label>
                <input
                    type="url"
                    name="trackingUrl"
                    defaultValue={trackingUrl ?? ""}
                    placeholder="https://track.evri.com/..."
                    className="w-full px-4 py-2.5 text-sm bg-cream border border-cream-deep rounded-2xl focus:outline-none focus:border-accent text-ink placeholder:text-ink-mute"
                />
            </div>
            <div className="flex justify-end pt-1">
                <button
                    type="submit"
                    disabled={pending}
                    className="px-5 py-2.5 text-sm font-semibold text-accent bg-accent-soft rounded-full hover:bg-accent hover:text-white transition-colors disabled:opacity-50"
                >
                    {pending ? "Saving…" : "Save Tracking"}
                </button>
            </div>
            <Feedback state={state} />
        </form>
    );
}

interface ReturnDecisionProps {
    orderId: string;
    returnRequestId: string;
}

export function ReturnDecisionButtons({ orderId, returnRequestId }: ReturnDecisionProps) {
    const [refundState, refundAction, refundPending] = useActionState(
        async (_prev: ActionResult | null, formData: FormData) => processRefund(formData),
        initialState
    );
    const [rejectState, rejectAction, rejectPending] = useActionState(
        async (_prev: ActionResult | null, formData: FormData) => rejectReturn(formData),
        initialState
    );
    const displayed = refundState ?? rejectState;
    return (
        <>
            <div className="flex items-center gap-3">
                <form action={refundAction}>
                    <input type="hidden" name="returnRequestId" value={returnRequestId} />
                    <input type="hidden" name="orderId" value={orderId} />
                    <button
                        type="submit"
                        disabled={refundPending || rejectPending}
                        className="px-5 py-2.5 text-sm font-semibold text-white bg-[var(--gajju-teal-deep)] rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {refundPending ? "Refunding…" : "Approve & Refund"}
                    </button>
                </form>
                <form action={rejectAction}>
                    <input type="hidden" name="returnRequestId" value={returnRequestId} />
                    <input type="hidden" name="orderId" value={orderId} />
                    <button
                        type="submit"
                        disabled={refundPending || rejectPending}
                        className="px-5 py-2.5 text-sm font-semibold text-rose-700 bg-rose-50 rounded-full hover:bg-rose-100 transition-colors disabled:opacity-50"
                    >
                        {rejectPending ? "Rejecting…" : "Reject"}
                    </button>
                </form>
            </div>
            <Feedback state={displayed} />
        </>
    );
}
