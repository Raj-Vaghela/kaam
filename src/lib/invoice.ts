import crypto from "crypto";
import { BRAND } from "./brand";

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
    // TODO: Replace with the client's actual VAT number before go-live.
    // Issuing invoices with a fabricated VAT number is a UK legal offence.
    // If the business is not VAT-registered, remove vatNumber, vatRate, and
    // the VAT line items from the PDF template and calculateVAT call entirely.
    vatNumber: process.env.VAT_NUMBER || "PLACEHOLDER-UPDATE-BEFORE-GOLIVE",
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
}

export function calculateVAT(
    subtotal: number,
    vatRate: number = storeConfig.vatRate
): { vatAmount: number; total: number } {
    const vatAmount = subtotal * (vatRate / 100);
    const total = subtotal + vatAmount;
    return {
        vatAmount: Math.round(vatAmount * 100) / 100,
        total: Math.round(total * 100) / 100,
    };
}
