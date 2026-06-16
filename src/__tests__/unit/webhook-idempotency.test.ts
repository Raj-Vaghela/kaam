/**
 * webhook-idempotency.test.ts
 *
 * Verifies that the Stripe webhook handler returns 200 without re-running side-effects
 * when the same event ID is delivered a second time (Stripe retry behaviour).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Hoisted mocks — must be declared before any imports that use them.
// ---------------------------------------------------------------------------
const { mockInsert, mockStripeConstruct } = vi.hoisted(() => {
    const mockInsert = vi.fn();
    const mockStripeConstruct = vi.fn();
    return { mockInsert, mockStripeConstruct };
});

// Mock Stripe so constructEvent returns a deterministic event without needing
// a real signature.
vi.mock("stripe", () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            webhooks: {
                constructEvent: mockStripeConstruct,
            },
            paymentIntents: { retrieve: vi.fn() },
            charges: { retrieve: vi.fn() },
        })),
    };
});

// Mock Supabase service-role client used inside the route.
vi.mock("@supabase/supabase-js", () => ({
    createClient: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
            insert: mockInsert,
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
        storage: {
            from: vi.fn().mockReturnValue({
                upload: vi.fn().mockResolvedValue({ error: null }),
                createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: "https://example.com/invoice.pdf" }, error: null }),
            }),
        },
    }),
}));

// Mock email and PDF generation to avoid side-effects.
vi.mock("@/lib/email", () => ({
    sendOrderConfirmation: vi.fn().mockResolvedValue({ success: true }),
    sendAdminDisputeAlert: vi.fn().mockResolvedValue({ success: true }),
    sendRefundConfirmationEmail: vi.fn().mockResolvedValue({ success: true }),
    sendPaymentProcessingEmail: vi.fn().mockResolvedValue({ success: true }),
}));
vi.mock("@/lib/pdf", () => ({
    generateInvoicePDF: vi.fn().mockReturnValue(Buffer.from("pdf")),
    getInvoiceFilename: vi.fn().mockReturnValue("invoice.pdf"),
}));
vi.mock("@/lib/invoice", () => ({
    generateInvoiceNumber: vi.fn().mockReturnValue("GJX-202506-ABCD1234"),
    storeConfig: { vatRate: 20 },
    calculateVAT: vi.fn().mockReturnValue({ vatAmount: 1.67, total: 10, netAmount: 8.33 }),
    isVatRegistered: false,
}));
// Mock next/server `after` to run the callback synchronously in tests
vi.mock("next/server", async (importOriginal) => {
    const actual = await importOriginal<typeof import("next/server")>();
    return {
        ...actual,
        after: vi.fn((fn: () => void) => fn()),
    };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRequest(body: string, signature = "t=1,v1=abc") {
    return new NextRequest("http://localhost/api/webhooks/stripe", {
        method: "POST",
        headers: {
            "stripe-signature": signature,
            "content-type": "text/plain",
        },
        body,
    });
}

const FAKE_EVENT = {
    id: "evt_test_dedup_001",
    type: "payment_intent.canceled",
    data: {
        object: {
            id: "pi_test_001",
            object: "payment_intent",
            metadata: { order_id: "order-uuid-001", guest_token: "" },
        },
    },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("Stripe webhook idempotency", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default: constructEvent returns our fake event
        mockStripeConstruct.mockReturnValue(FAKE_EVENT);
    });

    it("processes the event normally on first delivery", async () => {
        // Simulate a fresh insert (no conflict)
        mockInsert.mockResolvedValueOnce({ error: null });

        const { POST } = await import("@/app/api/webhooks/stripe/route");
        const res = await POST(makeRequest(JSON.stringify(FAKE_EVENT)));

        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.received).toBe(true);
        // Insert was called once to record the event
        expect(mockInsert).toHaveBeenCalledTimes(1);
    });

    it("returns 200 without re-processing on duplicate event delivery", async () => {
        // Simulate Postgres unique-violation (code 23505) indicating duplicate
        mockInsert.mockResolvedValueOnce({
            error: { code: "23505", message: "duplicate key value violates unique constraint" },
        });

        const { POST } = await import("@/app/api/webhooks/stripe/route");
        const res = await POST(makeRequest(JSON.stringify(FAKE_EVENT)));

        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.received).toBe(true);

        // Only one insert attempt — no further DB writes for side-effects
        expect(mockInsert).toHaveBeenCalledTimes(1);
    });

    it("returns 400 when stripe-signature is missing", async () => {
        const req = new NextRequest("http://localhost/api/webhooks/stripe", {
            method: "POST",
            body: "{}",
        });
        const { POST } = await import("@/app/api/webhooks/stripe/route");
        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it("returns 400 when signature verification fails", async () => {
        mockStripeConstruct.mockImplementationOnce(() => {
            throw new Error("No signatures found matching the expected signature for payload");
        });
        const { POST } = await import("@/app/api/webhooks/stripe/route");
        const res = await POST(makeRequest("{}", "invalid-sig"));
        expect(res.status).toBe(400);
    });
});
