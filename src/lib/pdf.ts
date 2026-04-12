import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { storeConfig, InvoiceData } from "./invoice";
import { BRAND } from "./brand";

// GajjuExpress brand RGB tuples
const TEAL: [number, number, number] = [31, 95, 107];
const TERRACOTTA: [number, number, number] = [198, 107, 61];
const INK: [number, number, number] = [26, 23, 20];
const INK_SOFT: [number, number, number] = [74, 66, 59];
const INK_MUTE: [number, number, number] = [138, 129, 120];
const CREAM_DEEP: [number, number, number] = [235, 227, 210];
const CREAM_SOFT: [number, number, number] = [250, 246, 236];

export function generateInvoicePDF(data: InvoiceData): Buffer {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Brand wordmark
    doc.setFontSize(26);
    doc.setTextColor(...TEAL);
    doc.setFont("helvetica", "bold");
    doc.text(BRAND.name, 20, 26);

    // Tagline
    doc.setFontSize(8);
    doc.setTextColor(...TERRACOTTA);
    doc.setFont("helvetica", "italic");
    doc.text(BRAND.taglineEn, 20, 32);

    // Invoice meta (right)
    doc.setFontSize(11);
    doc.setTextColor(...INK_MUTE);
    doc.setFont("helvetica", "normal");
    doc.text("TAX INVOICE", pageWidth - 20, 26, { align: "right" });

    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text(`Invoice: ${data.invoiceNumber}`, pageWidth - 20, 34, { align: "right" });
    doc.text(`Date: ${data.date.toLocaleDateString("en-GB")}`, pageWidth - 20, 40, { align: "right" });

    // Divider line
    doc.setDrawColor(...CREAM_DEEP);
    doc.setLineWidth(0.5);
    doc.line(20, 48, pageWidth - 20, 48);

    // From
    let yPos = 58;
    doc.setFontSize(8);
    doc.setTextColor(...INK_MUTE);
    doc.text("FROM", 20, yPos);
    yPos += 6;
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.text(storeConfig.name, 20, yPos);
    yPos += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...INK_SOFT);
    doc.text(storeConfig.address.line1, 20, yPos);
    yPos += 4;
    if (storeConfig.address.line2) {
        doc.text(storeConfig.address.line2, 20, yPos);
        yPos += 4;
    }
    doc.text(`${storeConfig.address.city}, ${storeConfig.address.postcode}`, 20, yPos);
    yPos += 4;
    doc.text(storeConfig.address.country, 20, yPos);
    yPos += 5;
    doc.setTextColor(...INK_MUTE);
    doc.setFontSize(8);
    doc.text(`VAT No: ${storeConfig.vatNumber}`, 20, yPos);

    // Bill to
    let customerY = 58;
    doc.setFontSize(8);
    doc.setTextColor(...INK_MUTE);
    doc.text("BILL TO", 110, customerY);
    customerY += 6;
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.text(data.customerName, 110, customerY);
    customerY += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...INK_SOFT);
    doc.text(data.billingAddress.line1, 110, customerY);
    customerY += 4;
    if (data.billingAddress.line2) {
        doc.text(data.billingAddress.line2, 110, customerY);
        customerY += 4;
    }
    doc.text(`${data.billingAddress.city}, ${data.billingAddress.postcode}`, 110, customerY);
    customerY += 5;
    doc.setTextColor(...INK_MUTE);
    doc.text(data.customerEmail, 110, customerY);

    // Line items
    const tableStartY = Math.max(yPos, customerY) + 12;

    const tableBody = data.items.map((item) => [
        item.name,
        item.quantity.toString(),
        `£${item.unitPrice.toFixed(2)}`,
        `£${item.total.toFixed(2)}`,
    ]);

    autoTable(doc, {
        startY: tableStartY,
        head: [["Description", "Qty", "Unit Price", "Total"]],
        body: tableBody,
        theme: "plain",
        headStyles: {
            fillColor: TEAL,
            textColor: 255,
            fontStyle: "bold",
            fontSize: 9,
            cellPadding: 5,
        },
        alternateRowStyles: { fillColor: CREAM_SOFT },
        styles: {
            fontSize: 9,
            cellPadding: 4.5,
            textColor: INK,
        },
        columnStyles: {
            0: { cellWidth: 90 },
            1: { cellWidth: 20, halign: "center" },
            2: { cellWidth: 35, halign: "right" },
            3: { cellWidth: 35, halign: "right" },
        },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Totals
    const totalsX = 130;
    let totalsY = finalY;

    doc.setFontSize(10);
    doc.setTextColor(...INK_MUTE);
    doc.setFont("helvetica", "normal");
    doc.text("Subtotal", totalsX, totalsY);
    doc.setTextColor(...INK);
    doc.text(`£${data.subtotal.toFixed(2)}`, pageWidth - 20, totalsY, { align: "right" });

    totalsY += 6;
    doc.setTextColor(...INK_MUTE);
    doc.text(`VAT (${data.vatRate}%)`, totalsX, totalsY);
    doc.setTextColor(...INK);
    doc.text(`£${data.vatAmount.toFixed(2)}`, pageWidth - 20, totalsY, { align: "right" });

    totalsY += 8;
    doc.setDrawColor(...CREAM_DEEP);
    doc.line(totalsX, totalsY - 2, pageWidth - 20, totalsY - 2);

    doc.setFontSize(13);
    doc.setTextColor(...TERRACOTTA);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL", totalsX, totalsY + 5);
    doc.text(`£${data.total.toFixed(2)}`, pageWidth - 20, totalsY + 5, { align: "right" });

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 22;
    doc.setDrawColor(...CREAM_DEEP);
    doc.line(20, footerY - 4, pageWidth - 20, footerY - 4);

    doc.setFontSize(9);
    doc.setTextColor(...TEAL);
    doc.setFont("helvetica", "italic");
    doc.text(BRAND.taglineEn, pageWidth / 2, footerY + 2, { align: "center" });

    doc.setFontSize(8);
    doc.setTextColor(...INK_MUTE);
    doc.setFont("helvetica", "normal");
    doc.text(
        `${storeConfig.website}  ·  ${storeConfig.email}  ·  ${storeConfig.phone}`,
        pageWidth / 2,
        footerY + 8,
        { align: "center" }
    );

    return Buffer.from(doc.output("arraybuffer"));
}

export function getInvoiceFilename(invoiceNumber: string): string {
    return `${invoiceNumber.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`;
}
