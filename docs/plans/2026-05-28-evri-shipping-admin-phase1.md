# Plan: EVRI Shipping — Admin Label Generation (Phase 1)
Date: 2026-05-28
Goal: Add a "Generate Label" button to the admin order detail page that calls the Sendcloud API to create an EVRI shipment, storing the tracking number, tracking URL, and label PDF URL on the order.
Architecture: New `src/lib/shipping.ts` encapsulates all Sendcloud API calls. A new `generateShippingLabel` server action reads the order, calls the lib, and writes results back to the orders table. The admin order detail page renders a disabled button when env vars are absent, and a "Download Label" link once a label exists.
Tech Stack: Next.js server actions, Sendcloud REST API (HTTP Basic Auth), Supabase, TypeScript
Dependencies: Existing `orders` + `order_items` + `products` tables, existing `getAdminUser()` auth pattern, existing admin order detail page.

## File Map
| File | Action | Responsibility |
|------|--------|----------------|
| `supabase/migrations/20260528000001_add_label_url_to_orders.sql` | Create | Adds `label_url TEXT` column to `orders` table |
| `src/lib/shipping.ts` | Create | Sendcloud API — `createShipment()`, `isShippingConfigured()` |
| `src/app/admin/orders/actions.ts` | Modify | Add `generateShippingLabel(orderId)` server action |
| `src/app/admin/orders/[id]/page.tsx` | Modify | Add Generate/Download Label UI in the Tracking section |
| `.env.local.example` | Modify | Document three new env vars |

---

## Tasks

### Step 1 — DB migration
Create `supabase/migrations/20260528000001_add_label_url_to_orders.sql`:
```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS label_url TEXT;
```
Run it:
```bash
npx supabase db push
```
Expected: migration applies without error.

---

### Step 2 — Create `src/lib/shipping.ts`
Create the file with the following exact content:

```typescript
const SENDCLOUD_BASE = "https://panel.sendcloud.sc/api/v2";

export interface ShipmentResult {
  trackingNumber: string;
  trackingUrl: string;
  labelUrl: string;
}

export function isShippingConfigured(): boolean {
  return !!(
    process.env.SENDCLOUD_API_KEY &&
    process.env.SENDCLOUD_API_SECRET &&
    process.env.SENDCLOUD_SHIPPING_METHOD_ID
  );
}

export interface ShipmentInput {
  orderId: string;
  recipientName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  country: string;
  phone: string;
  weightKg: number;
}

export async function createShipment(input: ShipmentInput): Promise<ShipmentResult> {
  const key = process.env.SENDCLOUD_API_KEY!;
  const secret = process.env.SENDCLOUD_API_SECRET!;
  const methodId = Number(process.env.SENDCLOUD_SHIPPING_METHOD_ID!);

  const credentials = Buffer.from(`${key}:${secret}`).toString("base64");

  const body = {
    parcel: {
      name: input.recipientName,
      address: input.addressLine1,
      address_2: input.addressLine2 || "",
      city: input.city,
      postal_code: input.postcode,
      telephone: input.phone || "",
      country: { iso_2: input.country || "GB" },
      shipment: { id: methodId },
      weight: input.weightKg.toFixed(3),
      order_number: input.orderId,
      request_label: true,
    },
  };

  const res = await fetch(`${SENDCLOUD_BASE}/parcels`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sendcloud error ${res.status}: ${text}`);
  }

  const json = await res.json();
  const parcel = json.parcel;

  return {
    trackingNumber: parcel.tracking_number,
    trackingUrl: parcel.tracking_url,
    labelUrl: parcel.label?.normal_printer?.[0] ?? parcel.label?.label_printer?.[0] ?? "",
  };
}
```

---

### Step 3 — Add `generateShippingLabel` to `src/app/admin/orders/actions.ts`
Add this import at the top of the file (after the existing imports):
```typescript
import { createShipment, isShippingConfigured } from "@/lib/shipping";
```

Add this function at the end of the file:
```typescript
export async function generateShippingLabel(orderId: string): Promise<{ error?: string }> {
  if (!isShippingConfigured()) {
    return { error: "Shipping is not configured. Add SENDCLOUD_API_KEY, SENDCLOUD_API_SECRET, and SENDCLOUD_SHIPPING_METHOD_ID to your environment." };
  }

  const { supabase, authorized } = await getAdminUser();
  if (!authorized) return { error: "Unauthorised" };

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, shipping_address, order_items(quantity, products(weight_kg))")
    .eq("id", orderId)
    .single();

  if (orderError || !order) return { error: "Order not found" };

  const addr = order.shipping_address as {
    fullName?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    postcode?: string;
    country?: string;
  } | null;

  if (!addr?.addressLine1 || !addr?.city || !addr?.postcode) {
    return { error: "Order is missing a complete shipping address." };
  }

  // Sum weight across all items; fall back to 0.5 kg per item if weight is null
  const totalWeightKg = (order.order_items as Array<{ quantity: number; products: { weight_kg: number | null } | null }>).reduce(
    (sum, item) => sum + (item.products?.weight_kg ?? 0.5) * item.quantity,
    0
  );

  try {
    const result = await createShipment({
      orderId: order.id,
      recipientName: addr.fullName ?? "Customer",
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 ?? "",
      city: addr.city,
      postcode: addr.postcode,
      country: addr.country ?? "GB",
      phone: addr.phone ?? "",
      weightKg: Math.max(totalWeightKg, 0.1),
    });

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        tracking_number: result.trackingNumber,
        tracking_url: result.trackingUrl,
        label_url: result.labelUrl,
        status: "processing",
      })
      .eq("id", orderId);

    if (updateError) return { error: "Label created but failed to save to order." };

    const { logAdminAction } = await import("@/lib/audit");
    await logAdminAction(supabase, {
      action: "order:label_generated",
      resourceType: "order",
      resourceId: orderId,
      metadata: { trackingNumber: result.trackingNumber },
    });

    revalidatePath(`/admin/orders/${orderId}`);
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to generate label." };
  }
}
```

---

### Step 4 — Update the `OrderRow` interface in `src/app/admin/orders/[id]/page.tsx`
Find the `OrderRow` interface (line 41) and add `label_url`:
```typescript
interface OrderRow {
  id: string;
  status: string | null;
  total: number | null;
  created_at: string;
  guest_email: string | null;
  user_id: string | null;
  shipping_address: ShippingAddress | null;
  billing_address: ShippingAddress | null;
  tracking_number: string | null;
  tracking_url: string | null;
  label_url: string | null;      // ← add this line
  invoice_id: string | null;
  stripe_session_id: string | null;
  order_items: OrderItemRow[];
}
```

---

### Step 5 — Add the Generate/Download Label UI to the page
At the top of the page file add this import alongside the existing action imports:
```typescript
import { updateOrderStatus, updateOrderTracking, processRefund, rejectReturn, generateShippingLabel } from "../actions";
```

Also add at the top (after the `"use client"` equivalent — this is a server component so just add at the top-level):
```typescript
const shippingConfigured = !!(
  process.env.SENDCLOUD_API_KEY &&
  process.env.SENDCLOUD_API_SECRET &&
  process.env.SENDCLOUD_SHIPPING_METHOD_ID
);
```

This goes inside `AdminOrderDetailPage`, just before the `return` statement.

Now in the JSX, find the Tracking section (the `<div>` that starts at approximately line 222 with the Truck icon). **Replace** the entire tracking `<div>` block with:

```tsx
{/* Tracking */}
<div className="bg-cream-soft border border-cream-deep rounded-3xl p-6">
  <div className="flex items-center gap-2 mb-4">
    <Truck size={16} className="text-accent" />
    <h2 className="font-semibold text-ink text-sm uppercase tracking-wide">Shipping Label</h2>
  </div>

  {order.label_url ? (
    /* Label already generated — show download link */
    <div className="space-y-3">
      <p className="text-xs text-ink-mute">
        Label generated · tracking{" "}
        {order.tracking_url ? (
          <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="font-mono text-accent hover:underline">
            {order.tracking_number}
          </a>
        ) : (
          <span className="font-mono text-ink">{order.tracking_number}</span>
        )}
      </p>
      <a
        href={order.label_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[var(--gajju-teal-deep)] rounded-full hover:opacity-90 transition-opacity"
      >
        <FileText size={14} />
        Download Label
      </a>
    </div>
  ) : (
    /* No label yet — show generate button (disabled if not configured) */
    <div className="space-y-3">
      {!shippingConfigured && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl px-3 py-2">
          Shipping not configured. Add Sendcloud credentials to your environment to enable label generation.
        </p>
      )}
      <form
        action={async () => {
          "use server";
          await generateShippingLabel(order.id);
        }}
      >
        <button
          type="submit"
          disabled={!shippingConfigured}
          className="px-5 py-2.5 text-sm font-semibold text-white bg-[var(--gajju-teal-deep)] rounded-full hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Generate EVRI Label
        </button>
      </form>
    </div>
  )}

  {/* Manual tracking override (keep for edge cases) */}
  <details className="mt-5">
    <summary className="text-xs text-ink-mute cursor-pointer hover:text-ink">
      Manual tracking override
    </summary>
    <form action={updateOrderTracking} className="mt-3 space-y-3">
      <input type="hidden" name="orderId" value={order.id} />
      <div>
        <label className="block text-xs font-semibold text-ink-mute uppercase tracking-wide mb-1.5">
          Tracking Number
        </label>
        <input
          type="text"
          name="trackingNumber"
          defaultValue={order.tracking_number ?? ""}
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
          defaultValue={order.tracking_url ?? ""}
          placeholder="https://track.evri.com/..."
          className="w-full px-4 py-2.5 text-sm bg-cream border border-cream-deep rounded-2xl focus:outline-none focus:border-accent text-ink placeholder:text-ink-mute"
        />
      </div>
      <div className="flex justify-end pt-1">
        <button
          type="submit"
          className="px-5 py-2.5 text-sm font-semibold text-accent bg-accent-soft rounded-full hover:bg-accent hover:text-white transition-colors"
        >
          Save Tracking
        </button>
      </div>
    </form>
  </details>
</div>
```

---

### Step 6 — Update `.env.local.example`
Append to the file:
```
# Sendcloud (shipping label generation via EVRI)
# Sign up at sendcloud.com — no direct EVRI account needed
# Get keys from: Settings → Integrations → Sendcloud API
# Get the EVRI shipping method ID from: Shipping → Shipping Methods (hover EVRI Tracked row)
SENDCLOUD_API_KEY=
SENDCLOUD_API_SECRET=
SENDCLOUD_SHIPPING_METHOD_ID=
```

---

### Step 7 — TypeScript check
```bash
cd /Users/shinchan/Desktop/Projects/kaam && npx tsc --noEmit
```
Expected: no errors.

---

### Step 8 — Build check
```bash
cd /Users/shinchan/Desktop/Projects/kaam && npm run build
```
Expected: build completes successfully.

---

### Step 9 — Manual smoke test (without credentials)
1. Start dev server: `npm run dev`
2. Log in as admin, navigate to any order at `/admin/orders/[id]`
3. Confirm the "Shipping Label" panel shows the amber warning banner and the "Generate EVRI Label" button is visually disabled (greyed out, cursor not-allowed)
4. Confirm "Manual tracking override" `<details>` is present and expands correctly

---

## Notes for when Sendcloud credentials arrive
1. Add the three env vars to `.env.local` (and production environment)
2. In Sendcloud dashboard: Carriers → Enable Evri
3. Find the EVRI service method ID: Shipping → Shipping Methods → hover EVRI Tracked row → note the numeric ID (typically `159` for EVRI Tracked 48hr)
4. Set `SENDCLOUD_SHIPPING_METHOD_ID=159` (or whatever ID appears)
5. The "Generate EVRI Label" button will enable automatically — no code changes needed
