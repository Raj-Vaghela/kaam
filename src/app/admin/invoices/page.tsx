import { createClient } from "@/lib/supabase/server";
import { FileText, Download, Mail, Calendar, User } from "lucide-react";

export default async function AdminInvoicesPage() {
    const supabase = await createClient();

    const { data: invoices, error } = await supabase
        .from("invoices")
        .select(`*, orders ( id, status, guest_email, user_id )`)
        .order("created_at", { ascending: false });

    if (error) console.error("Failed to fetch invoices:", error);

    return (
        <div>
            <div className="mb-10">
                <h1 className="font-display text-5xl text-ink mb-2">Invoices</h1>
                <p className="text-ink-mute">Every receipt, in one place.</p>
            </div>

            <div className="bg-cream-soft border border-cream-deep rounded-3xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-cream text-ink-mute text-xs font-semibold uppercase tracking-wider">
                        <tr>
                            <th className="text-left px-6 py-4">Invoice</th>
                            <th className="text-left px-6 py-4">Customer</th>
                            <th className="text-left px-6 py-4">Date</th>
                            <th className="text-left px-6 py-4">Total</th>
                            <th className="text-left px-6 py-4">Type</th>
                            <th className="text-right px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-deep">
                        {invoices && invoices.length > 0 ? (
                            invoices.map((invoice: any) => (
                                <tr key={invoice.id} className="hover:bg-cream/60 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 bg-accent-soft rounded-2xl flex items-center justify-center">
                                                <FileText size={18} className="text-accent" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-ink">{invoice.invoice_number}</p>
                                                <p className="text-xs text-ink-mute">
                                                    Order #{invoice.order_id?.slice(0, 8).toUpperCase()}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-ink">{invoice.customer_name}</p>
                                        <p className="text-xs text-ink-mute">{invoice.customer_email}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-ink-soft">
                                            <Calendar size={14} className="text-ink-mute" />
                                            {new Date(invoice.created_at).toLocaleDateString("en-GB", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-semibold text-ink">£{invoice.total.toFixed(2)}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                                                invoice.orders?.user_id
                                                    ? "bg-leaf-soft text-leaf"
                                                    : "bg-haldi/20 text-ink"
                                            }`}
                                        >
                                            <User size={12} />
                                            {invoice.orders?.user_id ? "Account" : "Guest"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            {invoice.pdf_url && (
                                                <a
                                                    href={invoice.pdf_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-accent bg-accent-soft rounded-full hover:bg-accent hover:text-white transition-colors"
                                                >
                                                    <Download size={14} /> PDF
                                                </a>
                                            )}
                                            <form action={`/api/admin/resend-invoice`} method="POST">
                                                <input type="hidden" name="invoiceId" value={invoice.id} />
                                                <button
                                                    type="submit"
                                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-ink-soft bg-cream rounded-full hover:bg-cream-deep transition-colors"
                                                >
                                                    <Mail size={14} /> Resend
                                                </button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-16 text-center">
                                    <FileText size={40} className="mx-auto text-cream-deep mb-3" />
                                    <p className="text-ink-mute">No invoices yet</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
