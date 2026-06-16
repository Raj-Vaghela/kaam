import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp } from "@/lib/security/rate-limit";
import { sendNewsletterConfirmation } from "@/lib/email";

// Newsletter subscribers table has RLS enabled with NO write policy.
// All inserts/updates must go through the service-role client.
function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );
}

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function appOrigin(req: NextRequest): string {
    return process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const email: unknown = body?.email;
        const consentText: unknown = body?.consent_text;
        const source: unknown = body?.source ?? "footer";

        if (!email || typeof email !== "string" || !isValidEmail(email)) {
            return NextResponse.json(
                { success: false, error: "Please enter a valid email address." },
                { status: 400 }
            );
        }
        if (!consentText || typeof consentText !== "string" || consentText.length < 10) {
            return NextResponse.json(
                { success: false, error: "Marketing consent statement missing." },
                { status: 400 }
            );
        }

        const ip = getClientIp(req);

        // 3 attempts per IP per hour — prevents address-harvesting / mail-bombing.
        const limit = await rateLimit(`newsletter:${ip}`, 3, 60 * 60 * 1000);
        if (!limit.allowed) {
            return NextResponse.json(
                { success: false, error: "Too many attempts. Try again later." },
                { status: 429 }
            );
        }

        const normalised = email.trim().toLowerCase();
        const supabase = getServiceClient();
        const origin = appOrigin(req);

        // Look up existing row by email (composite logic — resubscribe vs new).
        const { data: existing } = await supabase
            .from("newsletter_subscribers")
            .select("id, unsubscribe_token, confirmed_at, unsubscribed_at")
            .eq("email", normalised)
            .maybeSingle();

        let token: string | null = null;

        if (existing) {
            // Resubscribe path: re-issue confirmation and clear unsubscribed_at.
            const { data: refreshed, error: updateErr } = await supabase
                .from("newsletter_subscribers")
                .update({
                    unsubscribed_at: null,
                    confirmed_at: existing.confirmed_at ?? null,
                    consent_ip: ip === "unknown" ? null : ip,
                    consent_text: consentText,
                    consent_source: typeof source === "string" ? source : "footer",
                })
                .eq("id", existing.id)
                .select("unsubscribe_token")
                .single();

            if (updateErr) {
                console.error("[newsletter] update error:", updateErr);
                return NextResponse.json(
                    { success: false, error: "Something went wrong. Please try again." },
                    { status: 500 }
                );
            }
            token = refreshed?.unsubscribe_token ?? existing.unsubscribe_token;
        } else {
            // New signup. unsubscribe_token has a DB default (random hex).
            const { data: inserted, error: insertErr } = await supabase
                .from("newsletter_subscribers")
                .insert({
                    email: normalised,
                    source: typeof source === "string" ? source : "footer",
                    consent_ip: ip === "unknown" ? null : ip,
                    consent_text: consentText,
                    consent_source: typeof source === "string" ? source : "footer",
                })
                .select("unsubscribe_token")
                .single();

            if (insertErr) {
                console.error("[newsletter] insert error:", insertErr);
                return NextResponse.json(
                    { success: false, error: "Something went wrong. Please try again." },
                    { status: 500 }
                );
            }
            token = inserted?.unsubscribe_token ?? null;
        }

        if (!token) {
            console.error("[newsletter] missing unsubscribe_token after upsert");
            return NextResponse.json(
                { success: false, error: "Something went wrong. Please try again." },
                { status: 500 }
            );
        }

        // If already confirmed and active, no need to spam another confirmation
        // — return the same neutral message to avoid email enumeration.
        if (existing?.confirmed_at && !existing.unsubscribed_at) {
            return NextResponse.json({
                success: true,
                message: "Check your inbox to confirm your subscription.",
            });
        }

        const confirmUrl = `${origin}/api/newsletter/confirm?token=${encodeURIComponent(token)}`;
        const unsubscribeUrl = `${origin}/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;

        // Fire-and-forget — confirmation send failure should not block the signup
        // record; the user can request resend.
        sendNewsletterConfirmation({ email: normalised, confirmUrl, unsubscribeUrl }).catch(
            (e: unknown) => console.error("[newsletter] confirm email failed:", e)
        );

        return NextResponse.json({
            success: true,
            message: "Check your inbox to confirm your subscription.",
        });
    } catch (err) {
        console.error("[newsletter] unexpected error:", err);
        return NextResponse.json(
            { success: false, error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}
