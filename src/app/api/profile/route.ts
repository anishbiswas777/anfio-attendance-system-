import { NextResponse } from "next/server";
import { requireApiActiveUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { profileUpdateSchema } from "@/lib/validations/schemas";
import { createAuditLog } from "@/lib/audit/logger";

export async function GET() {
  const auth = await requireApiActiveUser();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  return NextResponse.json({ profile: auth.profile });
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireApiActiveUser();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid profile data." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: updated, error } = await supabase
      .from("profiles")
      .update({
        full_name: parsed.data.full_name,
        phone: parsed.data.phone,
        designation: parsed.data.designation,
      })
      .eq("id", auth.profile.id)
      .select("*")
      .single();

    if (error || !updated) {
      return NextResponse.json(
        { error: "Unable to update profile." },
        { status: 500 }
      );
    }

    await createAuditLog({
      actorId: auth.profile.id,
      action: "PROFILE_UPDATED",
      entityType: "profile",
      entityId: auth.profile.id,
      oldData: {
        full_name: auth.profile.full_name,
        phone: auth.profile.phone,
        designation: auth.profile.designation,
      },
      newData: {
        full_name: updated.full_name,
        phone: updated.phone,
        designation: updated.designation,
      },
    });

    return NextResponse.json({ profile: updated });
  } catch (err) {
    console.error("[profile PATCH] Error:", err);
    return NextResponse.json(
      { error: "Unable to update profile." },
      { status: 500 }
    );
  }
}
