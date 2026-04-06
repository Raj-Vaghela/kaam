import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { storeConfig, InvoiceData } from "./invoice";

export function generateInvoicePDF(data: InvoiceData): Buffer {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header - Store Logo/Name
    doc.setFontSize(24);
    doc.setTextColor(5, 150, 105); // Emerald color
    doc.text(storeConfig.name, 20, 25);

    // Invoice Title
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139); // Slate color
    doc.text("TAX INVOICE", pageWidth - 20, 25, { align: "right" });

    // Invoice Number and Date
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text(`Invoice: ${data.invoiceNumber}`, pageWidth - 20, 35, { align: "right" });
    doc.text(`Date: ${data.date.toLocaleDateString("en-GB")}`, pageWidth - 20, 42, { align: "right" });

    // Store Details (Left)
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    let yPos = 45;
    doc.text("From:", 20, yPos);
    yPos += 5;
    doc.setTextColor(51, 65, 85);
    doc.text(storeConfig.name, 20, yPos);
    yPos += 4;
    doc.text(storeConfig.address.line1, 20, yPos);
    yPos += 4;
    if (storeConfig.address.line2) {
        doc.text(storeConfig.address.line2, 20, yPos);
        yPos += 4;
    }
    doc.text(`${storeConfig.address.city}, ${storeConfig.address.postcode}`, 20, yPos);
    yPos += 4;
    doc.text(storeConfig.address.country, 20, yPos);
    yPos += 6;
    doc.setTextColor(100, 116, 139);
    doc.text(`VAT No: ${storeConfig.vatNumber}`, 20, yPos);

    // Customer Details (Right)
    let customerY = 45;
    doc.setTextColor(100, 116, 139);
    doc.text("Bill To:", 110, customerY);
    customerY += 5;
    doc.setTextColor(51, 65, 85);
    doc.text(data.customerName, 110, customerY);
    customerY += 4;
    doc.text(data.billingAddress.line1, 110, customerY);
    customerY += 4;
    if (data.billingAddress.line2) {
        doc.text(data.billingAddress.line2, 110, customerY);
        customerY += 4;
    }
    doc.text(`${data.billingAddress.city}, ${data.billingAddress.postcode}`, 110, customerY);
    customerY += 6;
    doc.setTextColor(100, 116, 139);
    doc.text(data.customerEmail, 110, customerY);

    // Line Items Table
    const tableStartY = Math.max(yPos, customerY) + 15;

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
        theme: "striped",
        headStyles: {
            fillColor: [5, 150, 105],
            textColor: 255,
            fontStyle: "bold",
        },
        styles: {
            fontSize: 9,
            cellPadding: 4,
        },
        columnStyles: {
            0: { cellWidth: 90 },
            1: { cellWidth: 20, halign: "center" },
            2: { cellWidth: 35, halign: "right" },
            3: { cellWidth: 35, halign: "right" },
        },
    });

    // Get final Y position after table
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Totals Section
    const totalsX = 130;
    let totalsY = finalY;

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("Subtotal:", totalsX, totalsY);
    doc.setTextColor(51, 65, 85);
    doc.text(`£${data.subtotal.toFixed(2)}`, pageWidth - 20, totalsY, { align: "right" });

    totalsY += 6;
    doc.setTextColor(100, 116, 139);
    doc.text(`VAT (${data.vatRate}%):`, totalsX, totalsY);
    doc.setTextColor(51, 65, 85);
    doc.text(`£${data.vatAmount.toFixed(2)}`, pageWidth - 20, totalsY, { align: "right" });

    totalsY += 8;
    doc.setDrawColor(226, 232, 240);
    doc.line(totalsX, totalsY - 2, pageWidth - 20, totalsY - 2);

    doc.setFontSize(12);
    doc.setTextColor(5, 150, 105);
    doc.setFont("helvetica", "bold");
    doc.text("Total:", totalsX, totalsY + 4);
    doc.text(`£${data.total.toFixed(2)}`, pageWidth - 20, totalsY + 4, { align: "right" });

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    doc.text("Thank you for your order!", pageWidth / 2, footerY, { align: "center" });
    doc.text(
        `${storeConfig.website} | ${storeConfig.email} | ${storeConfig.phone}`,
        pageWidth / 2,
        footerY + 5,
        { align: "center" }
    );

    // Return as buffer
    return Buffer.from(doc.output("arraybuffer"));
}

// Generate invoice filename
export function getInvoiceFilename(invoiceNumber: string): string {
    return `${invoiceNumber.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`;
}
