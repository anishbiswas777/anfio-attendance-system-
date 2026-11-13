import { NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/validations/schemas";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPasswordResetEmail, getSmtpConfig } from "@/lib/email/mailer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = forgotPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid email address" },
        { status: 400 }
      );
    }

    const email = result.data.email.trim().toLowerCase();

    // 1. Check if profile exists
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("id, full_name, email, account_status")
      .eq("email", email)
      .maybeSingle();

    // If profile does not exist, return generic success message to prevent user enumeration
    if (!profile) {
      return NextResponse.json({
        success: true,
        message: "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // Check account status
    if (profile.account_status === "REJECTED") {
      return NextResponse.json(
        { error: "Your account registration was rejected. Please contact an administrator." },
        { status: 403 }
      );
    }

    if (profile.account_status === "SUSPENDED") {
      return NextResponse.json(
        { error: "Your account has been suspended. Please contact an administrator." },
        { status: 403 }
      );
    }

    // Determine base URL
    const proto = request.headers.get("x-forwarded-proto") || "https";
    const host =
      request.headers.get("x-forwarded-host") || request.headers.get("host");
    const origin = host
      ? `${proto}://${host}`
      : new URL(request.url).origin;

    const callbackRedirect = `${origin}/api/auth/callback?next=/reset-password`;

    // 2. Generate Supabase recovery link via Admin API
    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: {
          redirectTo: callbackRedirect,
        },
      });

    if (linkError || !linkData?.properties) {
      console.error("[ForgotPassword] generateLink error:", linkError);
      return NextResponse.json(
        { error: "Unable to generate password reset link. Please try again." },
        { status: 500 }
      );
    }

    const { hashed_token, email_otp, action_link } = linkData.properties;

    // Use our custom callback URL containing the token_hash so it stays on the custom domain,
    // or fall back to action_link if hashed_token is somehow missing
    const resetUrl = hashed_token
      ? `${origin}/api/auth/callback?token_hash=${encodeURIComponent(hashed_token)}&type=recovery&next=${encodeURIComponent("/reset-password")}`
      : action_link;

    // 3. Send email via Nodemailer
    const mailResult = await sendPasswordResetEmail({
      to: email,
      recipientName: profile.full_name,
      resetUrl,
      otpCode: email_otp,
    });

    if (!mailResult.success) {
      const smtp = getSmtpConfig();
      if (!smtp.isConfigured) {
        return NextResponse.json(
          {
            error:
              "SMTP email service is not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS in your deployment environment variables.",
          },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: mailResult.error || "Failed to deliver reset email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "A password reset link has been sent to your email.",
    });
  } catch (err: unknown) {
    console.error("[ForgotPassword] Unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
