import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import { departmentSchema } from "@/lib/validations/schemas";
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
    const parsed = departmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid department data." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: updated, error } = await admin
      .from("departments")
      .update({
        name: parsed.data.name,
        description: parsed.data.description || null,
        manager_id: parsed.data.manager_id || null,
        is_active: parsed.data.is_active,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !updated) {
      return NextResponse.json(
        { error: "Unable to update department." },
        { status: 400 }
      );
    }

    await createAuditLog({
      actorId: auth.profile.id,
      action: "DEPARTMENT_UPDATED",
      entityType: "department",
      entityId: id,
      newData: { name: updated.name, is_active: updated.is_active },
    });

    return NextResponse.json({ department: updated });
  } catch {
    return NextResponse.json(
      { error: "Unable to update department." },
      { status: 500 }
    );
  }
}
