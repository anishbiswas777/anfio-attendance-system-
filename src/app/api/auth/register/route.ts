import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validations/schemas";
import { createAuditLog } from "@/lib/audit/logger";
import { notifyAdmins } from "@/lib/notifications/service";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const raw = {
      full_name: String(formData.get("full_name") ?? ""),
      email: String(formData.get("email") ?? "").toLowerCase(),
      phone: String(formData.get("phone") ?? ""),
      employee_code: String(formData.get("employee_code") ?? "").toUpperCase(),
      department_id: String(formData.get("department_id") ?? ""),
      designation: String(formData.get("designation") ?? ""),
      joining_date: String(formData.get("joining_date") ?? ""),
      password: String(formData.get("password") ?? ""),
      confirm_password: String(formData.get("confirm_password") ?? ""),
    };

    const parsed = registerSchema.safeParse(raw);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message || "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Check unique email or employee_code before creating auth user
    const { data: existingEmail } = await admin
      .from("profiles")
      .select("id")
      .eq("email", parsed.data.email)
      .maybeSingle();

    if (existingEmail) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    const { data: existingCode } = await admin
      .from("profiles")
      .select("id")
      .eq("employee_code", parsed.data.employee_code)
      .maybeSingle();

    if (existingCode) {
      return NextResponse.json(
        { error: "This Employee ID is already registered." },
        { status: 409 }
      );
    }

    // Verify department exists and is active
    const { data: dept } = await admin
      .from("departments")
      .select("id, name, is_active")
      .eq("id", parsed.data.department_id)
      .maybeSingle();

    if (!dept || !dept.is_active) {
      return NextResponse.json(
        { error: "Selected department is invalid or inactive." },
        { status: 400 }
      );
    }

    // Create auth user
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        full_name: parsed.data.full_name,
      },
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || "Unable to create user account." },
        { status: 400 }
      );
    }

    const userId = authData.user.id;
    let avatarPath: string | null = null;

    // Optional profile photo upload
    const avatarFile = formData.get("avatar");
    if (avatarFile instanceof File && avatarFile.size > 0) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(avatarFile.type)) {
        await admin.auth.admin.deleteUser(userId);
        return NextResponse.json(
          { error: "Profile photo must be a JPG, PNG, or WebP image." },
          { status: 400 }
        );
      }
      if (avatarFile.size > 2 * 1024 * 1024) {
        await admin.auth.admin.deleteUser(userId);
        return NextResponse.json(
          { error: "Profile photo must be 2 MB or smaller." },
          { status: 400 }
        );
      }

      const ext = avatarFile.name.split(".").pop() || "png";
      const filePath = `${userId}/avatar-${Date.now()}.${ext}`;
      const buffer = Buffer.from(await avatarFile.arrayBuffer());
      const { error: uploadErr } = await admin.storage
        .from("avatars")
        .upload(filePath, buffer, { contentType: avatarFile.type, upsert: true });

      if (!uploadErr) {
        avatarPath = filePath;
      }
    }

    // Always force role = 'EMPLOYEE' and account_status = 'PENDING'
    const { error: profileError } = await admin.from("profiles").insert({
      id: userId,
      employee_code: parsed.data.employee_code,
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      department_id: parsed.data.department_id,
      designation: parsed.data.designation,
      joining_date: parsed.data.joining_date,
      role: "EMPLOYEE",
      account_status: "PENDING",
      avatar_url: avatarPath,
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: "Failed to save employee profile. Please try again." },
        { status: 500 }
      );
    }

    await createAuditLog({
      actorId: userId,
      action: "EMPLOYEE_REGISTERED",
      entityType: "profile",
      entityId: userId,
      newData: {
        employee_code: parsed.data.employee_code,
        email: parsed.data.email,
        department_id: parsed.data.department_id,
        account_status: "PENDING",
      },
    });

    await notifyAdmins({
      title: "New Employee Registration",
      message: `${parsed.data.full_name} (${parsed.data.employee_code}) registered and is awaiting approval.`,
      type: "INFO",
      link: "/admin/registrations",
    });

    return NextResponse.json(
      {
        message:
          "Registration submitted successfully. Your account is waiting for administrator approval.",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[register] Unexpected error:", err);
    return NextResponse.json(
      { error: "Unable to complete registration. Please try again." },
      { status: 500 }
    );
  }
}
