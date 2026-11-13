import { redirect } from "next/navigation";
import { requireActiveUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getOfficeSettings } from "@/lib/settings/server";
import { getShellCounts } from "@/lib/layout/shell-data";
import { getOfficeDateString } from "@/lib/attendance/calculations";
import { AppShell } from "@/components/layout/AppShell";
import { AttendanceCalendarClient } from "@/components/attendance/AttendanceCalendarClient";
import type { AttendanceRecord, Holiday } from "@/types/database";

export default async function AttendancePage() {
  const profile = await requireActiveUser();
  if (profile.role === "ADMIN") {
    redirect("/admin/attendance");
  }
  const settings = await getOfficeSettings();
  const todayStr = getOfficeDateString(new Date(), settings.timezone);

  const supabase = await createClient();
  const [
    { unreadNotifications, pendingRegistrations },
    { data: records },
    { data: holidays },
  ] = await Promise.all([
    getShellCounts(profile),
    supabase
      .from("attendance")
      .select("*")
      .eq("employee_id", profile.id)
      .order("attendance_date", { ascending: false })
      .limit(365),
    supabase.from("holidays").select("*").order("holiday_date", { ascending: true }),
  ]);

  return (
    <AppShell
      profile={profile}
      unreadNotifications={unreadNotifications}
      pendingRegistrations={pendingRegistrations}
    >
      <AttendanceCalendarClient
        records={(records as AttendanceRecord[]) ?? []}
        holidays={(holidays as Holiday[]) ?? []}
        settings={settings}
        todayStr={todayStr}
      />
    </AppShell>
  );
}
