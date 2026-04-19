export type Role = "admin" | "staff" | "customer";

export type Permission =
    | "products:write"
    | "products:delete"
    | "orders:manage"
    | "invoices:read"
    | "invoices:resend"
    | "settings:write"
    | "audit:read";

const PERMISSIONS: Record<Role, Permission[]> = {
    admin: [
        "products:write",
        "products:delete",
        "orders:manage",
        "invoices:read",
        "invoices:resend",
        "settings:write",
        "audit:read",
    ],
    staff: ["orders:manage"],
    customer: [],
};

export function hasPermission(role: Role, permission: Permission): boolean {
    return PERMISSIONS[role]?.includes(permission) ?? false;
}

export function isAdminOrStaff(role: string | null | undefined): boolean {
    return role === "admin" || role === "staff";
}

export function isAdmin(role: string | null | undefined): boolean {
    return role === "admin";
}
