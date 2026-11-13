import { redirect } from "next/navigation";
import { requireActiveUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getOfficeSettings } from "@/lib/settings/server";
import { getShellCounts } from "@/lib/layout/shell-data";
import { getOfficeDateString } from "@/lib/attendance/calculations";
import { AppShell } from "@/components/layout/AppShell";
import { LeaveClient } from "@/components/leave/LeaveClient";
import type { Holiday, LeaveRequest, LeaveType } from "@/types/database";

export default async function LeavePage() {
  const profile = await requireActiveUser();
  if (profile.role === "ADMIN") {
    redirect("/admin/leave");
  }
  const settings = await getOfficeSettings();
  const { unreadNotifications, pendingRegistrations } = await getShellCounts(profile);
  const todayStr = getOfficeDateString(new Date(), settings.timezone);

  const supabase = await createClient();

  const [{ data: leaveTypes }, { data: ownRequests }, { data: holidays }] =
    await Promise.all([
      supabase
        .from("leave_types")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true }),
      supabase
        .from("leave_requests")
        .select("*, leave_type:leave_types(*)")
        .eq("employee_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("holidays")
        .select("*")
        .order("holiday_date", { ascending: true }),
    ]);

  let teamRequests: LeaveRequest[] = [];
  if (profile.role === "MANAGER") {
    const { data } = await supabase
      .from("leave_requests")
      .select(
        `
        *,
        leave_type:leave_types(*),
        employee:profiles!leave_requests_employee_id_fkey(id, full_name, employee_code, email, designation, department_id)
      `
      )
      .neq("employee_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(100);
    teamRequests = (data as LeaveRequest[]) ?? [];
  }

  return (
    <AppShell
      profile={profile}
      unreadNotifications={unreadNotifications}
      pendingRegistrations={pendingRegistrations}
    >
      <LeaveClient
        profile={profile}
        leaveTypes={(leaveTypes as LeaveType[]) ?? []}
        ownRequests={(ownRequests as LeaveRequest[]) ?? []}
        teamRequests={teamRequests}
        holidays={(holidays as Holiday[]) ?? []}
        settings={settings}
        todayStr={todayStr}
      />
    </AppShell>
  );
}
