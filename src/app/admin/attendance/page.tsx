import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import { getOfficeSettings } from "@/lib/settings/server";
import { getShellCounts } from "@/lib/layout/shell-data";
import { getOfficeDateString } from "@/lib/attendance/calculations";
import { AppShell } from "@/components/layout/AppShell";
import { AdminAttendanceClient } from "@/components/admin/AdminAttendanceClient";
import type { AttendanceRecord, Profile } from "@/types/database";

export default async function AdminAttendancePage() {
  const profile = await requireAdmin();
  const settings = await getOfficeSettings();
  const { unreadNotifications, pendingRegistrations } = await getShellCounts(profile);
  const todayStr = getOfficeDateString(new Date(), settings.timezone);

  const admin = createAdminClient();
  const [{ data: records }, { data: employees }] = await Promise.all([
    admin
      .from("attendance")
      .select(
        "*, employee:profiles!attendance_employee_id_fkey(id, full_name, employee_code)"
      )
      .order("attendance_date", { ascending: false })
      .limit(300),
    admin
      .from("profiles")
      .select("id, full_name, employee_code")
      .eq("account_status", "ACTIVE")
      .order("full_name", { ascending: true }),
  ]);

  return (
    <AppShell
      profile={profile}
      unreadNotifications={unreadNotifications}
      pendingRegistrations={pendingRegistrations}
    >
      <AdminAttendanceClient
        records={(records as AttendanceRecord[]) ?? []}
        employees={
          (employees as Pick<Profile, "id" | "full_name" | "employee_code">[]) ??
          []
        }
        settings={settings}
        todayStr={todayStr}
      />
    </AppShell>
  );
}
