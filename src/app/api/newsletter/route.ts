import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const email: unknown = body?.email;

        if (!email || typeof email !== "string" || !isValidEmail(email)) {
            return NextResponse.json(
                { success: false, error: "Please enter a valid email address." },
                { status: 400 }
            );
        }

        const normalised = email.trim().toLowerCase();

        const supabase = await createClient();
        const { error: dbError } = await supabase
            .from("newsletter_subscribers")
            .insert({ email: normalised, source: "footer" });

        if (dbError) {
            // Postgres unique-violation code
            if (dbError.code === "23505") {
                return NextResponse.json(
                    { success: false, error: "You're already subscribed — we'll be in touch soon!" },
                    { status: 409 }
                );
            }
            console.error("[newsletter] db insert error:", dbError);
            return NextResponse.json(
                { success: false, error: "Something went wrong. Please try again." },
                { status: 500 }
            );
        }

        await resend.emails.send({
            from: `GajjuExpress <onboarding@resend.dev>`,
            to: normalised,
            subject: "Welcome to GajjuExpress — here's your £10 off",
            html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="font-family:Georgia,serif;background:#f9f5ef;margin:0;padding:40px 20px;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:48px 40px;border:1px solid #e8e0d0;">

    <div style="text-align:center;margin-bottom:32px;">
      <img src="https://gajjuexpress.co.uk/gajjuexpress-logo-h.png" alt="GajjuExpress" width="180" height="48"
           style="max-width:180px;height:auto;display:block;margin:0 auto 16px;" />
      <p style="font-size:15px;color:#c8860a;margin:0;font-style:italic;">Ghar jaisi cheezein, ek click pe.</p>
    </div>

    <h1 style="font-size:26px;color:#0d4a4a;margin:0 0 4px;font-weight:700;">Welcome to the family</h1>
    <p style="font-size:15px;color:#3a3228;line-height:1.8;margin:16px 0;">
      Thank you for joining us. We're delighted to have you with us.
    </p>

    <div style="background:linear-gradient(135deg,#134048,#1f5f6b);border-radius:16px;padding:28px 32px;margin:28px 0;color:white;text-align:center;">
      <p style="margin:0 0 6px;font-size:13px;opacity:0.8;text-transform:uppercase;letter-spacing:1.5px;font-family:sans-serif;">Your welcome gift</p>
      <p style="margin:0;font-size:36px;font-weight:700;font-family:sans-serif;">£10 off</p>
      <p style="margin:6px 0 0;opacity:0.85;font-size:14px;font-family:sans-serif;">on your first order over £60 · use code <strong>WELCOME10</strong></p>
    </div>

    <p style="font-size:15px;color:#3a3228;line-height:1.8;">
      From Aashirvaad atta to Haldiram's namkeen, MDH masalas to Amul ghee — everything your kitchen calls for, hand-picked and at your door.
    </p>

    <div style="text-align:center;margin:32px 0;">
      <a href="https://gajjuexpress.co.uk/products"
         style="display:inline-block;background:#e0582a;color:#ffffff;text-decoration:none;padding:16px 32px;border-radius:999px;font-size:15px;font-weight:600;font-family:sans-serif;">
        Shop the Pantry →
      </a>
    </div>

    <hr style="border:none;border-top:1px solid #e8e0d0;margin:32px 0;" />

    <p style="font-size:12px;color:#9a8e82;line-height:1.7;margin:0;font-family:sans-serif;text-align:center;">
      GajjuExpress Ltd · 47 Wembley High Road, Unit B, London HA9 7QU<br />
      You're receiving this because you signed up at gajjuexpress.co.uk.<br />
      Questions? <a href="mailto:hello@gajjuexpress.co.uk" style="color:#1f5f6b;">hello@gajjuexpress.co.uk</a>
    </p>
  </div>
</body>
</html>`,
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[newsletter] unexpected error:", err);
        return NextResponse.json(
            { success: false, error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}
