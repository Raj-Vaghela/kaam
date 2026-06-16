"use client";

import { useActionState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { generateShippingLabel, ActionResult } from "../actions";

interface Props {
  orderId: string;
  labelUrl: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  shippingConfigured: boolean;
}

const initialState: ActionResult = { ok: true };

export default function GenerateLabelButton({
  orderId,
  labelUrl,
  trackingNumber,
  trackingUrl,
  shippingConfigured,
}: Props) {
  const [state, action, pending] = useActionState(
    async (_prev: ActionResult): Promise<ActionResult> => {
      return await generateShippingLabel(orderId);
    },
    initialState
  );

  if (labelUrl) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-ink-mute">
          Label generated · tracking{" "}
          {trackingUrl ? (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-accent hover:underline"
            >
              {trackingNumber}
            </a>
          ) : (
            <span className="font-mono text-ink">{trackingNumber}</span>
          )}
        </p>
        <a
          href={labelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[var(--gajju-teal-deep)] rounded-full hover:opacity-90 transition-opacity"
        >
          <FileText size={14} />
          Download Label
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!shippingConfigured && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl px-3 py-2">
          Shipping not configured. Add Sendcloud credentials to your environment.
        </p>
      )}
      {!state.ok && state.error && (
        <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl px-3 py-2">
          {state.error}
        </p>
      )}
      {state.ok && (state as { ok: true; data?: unknown }).data !== undefined && (
        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-2xl px-3 py-2">
          Label generated successfully.
        </p>
      )}
      <form action={action}>
        <button
          type="submit"
          disabled={!shippingConfigured || pending}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[var(--gajju-teal-deep)] rounded-full hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pending && <Loader2 size={14} className="animate-spin" />}
          {pending ? "Generating…" : "Generate EVRI Label"}
        </button>
      </form>
    </div>
  );
}
