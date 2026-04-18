import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/security/rate-limit";

const ADMIN_LOGIN_LIMIT = 5;
const ADMIN_LOGIN_WINDOW = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
    const ip = getClientIp(request);
    const rl = rateLimit(`admin-login:${ip}`, ADMIN_LOGIN_LIMIT, ADMIN_LOGIN_WINDOW);

    if (!rl.allowed) {
        return NextResponse.json(
            { error: "Too many attempts. Try again later." },
            { status: 429 }
        );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
        return NextResponse.json({ error: "Invalid credentials." }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    // Check role — re-fetch after sign-in to get a valid session
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin" && profile?.role !== "staff") {
        // Sign out from this context — don't reveal that the account exists but isn't admin
        await supabase.auth.signOut();
        return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    return NextResponse.json({ success: true });
}
