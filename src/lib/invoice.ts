import crypto from "crypto";
import { BRAND } from "./brand";

// VAT registration guard.
// If the business is not VAT-registered, or the VAT number is the placeholder,
// invoices must NOT display a VAT number or a VAT line item.
// Issuing a document with a fabricated VAT number is a criminal offence in the UK.
export const isVatRegistered =
    process.env.VAT_REGISTERED === "true" &&
    Boolean(process.env.VAT_NUMBER) &&
    process.env.VAT_NUMBER !== "PLACEHOLDER-UPDATE-BEFORE-GOLIVE";

// Store configuration for invoices — sourced from BRAND.
export const storeConfig = {
    name: BRAND.legalName,
    address: {
        line1: BRAND.address.line1,
        line2: BRAND.address.line2,
        city: BRAND.address.city,
        postcode: BRAND.address.postcode,
        country: BRAND.address.country,
    },
    // vatNumber is only set when the business is validly VAT-registered.
    // NOTE: pdf.ts should render the VAT number and VAT line conditionally based on this field.
    vatNumber: isVatRegistered ? (process.env.VAT_NUMBER as string) : undefined,
    vatRate: 20,
    email: BRAND.contact.ordersEmail,
    phone: BRAND.contact.phone,
    website: "https://gajjuexpress.co.uk",
};

// Invoice number generation (format: GJX-YYYYMM-XXXXXXXX)
// Uses 8 hex chars (~4 billion combinations per month) to prevent collisions.
// DB should also have a UNIQUE constraint on invoice_number as defense-in-depth.
function cryptoRandomHex(bytes: number): string {
    return crypto.randomBytes(bytes).toString("hex");
}

export function generateInvoiceNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `GJX-${year}${month}-${cryptoRandomHex(4).toUpperCase()}`;
}

export function generateCreditNoteNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `CN-${year}${month}-${cryptoRandomHex(4).toUpperCase()}`;
}

export interface InvoiceItem {
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface InvoiceData {
    invoiceNumber: string;
    date: Date;
    customerName: string;
    customerEmail: string;
    billingAddress: {
        line1: string;
        line2?: string;
        city: string;
        postcode: string;
    };
    items: InvoiceItem[];
    subtotal: number;
    vatRate: number;
    vatAmount: number;
    total: number;
    // True when isVatRegistered — instructs pdf.ts to render "VAT included" wording and
    // the vatNumber + vat line item. pdf.ts must check this field; if it does not yet do
    // so conditionally, add the check there (pdf.ts is out of scope for this change).
    isVatRegistered?: boolean;
}

/**
 * VAT-inclusive calculation — compliant with the UK Price Marking Order 2004.
 *
 * B2C prices displayed and charged to customers ARE the VAT-inclusive prices.
 * The `subtotal` parameter is the total customer-paid amount (VAT already inside).
 * We extract the VAT component from it rather than adding VAT on top.
 *
 * Formula:
 *   vatAmount  = subtotal - (subtotal / 1.20)   [for 20% standard rate]
 *   netAmount  = subtotal / 1.20
 *   total      = subtotal + deliveryFee          [delivery is also VAT-inclusive]
 *
 * When NOT VAT-registered, vatAmount and total are returned as-is (no VAT extraction).
 */
export function calculateVAT(
    subtotal: number,
    vatRate: number = storeConfig.vatRate
): { vatAmount: number; total: number; netAmount: number } {
    if (!isVatRegistered) {
        // Non-VAT-registered business: no VAT to extract or display.
        return {
            vatAmount: 0,
            netAmount: Math.round(subtotal * 100) / 100,
            total: Math.round(subtotal * 100) / 100,
        };
    }

    // VAT-inclusive extraction
    const divisor = 1 + vatRate / 100; // e.g. 1.20 for 20%
    const netAmount = subtotal / divisor;
    const vatAmount = subtotal - netAmount;

    return {
        vatAmount: Math.round(vatAmount * 100) / 100,
        netAmount: Math.round(netAmount * 100) / 100,
        total: Math.round(subtotal * 100) / 100,
    };
}
