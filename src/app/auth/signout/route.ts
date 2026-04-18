import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/", request.url), { status: 302 });
}

// GET sign-out removed — prevents CSRF logout via <img src="/auth/signout">
