import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import { getOfficeSettings } from "@/lib/settings/server";
import { getShellCounts } from "@/lib/layout/shell-data";
import { AppShell } from "@/components/layout/AppShell";
import { RegistrationsClient } from "@/components/admin/RegistrationsClient";
import type { Profile } from "@/types/database";

export default async function AdminRegistrationsPage() {
  const profile = await requireAdmin();
  const settings = await getOfficeSettings();
  const { unreadNotifications, pendingRegistrations } = await getShellCounts(profile);

  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select(
      "*, department:departments!profiles_department_id_fkey(id, name)"
    )
    .eq("account_status", "PENDING")
    .order("created_at", { ascending: false });

  return (
    <AppShell
      profile={profile}
      unreadNotifications={unreadNotifications}
      pendingRegistrations={pendingRegistrations}
    >
      <RegistrationsClient
        registrations={(data as Profile[]) ?? []}
        settings={settings}
      />
    </AppShell>
  );
}
