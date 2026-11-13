import nodemailer from "nodemailer";

export interface SmtpConfig {
  isConfigured: boolean;
  host?: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
}

export function getSmtpConfig(): SmtpConfig {
  const host = process.env.SMTP_HOST?.trim();
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure =
    process.env.SMTP_SECURE === "true" ||
    process.env.SMTP_SECURE === "1" ||
    port === 465;
  const user = process.env.SMTP_USER?.trim();
  const pass = (process.env.SMTP_PASS || process.env.SMTP_PASSWORD)?.trim();
  const from =
    process.env.SMTP_FROM?.trim() ||
    (user ? `Anfio HRMS <${user}>` : `Anfio HRMS <no-reply@anfio.com>`);

  return {
    isConfigured: Boolean(host && user && pass),
    host,
    port,
    secure,
    user,
    pass,
    from,
  };
}

export function createMailerTransport() {
  const config = getSmtpConfig();
  if (!config.isConfigured || !config.host || !config.user || !config.pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === "production",
    },
  });
}

export async function sendPasswordResetEmail({
  to,
  recipientName,
  resetUrl,
  otpCode,
}: {
  to: string;
  recipientName?: string;
  resetUrl: string;
  otpCode?: string;
}): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const config = getSmtpConfig();
  const transporter = createMailerTransport();

  const greetingName = recipientName ? ` ${recipientName}` : "";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Anfio HRMS Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 28px 32px; text-align: left;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color: #2563eb; width: 36px; height: 36px; border-radius: 8px; text-align: center; vertical-align: middle; color: #ffffff; font-weight: bold; font-size: 18px;">
                    A
                  </td>
                  <td style="padding-left: 12px;">
                    <div style="color: #ffffff; font-weight: bold; font-size: 16px; letter-spacing: -0.02em;">Anfio HRMS</div>
                    <div style="color: #94a3b8; font-size: 12px;">Attendance & Team Management</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 36px 32px;">
              <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #0f172a; letter-spacing: -0.02em;">
                Reset your password
              </h1>
              <p style="margin: 0 0 20px; font-size: 15px; line-height: 24px; color: #475569;">
                Hello${greetingName},
              </p>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 24px; color: #475569;">
                We received a request to reset the password associated with your Anfio HRMS account (<strong>${to}</strong>). Click the button below to set a new password:
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td style="border-radius: 10px; background-color: #2563eb; text-align: center;">
                    <a href="${resetUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 10px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              ${
                otpCode
                  ? `
              <!-- OTP Box -->
              <div style="margin: 28px 0; padding: 20px; background-color: #f1f5f9; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center;">
                <p style="margin: 0 0 8px; font-size: 13px; color: #64748b; font-weight: 500;">
                  Or use this 6-digit verification code if prompted:
                </p>
                <div style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 28px; font-weight: 700; letter-spacing: 8px; color: #0f172a;">
                  ${otpCode}
                </div>
              </div>
              `
                  : ""
              }

              <p style="margin: 24px 0 0; font-size: 13px; line-height: 20px; color: #64748b;">
                If the button above does not work, copy and paste this URL into your browser:
              </p>
              <p style="margin: 6px 0 24px; font-size: 12px; line-height: 18px; word-break: break-all; color: #2563eb;">
                <a href="${resetUrl}" style="color: #2563eb; text-decoration: underline;">${resetUrl}</a>
              </p>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0 20px;" />

              <p style="margin: 0; font-size: 12px; line-height: 18px; color: #94a3b8;">
                This password reset link is valid for 1 hour. If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                © ${new Date().getFullYear()} Anfio HRMS. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Reset your Anfio HRMS password

Hello${greetingName},

We received a request to reset your Anfio HRMS password for ${to}.

Click the link below to set a new password:
${resetUrl}
${otpCode ? `\nOr enter this verification code: ${otpCode}\n` : ""}
This link expires in 1 hour.

If you did not request this, you can safely ignore this email.
  `.trim();

  if (!transporter) {
    console.warn(
      `[Mailer] SMTP not configured. Password reset link for ${to}:\n${resetUrl}\nOTP: ${otpCode || "N/A"}`
    );
    return {
      success: false,
      error:
        "SMTP server credentials are not configured. Please configure SMTP_HOST, SMTP_USER, and SMTP_PASS in your environment variables.",
    };
  }

  try {
    const info = await transporter.sendMail({
      from: config.from,
      to,
      subject: "Reset your Anfio HRMS password",
      text,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to send email";
    console.error("[Mailer] sendMail error:", msg);
    return { success: false, error: msg };
  }
}
