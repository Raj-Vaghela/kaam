import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { type Role } from "./roles";

interface AdminUser {
    id: string;
    email: string;
    role: Role;
}

/**
 * Server-side guard: requires the current user to have the 'admin' role.
 * Redirects to the retail store if not authenticated or not an admin.
 */
export async function requireAdmin(): Promise<AdminUser> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/admin/auth");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    const role = profile?.role as Role | undefined;

    if (role !== "admin") {
        // Non-admin users get silently redirected to the retail store.
        // No error message — no indication admin exists.
        redirect("/");
    }

    return { id: user.id, email: user.email!, role };
}

/**
 * Server-side guard: requires admin or staff role.
 */
export async function requireStaff(): Promise<AdminUser> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/admin/auth");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    const role = profile?.role as Role | undefined;

    if (role !== "admin" && role !== "staff") {
        redirect("/");
    }

    return { id: user.id, email: user.email!, role };
}

/**
 * Non-throwing check: returns the user's role or null.
 */
export async function getUserRole(userId: string): Promise<Role | null> {
    const supabase = await createClient();
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

    return (profile?.role as Role) ?? null;
}
