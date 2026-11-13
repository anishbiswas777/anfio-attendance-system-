import { redirect } from "next/navigation";
import { requireActiveUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getOfficeSettings } from "@/lib/settings/server";
import { getShellCounts } from "@/lib/layout/shell-data";
import { getOfficeDateString } from "@/lib/attendance/calculations";
import { AppShell } from "@/components/layout/AppShell";
import { LateReportsClient } from "@/components/late-reports/LateReportsClient";
import type { LateReport } from "@/types/database";

export default async function LateReportsPage() {
  const profile = await requireActiveUser();
  if (profile.role === "ADMIN") {
    redirect("/admin/late-reports");
  }
  const settings = await getOfficeSettings();
  const todayStr = getOfficeDateString(new Date(), settings.timezone);

  const supabase = await createClient();

  const [
    { unreadNotifications, pendingRegistrations },
    { data: ownReports },
    teamResult,
  ] = await Promise.all([
    getShellCounts(profile),
    supabase
      .from("late_reports")
      .select("*")
      .eq("employee_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(100),
    profile.role === "MANAGER"
      ? supabase
          .from("late_reports")
          .select(
            `
            *,
            employee:profiles!late_reports_employee_id_fkey(id, full_name, employee_code, email, designation, department_id)
          `
          )
          .neq("employee_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(100)
      : Promise.resolve({ data: [] }),
  ]);

  const teamReports = (teamResult.data as LateReport[]) ?? [];

  return (
    <AppShell
      profile={profile}
      unreadNotifications={unreadNotifications}
      pendingRegistrations={pendingRegistrations}
    >
      <LateReportsClient
        profile={profile}
        ownReports={(ownReports as LateReport[]) ?? []}
        teamReports={teamReports}
        todayStr={todayStr}
        defaultExpected={settings.office_start_time}
      />
    </AppShell>
  );
}
