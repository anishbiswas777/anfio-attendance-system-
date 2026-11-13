import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/server";
import { departmentSchema } from "@/lib/validations/schemas";
import { createAuditLog } from "@/lib/audit/logger";

export async function GET() {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      {
        error:
          "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY to .env.local.",
        departments: [],
      },
      { status: 503 }
    );
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("departments")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: "Unable to load departments." },
        { status: 500 }
      );
    }

    return NextResponse.json({ departments: data ?? [] });
  } catch {
    return NextResponse.json(
      { error: "Unable to load departments." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const parsed = departmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid department data." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: created, error } = await admin
      .from("departments")
      .insert({
        name: parsed.data.name,
        description: parsed.data.description || null,
        manager_id: parsed.data.manager_id || null,
        is_active: parsed.data.is_active,
      })
      .select("*")
      .single();

    if (error || !created) {
      return NextResponse.json(
        { error: "Department name already exists or could not be created." },
        { status: 400 }
      );
    }

    await createAuditLog({
      actorId: auth.profile.id,
      action: "DEPARTMENT_CREATED",
      entityType: "department",
      entityId: created.id,
      newData: { name: created.name },
    });

    return NextResponse.json({ department: created }, { status: 201 });
  } catch (err) {
    console.error("[departments POST] Error:", err);
    return NextResponse.json(
      { error: "Unable to create department." },
      { status: 500 }
    );
  }
}
