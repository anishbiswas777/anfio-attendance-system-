import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import { getOfficeSettings } from "@/lib/settings/server";
import { getShellCounts } from "@/lib/layout/shell-data";
import {
  formatOfficeDateTime,
  getOfficeDateString,
  isWeekendDate,
} from "@/lib/attendance/calculations";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function AdminDashboardPage() {
  const profile = await requireAdmin();
  const settings = await getOfficeSettings();
  const { unreadNotifications, pendingRegistrations } = await getShellCounts(profile);
  const todayStr = getOfficeDateString(new Date(), settings.timezone);

  const admin = createAdminClient();

  const [
    { data: allProfiles },
    { data: todayAttendance },
    { data: approvedLeavesToday },
    { count: pendingLeaveCount },
    { count: pendingLateCount },
    { data: holidayToday },
    { data: departments },
    { data: recentAudits },
  ] = await Promise.all([
    admin.from("profiles").select("id, role, account_status, department_id"),
    admin
      .from("attendance")
      .select("employee_id, status")
      .eq("attendance_date", todayStr),
    admin
      .from("leave_requests")
      .select("employee_id")
      .eq("status", "APPROVED")
      .lte("start_date", todayStr)
      .gte("end_date", todayStr),
    admin
      .from("leave_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "PENDING"),
    admin
      .from("late_reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "PENDING"),
    admin
      .from("holidays")
      .select("id, name")
      .eq("holiday_date", todayStr)
      .maybeSingle(),
    admin.from("departments").select("id, name").eq("is_active", true),
    admin
      .from("audit_logs")
      .select("*, actor:profiles!audit_logs_actor_id_fkey(full_name)")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const staffProfiles = (allProfiles ?? []).filter((p) => p.role !== "ADMIN");
  const totalEmployees = staffProfiles.length;
  const activeEmployees = staffProfiles.filter(
    (p) => p.account_status === "ACTIVE"
  ).length;

  const attRows = todayAttendance ?? [];
  const presentToday = attRows.filter((a) => a.status === "PRESENT").length;
  const lateToday = attRows.filter((a) => a.status === "LATE").length;
  const halfDayToday = attRows.filter((a) => a.status === "HALF_DAY").length;

  const leaveSet = new Set((approvedLeavesToday ?? []).map((l) => l.employee_id));
  const checkedInSet = new Set(attRows.map((a) => a.employee_id));
  const onLeaveToday = leaveSet.size;

  const isWorkingDay =
    !isWeekendDate(todayStr, settings.weekend_days) && !holidayToday;

  const absentToday = isWorkingDay
    ? staffProfiles.filter(
        (p) =>
          p.account_status === "ACTIVE" &&
          !checkedInSet.has(p.id) &&
          !leaveSet.has(p.id)
      ).length
    : 0;

  const deptStats = (departments ?? []).map((dept) => {
    const deptActive = staffProfiles.filter(
      (p) => p.account_status === "ACTIVE" && p.department_id === dept.id
    );
    const deptPresent = deptActive.filter((p) => checkedInSet.has(p.id)).length;
    const pct =
      deptActive.length > 0 ? Math.round((deptPresent / deptActive.length) * 100) : 0;
    return {
      id: dept.id,
      name: dept.name,
      total: deptActive.length,
      present: deptPresent,
      pct,
    };
  });

  const kpis = [
    { label: "Total Employees", value: totalEmployees, href: "/admin/employees" },
    { label: "Active Employees", value: activeEmployees, href: "/admin/employees" },
    { label: "Present Today", value: presentToday + halfDayToday, href: "/admin/attendance" },
    { label: "Late Today", value: lateToday, href: "/admin/attendance" },
    { label: "On Leave Today", value: onLeaveToday, href: "/admin/leave" },
    { label: "Absent Today", value: absentToday, href: "/admin/attendance" },
    {
      label: "Pending Registrations",
      value: pendingRegistrations,
      href: "/admin/registrations",
    },
    {
      label: "Pending Leave",
      value: pendingLeaveCount ?? 0,
      href: "/admin/leave",
    },
    {
      label: "Pending Late Reports",
      value: pendingLateCount ?? 0,
      href: "/admin/late-reports",
    },
  ];

  return (
    <AppShell
      profile={profile}
      unreadNotifications={unreadNotifications}
      pendingRegistrations={pendingRegistrations}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Admin Overview
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Live organization metrics for {todayStr} ({settings.timezone})
          </p>
        </div>

        {/* KPI Grid */}
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {kpis.map((kpi) => (
            <Link key={kpi.label} href={kpi.href}>
              <Card className="hover:border-blue-400 transition-colors">
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {kpi.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                    {kpi.value}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Department Attendance Chart */}
          <Card>
            <CardHeader
              title="Department Attendance Today"
              description="Active employees checked in per department"
            />
            <CardContent className="space-y-4">
              {deptStats.length === 0 ? (
                <EmptyState
                  title="No departments configured"
                  description="Create departments to track team attendance."
                />
              ) : (
                deptStats.map((d) => (
                  <div key={d.id} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span>{d.name}</span>
                      <span className="text-slate-500">
                        {d.present} / {d.total} ({d.pct}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{ width: `${d.pct}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Audit Activity */}
          <Card>
            <CardHeader
              title="Recent System Activity"
              description="Latest audit trail events"
              action={
                <Link
                  href="/admin/audit-logs"
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  View all logs
                </Link>
              }
            />
            <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800">
              {(recentAudits ?? []).length === 0 ? (
                <EmptyState
                  title="No activity recorded yet"
                  description="System events will appear here."
                />
              ) : (
                (recentAudits ?? []).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between gap-3 px-5 py-3 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {log.action.replace(/_/g, " ")}
                      </p>
                      <p className="text-slate-500">
                        By {log.actor?.full_name || "System"} •{" "}
                        {formatOfficeDateTime(log.created_at, settings.timezone)}
                      </p>
                    </div>
                    <StatusBadge status={log.entity_type.toUpperCase()} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
