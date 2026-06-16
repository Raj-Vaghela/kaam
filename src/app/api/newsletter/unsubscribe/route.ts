import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );
}

function appOrigin(req: NextRequest): string {
    return process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
}

async function unsubscribeByToken(token: string | null): Promise<{ ok: boolean }> {
    if (!token || token.length < 16) return { ok: false };
    const supabase = getServiceClient();
    const { error } = await supabase
        .from("newsletter_subscribers")
        .update({ unsubscribed_at: new Date().toISOString() })
        .eq("unsubscribe_token", token);
    if (error) {
        console.error("[newsletter/unsubscribe] db error:", error);
        return { ok: false };
    }
    return { ok: true };
}

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get("token");
    await unsubscribeByToken(token);
    // Always redirect to the same confirmation page — do not leak whether the
    // token matched a real row.
    return NextResponse.redirect(`${appOrigin(req)}/unsubscribe`);
}

// RFC 8058 one-click unsubscribe — mail clients POST to the List-Unsubscribe URL.
export async function POST(req: NextRequest) {
    const token = req.nextUrl.searchParams.get("token");
    await unsubscribeByToken(token);
    return NextResponse.json({ success: true });
}
