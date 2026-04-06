// Store configuration for invoices
export const storeConfig = {
    name: "DesiMart Ltd",
    address: {
        line1: "123 Spice Lane",
        line2: "Brick Lane",
        city: "London",
        postcode: "E1 6QL",
        country: "United Kingdom",
    },
    vatNumber: "GB123456789",
    vatRate: 20, // 20% VAT
    email: "orders@desimart.co.uk",
    phone: "+44 20 1234 5678",
    website: "https://desimart.co.uk",
};

// Invoice number generation (format: INV-YYYYMM-XXXXX)
export function generateInvoiceNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const random = Math.floor(Math.random() * 99999)
        .toString()
        .padStart(5, "0");
    return `INV-${year}${month}-${random}`;
}

// Credit note number generation (format: CN-YYYYMM-XXXXX)
export function generateCreditNoteNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const random = Math.floor(Math.random() * 99999)
        .toString()
        .padStart(5, "0");
    return `CN-${year}${month}-${random}`;
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

// Calculate VAT from subtotal
export function calculateVAT(subtotal: number, vatRate: number = storeConfig.vatRate): { vatAmount: number; total: number } {
    const vatAmount = subtotal * (vatRate / 100);
    const total = subtotal + vatAmount;
    return {
        vatAmount: Math.round(vatAmount * 100) / 100,
        total: Math.round(total * 100) / 100,
    };
}
