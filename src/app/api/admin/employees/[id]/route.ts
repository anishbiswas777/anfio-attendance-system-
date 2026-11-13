import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import { adminEmployeeUpdateSchema } from "@/lib/validations/schemas";
import { createAuditLog } from "@/lib/audit/logger";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireApiAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = adminEmployeeUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid employee data." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: existing, error: fetchError } = await admin
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Employee not found." }, { status: 404 });
    }

    // Prevent an admin from accidentally demoting or suspending themselves
    if (
      id === auth.profile.id &&
      (parsed.data.role !== "ADMIN" || parsed.data.account_status !== "ACTIVE")
    ) {
      return NextResponse.json(
        { error: "You cannot demote or deactivate your own administrator account." },
        { status: 400 }
      );
    }

    const { data: updated, error: updateError } = await admin
      .from("profiles")
      .update({
        full_name: parsed.data.full_name,
        phone: parsed.data.phone || null,
        employee_code: parsed.data.employee_code.toUpperCase(),
        department_id: parsed.data.department_id || null,
        designation: parsed.data.designation || null,
        manager_id: parsed.data.manager_id === id ? null : parsed.data.manager_id || null,
        joining_date: parsed.data.joining_date || null,
        role: parsed.data.role,
        account_status: parsed.data.account_status,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: "Unable to update employee. Check if Employee ID is unique." },
        { status: 400 }
      );
    }

    await createAuditLog({
      actorId: auth.profile.id,
      action:
        parsed.data.account_status === "SUSPENDED" &&
        existing.account_status !== "SUSPENDED"
          ? "EMPLOYEE_SUSPENDED"
          : "EMPLOYEE_UPDATED",
      entityType: "profile",
      entityId: id,
      oldData: {
        role: existing.role,
        account_status: existing.account_status,
        department_id: existing.department_id,
        manager_id: existing.manager_id,
      },
      newData: {
        role: updated.role,
        account_status: updated.account_status,
        department_id: updated.department_id,
        manager_id: updated.manager_id,
      },
    });

    return NextResponse.json({ employee: updated });
  } catch (err) {
    console.error("[admin employees PATCH] Error:", err);
    return NextResponse.json(
      { error: "Unable to update employee." },
      { status: 500 }
    );
  }
}
