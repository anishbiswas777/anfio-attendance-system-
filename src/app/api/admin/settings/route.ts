import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import { getOfficeSettings, invalidateOfficeSettingsCache } from "@/lib/settings/server";
import { officeSettingsSchema } from "@/lib/validations/schemas";
import { createAuditLog } from "@/lib/audit/logger";

export async function GET() {
  const auth = await requireApiAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const settings = await getOfficeSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireApiAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const parsed = officeSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid settings." },
        { status: 400 }
      );
    }

    const oldSettings = await getOfficeSettings();
    const admin = createAdminClient();
    const nowIso = new Date().toISOString();

    const entries = Object.entries(parsed.data).map(([key, value]) => ({
      key,
      value,
      updated_by: auth.profile.id,
      updated_at: nowIso,
    }));

    const { error } = await admin
      .from("app_settings")
      .upsert(entries, { onConflict: "key" });

    if (error) {
      return NextResponse.json(
        { error: "Unable to save settings." },
        { status: 500 }
      );
    }

    invalidateOfficeSettingsCache();

    await createAuditLog({
      actorId: auth.profile.id,
      action: "SETTINGS_UPDATED",
      entityType: "app_settings",
      oldData: oldSettings as unknown as Record<string, unknown>,
      newData: parsed.data as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ settings: parsed.data });
  } catch {
    return NextResponse.json(
      { error: "Unable to save settings." },
      { status: 500 }
    );
  }
}
