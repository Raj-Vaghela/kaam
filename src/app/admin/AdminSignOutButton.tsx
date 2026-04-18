"use client";

import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AdminSignOutButton() {
    const router = useRouter();

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/admin/auth");
    };

    return (
        <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 text-cream/60 hover:text-rose transition-colors w-full rounded-2xl"
        >
            <LogOut size={18} />
            <span className="font-medium text-sm">Sign Out</span>
        </button>
    );
}
