import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import { getOfficeSettings } from "@/lib/settings/server";
import { getShellCounts } from "@/lib/layout/shell-data";
import { getOfficeDateString } from "@/lib/attendance/calculations";
import { AppShell } from "@/components/layout/AppShell";
import { ReportsClient } from "@/components/admin/ReportsClient";
import type { Department } from "@/types/database";

export default async function AdminReportsPage() {
  const profile = await requireAdmin();
  const settings = await getOfficeSettings();
  const todayStr = getOfficeDateString(new Date(), settings.timezone);

  const admin = createAdminClient();
  const [{ unreadNotifications, pendingRegistrations }, { data: departments }] = await Promise.all([
    getShellCounts(profile),
    admin
      .from("departments")
      .select("*")
      .order("name", { ascending: true }),
  ]);

  return (
    <AppShell
      profile={profile}
      unreadNotifications={unreadNotifications}
      pendingRegistrations={pendingRegistrations}
    >
      <ReportsClient
        departments={(departments as Department[]) ?? []}
        todayStr={todayStr}
      />
    </AppShell>
  );
}
