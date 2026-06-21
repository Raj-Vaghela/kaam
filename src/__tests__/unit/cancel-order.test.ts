/**
 * cancel-order.test.ts
 *
 * Verifies the customer self-cancel server action's status guards and
 * Stripe-call dispatch (refund vs. payment intent cancel). The action itself
 * is heavily mocked because its job is to orchestrate Supabase + Stripe + email
 * + audit — the meaningful unit-level behaviour is "which path does it take
 * for each input status, and does it refuse gracefully when it shouldn't run."
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const {
    mockGetUser,
    mockOrderSingle,
    mockUpdateMaybeSingle,
    mockRefundsCreate,
    mockPiCancel,
    mockPiRetrieve,
    mockRpc,
    mockSendCancellationEmail,
    mockLogSystemAction,
    mockRevalidatePath,
} = vi.hoisted(() => ({
    mockGetUser: vi.fn(),
    mockOrderSingle: vi.fn(),
    mockUpdateMaybeSingle: vi.fn().mockResolvedValue({ data: { id: "order-1" }, error: null }),
    mockRefundsCreate: vi.fn().mockResolvedValue({ id: "re_test" }),
    mockPiCancel: vi.fn().mockResolvedValue({ id: "pi_test", status: "canceled" }),
    mockPiRetrieve: vi.fn().mockResolvedValue({ id: "pi_test", latest_charge: "ch_test" }),
    mockRpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    mockSendCancellationEmail: vi.fn().mockResolvedValue({ success: true }),
    mockLogSystemAction: vi.fn().mockResolvedValue(undefined),
    mockRevalidatePath: vi.fn(),
}));

// Supabase server client (caller's session — used for auth + fetch).
vi.mock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue({
        auth: { getUser: mockGetUser },
        from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: mockOrderSingle,
        }),
    }),
}));

// Service-role client (privileged writes).
vi.mock("@supabase/supabase-js", () => ({
    createClient: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            maybeSingle: mockUpdateMaybeSingle,
        }),
        rpc: mockRpc,
    }),
}));

vi.mock("stripe", () => {
    class StripeMock {
        refunds = { create: mockRefundsCreate };
        paymentIntents = { cancel: mockPiCancel, retrieve: mockPiRetrieve };
    }
    return { default: StripeMock };
});

vi.mock("@/lib/email", () => ({
    sendOrderCancellationEmail: mockSendCancellationEmail,
}));

vi.mock("@/lib/audit", () => ({
    logSystemAction: mockLogSystemAction,
}));

vi.mock("next/cache", () => ({
    revalidatePath: mockRevalidatePath,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function authedUser() {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1", email: "buyer@example.com" } } });
}

function fakeOrder(status: string, extras: Record<string, unknown> = {}) {
    return {
        id: "order-1",
        status,
        total: 24.5,
        stripe_payment_intent_id: "pi_test",
        guest_email: null,
        shipping_address: { fullName: "Riya Patel" },
        order_items: [{ product_id: "prod-1", quantity: 2 }],
        ...extras,
    };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("cancelOrder", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset success defaults that vi.clearAllMocks wipes from the hoist.
        mockUpdateMaybeSingle.mockResolvedValue({ data: { id: "order-1" }, error: null });
        mockRefundsCreate.mockResolvedValue({ id: "re_test" });
        mockPiCancel.mockResolvedValue({ id: "pi_test", status: "canceled" });
        mockPiRetrieve.mockResolvedValue({ id: "pi_test", latest_charge: "ch_test" });
        mockRpc.mockResolvedValue({ data: null, error: null });
        mockSendCancellationEmail.mockResolvedValue({ success: true });
    });

    it("refuses when no user session", async () => {
        mockGetUser.mockResolvedValue({ data: { user: null } });

        const { cancelOrder } = await import("@/app/account/orders/cancelOrder");
        const res = await cancelOrder("order-1");
        expect(res.ok).toBe(false);
        expect(res.error).toMatch(/signed in/i);
    });

    it("refuses an empty orderId", async () => {
        authedUser();
        const { cancelOrder } = await import("@/app/account/orders/cancelOrder");
        const res = await cancelOrder("");
        expect(res.ok).toBe(false);
        expect(res.error).toMatch(/invalid/i);
    });

    it("refuses when order is not found", async () => {
        authedUser();
        mockOrderSingle.mockResolvedValue({ data: null, error: { message: "not found" } });

        const { cancelOrder } = await import("@/app/account/orders/cancelOrder");
        const res = await cancelOrder("order-1");
        expect(res.ok).toBe(false);
        expect(res.error).toMatch(/not found/i);
    });

    it("refuses when order is already shipped", async () => {
        authedUser();
        mockOrderSingle.mockResolvedValue({ data: fakeOrder("shipped"), error: null });

        const { cancelOrder } = await import("@/app/account/orders/cancelOrder");
        const res = await cancelOrder("order-1");
        expect(res.ok).toBe(false);
        expect(res.error).toMatch(/shipped/i);
        expect(mockRefundsCreate).not.toHaveBeenCalled();
        expect(mockPiCancel).not.toHaveBeenCalled();
    });

    it("refuses when order is already cancelled", async () => {
        authedUser();
        mockOrderSingle.mockResolvedValue({ data: fakeOrder("cancelled"), error: null });

        const { cancelOrder } = await import("@/app/account/orders/cancelOrder");
        const res = await cancelOrder("order-1");
        expect(res.ok).toBe(false);
        expect(res.error).toMatch(/already.+cancel/i);
    });

    it("issues a Stripe refund + restores stock when status is paid", async () => {
        authedUser();
        mockOrderSingle.mockResolvedValue({ data: fakeOrder("paid"), error: null });

        const { cancelOrder } = await import("@/app/account/orders/cancelOrder");
        const res = await cancelOrder("order-1");

        expect(res.ok).toBe(true);
        expect(res.paymentCaptured).toBe(true);
        expect(res.refundAmount).toBe(24.5);

        // Refund path was used; PI cancel was NOT.
        expect(mockRefundsCreate).toHaveBeenCalledOnce();
        expect(mockRefundsCreate).toHaveBeenCalledWith(
            expect.objectContaining({ charge: "ch_test", reason: "requested_by_customer" }),
            expect.objectContaining({ idempotencyKey: "cancel:order-1" })
        );
        expect(mockPiCancel).not.toHaveBeenCalled();

        // Stock restored.
        expect(mockRpc).toHaveBeenCalledWith(
            "increment_stock_batch",
            expect.objectContaining({
                p_items: [{ product_id: "prod-1", quantity: 2 }],
            })
        );

        // Email sent with paymentCaptured = true.
        expect(mockSendCancellationEmail).toHaveBeenCalledWith(
            expect.objectContaining({ paymentCaptured: true, refundAmount: 24.5 })
        );

        // Audit logged.
        expect(mockLogSystemAction).toHaveBeenCalledWith(
            expect.objectContaining({ action: "order.customer_cancelled", userId: "user-1" })
        );
    });

    it("cancels the payment intent (no refund, no stock change) when status is pending", async () => {
        authedUser();
        mockOrderSingle.mockResolvedValue({ data: fakeOrder("pending"), error: null });

        const { cancelOrder } = await import("@/app/account/orders/cancelOrder");
        const res = await cancelOrder("order-1");

        expect(res.ok).toBe(true);
        expect(res.paymentCaptured).toBe(false);

        // PI cancel path was used; refund was NOT.
        expect(mockPiCancel).toHaveBeenCalledOnce();
        expect(mockPiCancel).toHaveBeenCalledWith(
            "pi_test",
            expect.objectContaining({ cancellation_reason: "requested_by_customer" })
        );
        expect(mockRefundsCreate).not.toHaveBeenCalled();

        // No stock restoration for "pending" (it was never decremented).
        expect(mockRpc).not.toHaveBeenCalled();

        // Email sent with paymentCaptured = false.
        expect(mockSendCancellationEmail).toHaveBeenCalledWith(
            expect.objectContaining({ paymentCaptured: false })
        );
    });
});
