import { NextResponse } from "next/server";
import { requireApiActiveUser, requireApiAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import { holidaySchema } from "@/lib/validations/schemas";
import { createAuditLog } from "@/lib/audit/logger";

export async function GET() {
  const auth = await requireApiActiveUser();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("holidays")
    .select("*")
    .order("holiday_date", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Unable to load holidays." },
      { status: 500 }
    );
  }

  return NextResponse.json({ holidays: data ?? [] });
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const parsed = holidaySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid holiday data." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: created, error } = await admin
      .from("holidays")
      .insert({
        holiday_date: parsed.data.holiday_date,
        name: parsed.data.name,
        description: parsed.data.description || null,
      })
      .select("*")
      .single();

    if (error || !created) {
      return NextResponse.json(
        { error: "A holiday already exists on this date." },
        { status: 409 }
      );
    }

    await createAuditLog({
      actorId: auth.profile.id,
      action: "HOLIDAY_CREATED",
      entityType: "holiday",
      entityId: created.id,
      newData: { holiday_date: created.holiday_date, name: created.name },
    });

    return NextResponse.json({ holiday: created }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to create holiday." },
      { status: 500 }
    );
  }
}
