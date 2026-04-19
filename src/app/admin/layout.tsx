import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, Package, FileText, Shield, Users } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { requireAdmin } from "@/lib/auth/admin";
import AdminSignOutButton from "./AdminSignOutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    // Server-side role gate — redirects non-admins silently
    await requireAdmin();

    const links = [
        { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
        { href: "/admin/products", icon: Package, label: "Products" },
        { href: "/admin/invoices", icon: FileText, label: "Invoices" },
        { href: "/admin/users", icon: Users, label: "Users" },
        { href: "/admin/audit-log", icon: Shield, label: "Audit Log" },
    ];

    return (
        <div className="min-h-screen bg-cream flex font-sans text-ink">
            <aside className="w-64 bg-[var(--gajju-teal-deep)] text-cream flex flex-col fixed inset-y-0 left-0 z-50">
                <div className="p-6 border-b border-white/10">
                    <Image
                        src={BRAND.logo.horizontalWhite}
                        alt={BRAND.name}
                        width={170}
                        height={44}
                    />
                    <p className="text-[10px] uppercase tracking-widest text-haldi mt-2">Admin Console</p>
                </div>

                <nav className="flex-1 p-3 space-y-1">
                    {links.map(({ href, icon: Icon, label }) => (
                        <Link
                            key={href}
                            href={href}
                            className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-cream/70 hover:bg-white/5 hover:text-cream"
                        >
                            <Icon size={18} />
                            <span className="font-medium text-sm">{label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-3 border-t border-white/10">
                    <AdminSignOutButton />
                </div>
            </aside>

            <main className="flex-1 ml-64 p-10">{children}</main>
        </div>
    );
}
