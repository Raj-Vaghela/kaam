/**
 * Generates a sample invoice PDF for review.
 * Run with: node --experimental-vm-modules scripts/generate-sample-invoice.mjs
 * Or via the package.json script: npm run sample-invoice
 *
 * Output: /tmp/gajjuexpress-sample-invoice.pdf
 */

import { createRequire } from "module";
import { writeFileSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Load jsPDF and autotable (CJS bundles)
const jsPDFLib  = require("/Users/shinchan/Desktop/Projects/kaam/node_modules/jspdf/dist/jspdf.node.js");
const jsPDF     = jsPDFLib.jsPDF;
const { applyPlugin } = require("/Users/shinchan/Desktop/Projects/kaam/node_modules/jspdf-autotable/dist/jspdf.plugin.autotable.js");
applyPlugin(jsPDF);

// ── Logo ───────────────────────────────────────────────────────────────────
const LOGO_B64 = readFileSync(
  path.join(__dirname, "../public/gajjuexpress-logo-h.png")
).toString("base64");

// ── Brand colours ──────────────────────────────────────────────────────────
const TEAL        = [31,  95,  107];
const TERRACOTTA  = [198, 107,  61];
const INK         = [26,   23,  20];
const INK_SOFT    = [74,   66,  59];
const INK_MUTE    = [138, 129, 120];
const CREAM_DEEP  = [235, 227, 210];
const CREAM_SOFT  = [250, 246, 236];

// ── Sample data ────────────────────────────────────────────────────────────
const STORE = {
  name:    "GajjuExpress Ltd",
  line1:   "47 Wembley High Road",
  line2:   "Unit B",
  city:    "London",
  postcode:"HA9 7QU",
  country: "United Kingdom",
  vatNo:   "GB 123 4567 89",        // ← replace with real VAT number
  email:   "orders@gajjuexpress.co.uk",
  phone:   "+44 20 7946 0123",
  website: "https://gajjuexpress.co.uk",
  tagline: "Home-grown flavours. One click away.",
};

const INVOICE = {
  number:  "GJX-202604-A3F2C1B9",
  date:    new Date("2026-04-19"),
  customer: {
    name:    "Priya Patel",
    email:   "priya.patel@example.co.uk",
    line1:   "12 Coronation Road",
    line2:   "",
    city:    "Birmingham",
    postcode:"B21 9HX",
  },
  items: [
    { name: "Aashirvaad Whole Wheat Atta (10kg)",  qty: 2, unitPrice: 9.99  },
    { name: "MDH Deggi Mirch (100g)",               qty: 3, unitPrice: 1.99  },
    { name: "Amul Pure Ghee (1L)",                  qty: 1, unitPrice: 6.50  },
    { name: "Haldiram's Bhujia Sev (400g)",         qty: 4, unitPrice: 2.00  },
    { name: "Tata Gold Tea Premium (1kg)",           qty: 1, unitPrice: 4.00  },
    { name: "Royal Basmati Rice Extra Long (5kg)",  qty: 1, unitPrice: 10.00 },
  ],
  deliveryFee: 0,          // free — order over £40
  vatRate:     20,
  promoCode:   "WELCOME10",
  discount:    10.00,
};

// ── Calculations ───────────────────────────────────────────────────────────
const lineItems = INVOICE.items.map(i => ({ ...i, total: i.qty * i.unitPrice }));
const subtotal  = lineItems.reduce((s, i) => s + i.total, 0);
const discounted = subtotal - INVOICE.discount + INVOICE.deliveryFee;
const vatAmount  = Math.round(discounted * (INVOICE.vatRate / 100) * 100) / 100;
const total      = Math.round((discounted + vatAmount) * 100) / 100;

// ── Build PDF ──────────────────────────────────────────────────────────────
const doc    = new jsPDF();
const pgW    = doc.internal.pageSize.getWidth();

// Logo image — horizontal variant, ~50mm wide, proportional height
const LOGO_W = 52;
const LOGO_H = 14; // horizontal logo is ~3.7:1 ratio
doc.addImage(LOGO_B64, "PNG", 20, 16, LOGO_W, LOGO_H);

// Invoice meta (right)
doc.setFontSize(11);
doc.setTextColor(...INK_MUTE);
doc.setFont("helvetica", "normal");
doc.text("TAX INVOICE", pgW - 20, 26, { align: "right" });
doc.setFontSize(9);
doc.setTextColor(...INK);
doc.text(`Invoice: ${INVOICE.number}`,             pgW - 20, 34, { align: "right" });
doc.text(`Date: ${INVOICE.date.toLocaleDateString("en-GB")}`, pgW - 20, 40, { align: "right" });

// Divider
doc.setDrawColor(...CREAM_DEEP);
doc.setLineWidth(0.5);
doc.line(20, 48, pgW - 20, 48);

// FROM
let y = 58;
doc.setFontSize(8); doc.setTextColor(...INK_MUTE); doc.text("FROM", 20, y);
y += 6;
doc.setFont("helvetica", "bold");   doc.setTextColor(...INK);      doc.text(STORE.name, 20, y);
y += 5;
doc.setFont("helvetica", "normal"); doc.setTextColor(...INK_SOFT);
doc.text(STORE.line1,                            20, y); y += 4;
doc.text(STORE.line2,                            20, y); y += 4;
doc.text(`${STORE.city}, ${STORE.postcode}`,     20, y); y += 4;
doc.text(STORE.country,                          20, y); y += 5;
doc.setTextColor(...INK_MUTE);
doc.text(`VAT No: ${STORE.vatNo}`,               20, y);

// BILL TO
let cy = 58;
doc.setFontSize(8); doc.setTextColor(...INK_MUTE); doc.text("BILL TO", 110, cy);
cy += 6;
doc.setFont("helvetica", "bold");   doc.setTextColor(...INK);
doc.text(INVOICE.customer.name, 110, cy); cy += 5;
doc.setFont("helvetica", "normal"); doc.setTextColor(...INK_SOFT);
doc.text(INVOICE.customer.line1, 110, cy); cy += 4;
if (INVOICE.customer.line2) { doc.text(INVOICE.customer.line2, 110, cy); cy += 4; }
doc.text(`${INVOICE.customer.city}, ${INVOICE.customer.postcode}`, 110, cy); cy += 5;
doc.setTextColor(...INK_MUTE);
doc.text(INVOICE.customer.email, 110, cy);

// Line items table
const tableStartY = Math.max(y, cy) + 12;

doc.autoTable({
  startY:     tableStartY,
  margin:     { left: 20, right: 20 },
  head:       [["Description", "Qty", "Unit Price", "Total"]],
  body:       lineItems.map(i => [
                i.name,
                i.qty.toString(),
                `£${i.unitPrice.toFixed(2)}`,
                `£${i.total.toFixed(2)}`,
              ]),
  theme:      "plain",
  headStyles: { fillColor: TEAL, textColor: 255, fontStyle: "bold", fontSize: 9, cellPadding: 5 },
  alternateRowStyles: { fillColor: CREAM_SOFT },
  styles:     { fontSize: 9, cellPadding: 4.5, textColor: INK },
  columnStyles: {
    0: { cellWidth: "auto" },
    1: { cellWidth: 18, halign: "center" },
    2: { cellWidth: 32, halign: "right" },
    3: { cellWidth: 32, halign: "right" },
  },
});

// Totals block
const finalY  = doc.lastAutoTable.finalY + 10;
const totalsX = 120;
let ty = finalY;

const row = (label, value, muted = true) => {
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...(muted ? INK_MUTE : INK));
  doc.text(label, totalsX, ty);
  doc.setTextColor(...INK);
  doc.text(value, pgW - 20, ty, { align: "right" });
  ty += 6;
};

row("Subtotal",                                 `£${subtotal.toFixed(2)}`);
if (INVOICE.discount > 0) {
  doc.setTextColor(80, 160, 80);
  doc.text(`Discount (${INVOICE.promoCode})`,  totalsX, ty);
  doc.setTextColor(80, 160, 80);
  doc.text(`-£${INVOICE.discount.toFixed(2)}`, pgW - 20, ty, { align: "right" });
  ty += 6;
}
row("Delivery",    INVOICE.deliveryFee === 0 ? "FREE" : `£${INVOICE.deliveryFee.toFixed(2)}`);
row(`VAT (${INVOICE.vatRate}%)`, `£${vatAmount.toFixed(2)}`);

// Total divider
doc.setDrawColor(...CREAM_DEEP);
doc.line(totalsX, ty - 2, pgW - 20, ty - 2);
doc.setFontSize(13);
doc.setTextColor(...TERRACOTTA);
doc.setFont("helvetica", "bold");
doc.text("TOTAL",              totalsX,   ty + 5);
doc.text(`£${total.toFixed(2)}`, pgW - 20, ty + 5, { align: "right" });

// Footer
const footerY = doc.internal.pageSize.getHeight() - 22;
doc.setDrawColor(...CREAM_DEEP);
doc.line(20, footerY - 4, pgW - 20, footerY - 4);
doc.setFontSize(9); doc.setTextColor(...TEAL); doc.setFont("helvetica", "italic");
doc.text(STORE.tagline, pgW / 2, footerY + 2, { align: "center" });
doc.setFontSize(8); doc.setTextColor(...INK_MUTE); doc.setFont("helvetica", "normal");
doc.text(`${STORE.website}  ·  ${STORE.email}  ·  ${STORE.phone}`, pgW / 2, footerY + 8, { align: "center" });

// ── Save ───────────────────────────────────────────────────────────────────
const outPath = "/tmp/gajjuexpress-sample-invoice.pdf";
writeFileSync(outPath, Buffer.from(doc.output("arraybuffer")));
console.log(`✓ Sample invoice written to ${outPath}`);
console.log(`  Invoice:  ${INVOICE.number}`);
console.log(`  Customer: ${INVOICE.customer.name}`);
console.log(`  Total:    £${total.toFixed(2)}`);
