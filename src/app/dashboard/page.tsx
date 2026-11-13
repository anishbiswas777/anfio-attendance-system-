import { redirect } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { requireActiveUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getOfficeSettings } from "@/lib/settings/server";
import { getShellCounts } from "@/lib/layout/shell-data";
import { getOfficeDateString } from "@/lib/attendance/calculations";
import { AppShell } from "@/components/layout/AppShell";
import { EmployeeDashboardClient } from "@/components/dashboard/EmployeeDashboardClient";
import type {
  AttendanceRecord,
  LateReport,
  LeaveRequest,
  NotificationItem,
  TeamOverviewMember,
} from "@/types/database";

export default async function DashboardPage() {
  const profile = await requireActiveUser();
  if (profile.role === "ADMIN") {
    redirect("/admin");
  }
  const settings = await getOfficeSettings();
  const { unreadNotifications, pendingRegistrations } = await getShellCounts(profile);

  const now = new Date();
  const todayStr = getOfficeDateString(now, settings.timezone);
  const todayDisplayDate = formatInTimeZone(
    now,
    settings.timezone,
    "EEEE, dd MMM yyyy"
  );
  const hour = Number(formatInTimeZone(now, settings.timezone, "H"));
  const greeting =
    hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  const monthPrefix = todayStr.slice(0, 7);
  const monthStart = `${monthPrefix}-01`;

  const supabase = await createClient();

  const [
    { data: todayAttendance },
    { data: holidayToday },
    { data: monthAttendance },
    { data: pendingLeaves },
    { data: pendingLateReports },
    { data: notifications },
    { data: teamOverview },
  ] = await Promise.all([
    supabase
      .from("attendance")
      .select("*")
      .eq("employee_id", profile.id)
      .eq("attendance_date", todayStr)
      .maybeSingle(),
    supabase
      .from("holidays")
      .select("name")
      .eq("holiday_date", todayStr)
      .maybeSingle(),
    supabase
      .from("attendance")
      .select("status")
      .eq("employee_id", profile.id)
      .gte("attendance_date", monthStart)
      .lte("attendance_date", todayStr),
    supabase
      .from("leave_requests")
      .select("*")
      .eq("employee_id", profile.id)
      .eq("status", "PENDING")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("late_reports")
      .select("*")
      .eq("employee_id", profile.id)
      .eq("status", "PENDING")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.rpc("get_team_overview", { target_date: todayStr }),
  ]);

  const rows = monthAttendance ?? [];
  const present = rows.filter((r) => r.status === "PRESENT").length;
  const late = rows.filter((r) => r.status === "LATE").length;
  const leave = rows.filter((r) => r.status === "LEAVE").length;
  const absent = rows.filter((r) => r.status === "ABSENT").length;
  const halfDay = rows.filter((r) => r.status === "HALF_DAY").length;
  const totalTracked = present + late + leave + absent + halfDay;
  const attendanceRate =
    totalTracked > 0
      ? Math.round(((present + late + halfDay * 0.5) / totalTracked) * 100)
      : 100;

  const teamRows = (teamOverview as TeamOverviewMember[] | null) ?? [];
  const teamSummary = {
    present: teamRows.filter((m) => m.attendance_status === "PRESENT").length,
    late: teamRows.filter((m) => m.attendance_status === "LATE").length,
    leave: teamRows.filter((m) => m.attendance_status === "LEAVE").length,
    notCheckedIn: teamRows.filter(
      (m) => m.attendance_status === "NOT_CHECKED_IN"
    ).length,
  };

  return (
    <AppShell
      profile={profile}
      unreadNotifications={unreadNotifications}
      pendingRegistrations={pendingRegistrations}
    >
      <EmployeeDashboardClient
        profile={profile}
        settings={settings}
        todayStr={todayStr}
        todayDisplayDate={todayDisplayDate}
        greeting={greeting}
        todayAttendance={(todayAttendance as AttendanceRecord | null) ?? null}
        isHolidayToday={Boolean(holidayToday)}
        holidayName={holidayToday?.name ?? null}
        monthlyStats={{ present, late, leave, absent, attendanceRate }}
        pendingLeaves={(pendingLeaves as LeaveRequest[]) ?? []}
        pendingLateReports={(pendingLateReports as LateReport[]) ?? []}
        teamSummary={teamSummary}
        notifications={(notifications as NotificationItem[]) ?? []}
      />
    </AppShell>
  );
}
