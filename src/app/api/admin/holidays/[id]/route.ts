import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import { createAuditLog } from "@/lib/audit/logger";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireApiAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const admin = createAdminClient();
    const { data: deleted, error } = await admin
      .from("holidays")
      .delete()
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error || !deleted) {
      return NextResponse.json(
        { error: "Holiday not found." },
        { status: 404 }
      );
    }

    await createAuditLog({
      actorId: auth.profile.id,
      action: "HOLIDAY_DELETED",
      entityType: "holiday",
      entityId: id,
      oldData: { holiday_date: deleted.holiday_date, name: deleted.name },
    });

    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to delete holiday." },
      { status: 500 }
    );
  }
}
