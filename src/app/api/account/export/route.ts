import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Fetch all user data
    const [profileResult, ordersResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase
            .from("orders")
            .select("*, order_items (*)")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
    ]);

    const exportData = {
        exported_at: new Date().toISOString(),
        account: {
            email: user.email,
            created_at: user.created_at,
        },
        profile: profileResult.data || null,
        orders: ordersResult.data || [],
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="my-data-${new Date().toISOString().slice(0, 10)}.json"`,
        },
    });
}
