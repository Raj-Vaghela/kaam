import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { FileText, Download, Mail, Search, ArrowLeft, Calendar, User } from "lucide-react";

export default async function AdminInvoicesPage() {
    const supabase = await createClient();

    // Fetch all invoices with order details
    const { data: invoices, error } = await supabase
        .from("invoices")
        .select(`
            *,
            orders (
                id,
                status,
                guest_email,
                user_id
            )
        `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Failed to fetch invoices:", error);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
                    <p className="text-sm text-slate-500">
                        View and manage all invoices
                    </p>
                </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Invoice
                            </th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Customer
                            </th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Date
                            </th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Total
                            </th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Type
                            </th>
                            <th className="text-right px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {invoices && invoices.length > 0 ? (
                            invoices.map((invoice: any) => (
                                <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                                <FileText size={20} className="text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">
                                                    {invoice.invoice_number}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    Order #{invoice.order_id?.slice(0, 8).toUpperCase()}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium text-slate-900">
                                                {invoice.customer_name}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {invoice.customer_email}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-slate-600 text-sm">
                                            <Calendar size={14} />
                                            {new Date(invoice.created_at).toLocaleDateString("en-GB", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-slate-900">
                                            £{invoice.total.toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${invoice.orders?.user_id
                                                    ? "bg-blue-100 text-blue-700"
                                                    : "bg-amber-100 text-amber-700"
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
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                                                >
                                                    <Download size={14} />
                                                    PDF
                                                </a>
                                            )}
                                            <form action={`/api/admin/resend-invoice`} method="POST">
                                                <input type="hidden" name="invoiceId" value={invoice.id} />
                                                <button
                                                    type="submit"
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                                                >
                                                    <Mail size={14} />
                                                    Resend
                                                </button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <FileText size={40} className="mx-auto text-slate-300 mb-3" />
                                    <p className="text-slate-500">No invoices yet</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
