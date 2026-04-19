import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    const { password } = await request.json();

    if (!password) {
        return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify the user is authenticated
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
        return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    // Verify password by attempting to sign in
    const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
    });

    if (authError) {
        return NextResponse.json({ error: "Incorrect password." }, { status: 403 });
    }

    // Use service role to perform deletion
    const serviceSupabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    // 1. Anonymise orders (keep for tax records but strip PII)
    await serviceSupabase
        .from("orders")
        .update({
            user_id: null,
            guest_email: null,
            guest_token: null,
            shipping_address: { anonymised: true },
            billing_address: { anonymised: true },
        })
        .eq("user_id", user.id);

    // 2. Anonymise invoices
    await serviceSupabase
        .from("invoices")
        .update({
            customer_email: "deleted@account.anonymised",
            customer_name: "Deleted Account",
            billing_address: { anonymised: true },
        })
        .eq("customer_email", user.email);

    // 3. Delete profile
    await serviceSupabase.from("profiles").delete().eq("id", user.id);

    // 4. Delete auth user
    const { error: deleteError } = await serviceSupabase.auth.admin.deleteUser(user.id);

    if (deleteError) {
        console.error("Failed to delete auth user:", deleteError.message);
        return NextResponse.json(
            { error: "Account partially deleted. Contact support." },
            { status: 500 }
        );
    }

    return NextResponse.json({ success: true });
}
