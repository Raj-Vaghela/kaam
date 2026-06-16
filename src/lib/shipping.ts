const SENDCLOUD_BASE = "https://panel.sendcloud.sc/api/v3";

export interface ShipmentResult {
  trackingNumber: string;
  trackingUrl: string;
  labelPdfBytes: Uint8Array;
  parcelId: number;
}

export interface ShipmentInput {
  orderId: string;
  recipientName: string;
  recipientEmail: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  country: string;
  phone: string;
  weightKg: number;
}

const REQUIRED_ENVS = [
  "SENDCLOUD_API_KEY",
  "SENDCLOUD_API_SECRET",
  "SENDCLOUD_SHIPPING_OPTION_CODE",
  "SENDCLOUD_CONTRACT_ID",
  "SENDER_NAME",
  "SENDER_ADDRESS_LINE_1",
  "SENDER_POSTCODE",
  "SENDER_CITY",
  "SENDER_COUNTRY",
] as const;

export function isShippingConfigured(): boolean {
  return REQUIRED_ENVS.every((k) => !!process.env[k]);
}

function authHeader(): string {
  const key = process.env.SENDCLOUD_API_KEY!;
  const secret = process.env.SENDCLOUD_API_SECRET!;
  return `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`;
}

export async function createShipment(input: ShipmentInput): Promise<ShipmentResult> {
  const body = {
    label_details: {
      mime_type: "application/pdf",
      dpi: 72,
    },
    to_address: {
      name: input.recipientName,
      address_line_1: input.addressLine1,
      ...(input.addressLine2 ? { address_line_2: input.addressLine2 } : {}),
      postal_code: input.postcode,
      city: input.city,
      country_code: input.country || "GB",
      phone_number: input.phone || "",
      ...(input.recipientEmail ? { email: input.recipientEmail } : {}),
    },
    from_address: {
      name: process.env.SENDER_NAME!,
      address_line_1: process.env.SENDER_ADDRESS_LINE_1!,
      ...(process.env.SENDER_ADDRESS_LINE_2
        ? { address_line_2: process.env.SENDER_ADDRESS_LINE_2 }
        : {}),
      postal_code: process.env.SENDER_POSTCODE!,
      city: process.env.SENDER_CITY!,
      country_code: process.env.SENDER_COUNTRY!,
      phone_number: process.env.SENDER_PHONE ?? "",
    },
    ship_with: {
      type: "shipping_option_code",
      properties: {
        shipping_option_code: process.env.SENDCLOUD_SHIPPING_OPTION_CODE!,
        contract_id: Number(process.env.SENDCLOUD_CONTRACT_ID!),
      },
    },
    order_number: input.orderId,
    parcels: [
      {
        weight: {
          value: input.weightKg.toFixed(3),
          unit: "kg",
        },
      },
    ],
  };

  const res = await fetch(`${SENDCLOUD_BASE}/shipments/announce`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sendcloud error ${res.status}: ${text}`);
  }

  const json = await res.json();
  const parcel = json.data?.parcels?.[0];
  if (!parcel) {
    throw new Error("Sendcloud response missing parcel data");
  }

  const errs = parcel.errors;
  if (Array.isArray(errs) && errs.length > 0) {
    throw new Error(`Sendcloud parcel error: ${JSON.stringify(errs)}`);
  }

  const labelLink = parcel.documents?.find(
    (d: { type: string; link: string }) => d.type === "label"
  )?.link;
  if (!labelLink) {
    throw new Error("Sendcloud response missing label link");
  }

  const labelRes = await fetch(labelLink, {
    headers: {
      Authorization: authHeader(),
      Accept: "application/pdf",
    },
  });

  if (!labelRes.ok) {
    const text = await labelRes.text();
    throw new Error(`Failed to download label PDF (${labelRes.status}): ${text}`);
  }

  const labelPdfBytes = new Uint8Array(await labelRes.arrayBuffer());

  return {
    trackingNumber: parcel.tracking_number,
    trackingUrl: parcel.tracking_url,
    labelPdfBytes,
    parcelId: parcel.id,
  };
}

export async function getSignedLabelUrl(
  labelPath: string | null,
  expiresInSeconds: number = 3600
): Promise<string | null> {
  if (!labelPath) return null;
  if (labelPath.startsWith("http")) return labelPath;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Cannot generate signed label URL without service role credentials."
    );
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  );

  const { data, error } = await supabase.storage
    .from("labels")
    .createSignedUrl(labelPath, expiresInSeconds);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
