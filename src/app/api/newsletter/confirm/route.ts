import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendNewsletterWelcome } from "@/lib/email";

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

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get("token");
    const origin = appOrigin(req);

    if (!token || token.length < 16) {
        return NextResponse.redirect(`${origin}/?newsletter=invalid`);
    }

    const supabase = getServiceClient();

    // Confirm only if a pending row matches and is not unsubscribed.
    const { data, error } = await supabase
        .from("newsletter_subscribers")
        .update({ confirmed_at: new Date().toISOString() })
        .eq("unsubscribe_token", token)
        .is("confirmed_at", null)
        .is("unsubscribed_at", null)
        .select("email, unsubscribe_token")
        .maybeSingle();

    if (error) {
        console.error("[newsletter/confirm] db error:", error);
        return NextResponse.redirect(`${origin}/?newsletter=error`);
    }

    // If null, the token is invalid OR already confirmed — surface a friendly
    // confirmed state either way (do not leak which).
    if (!data) {
        return NextResponse.redirect(`${origin}/?newsletter=confirmed`);
    }

    const unsubscribeUrl = `${origin}/api/newsletter/unsubscribe?token=${encodeURIComponent(data.unsubscribe_token)}`;
    // Optional welcome promo code is environment-configured.
    const promoCode = process.env.NEWSLETTER_WELCOME_PROMO_CODE || undefined;

    sendNewsletterWelcome({ email: data.email, unsubscribeUrl, promoCode }).catch((e: unknown) =>
        console.error("[newsletter/confirm] welcome email failed:", e)
    );

    return NextResponse.redirect(`${origin}/?newsletter=confirmed`);
}
