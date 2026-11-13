"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  LogIn,
  LogOut,
  CalendarPlus,
  FileWarning,
  Bell,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useApp } from "@/components/providers/AppProviders";
import {
  formatOfficeTime,
  formatWorkingHours,
} from "@/lib/attendance/calculations";
import type {
  AttendanceRecord,
  LateReport,
  LeaveRequest,
  NotificationItem,
  OfficeSettings,
  Profile,
} from "@/types/database";

interface DashboardProps {
  profile: Profile;
  settings: OfficeSettings;
  todayStr: string;
  todayDisplayDate: string;
  greeting: string;
  todayAttendance: AttendanceRecord | null;
  isHolidayToday: boolean;
  holidayName?: string | null;
  monthlyStats: {
    present: number;
    late: number;
    leave: number;
    absent: number;
    attendanceRate: number;
  };
  pendingLeaves: LeaveRequest[];
  pendingLateReports: LateReport[];
  teamSummary: {
    present: number;
    late: number;
    leave: number;
    notCheckedIn: number;
  };
  notifications: NotificationItem[];
}

export function EmployeeDashboardClient({
  profile,
  settings,
  todayDisplayDate,
  greeting,
  todayAttendance: initialAttendance,
  isHolidayToday,
  holidayName,
  monthlyStats,
  pendingLeaves,
  pendingLateReports,
  teamSummary,
  notifications,
}: DashboardProps) {
  const router = useRouter();
  const { toast } = useApp();
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(
    initialAttendance
  );
  const [loadingAction, setLoadingAction] = useState<"in" | "out" | null>(null);

  const handleCheckIn = async () => {
    setLoadingAction("in");
    try {
      const res = await fetch("/api/attendance/check-in", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Check-in failed",
          description: data.error || "Unable to check in.",
          variant: "error",
        });
        return;
      }
      setAttendance(data.attendance);
      toast({
        title: "Checked in",
        description:
          data.attendance.late_minutes > 0
            ? `Checked in (${data.attendance.late_minutes} min late).`
            : "Checked in on time.",
        variant: "success",
      });
      router.refresh();
    } catch {
      toast({
        title: "Check-in failed",
        description: "Network error. Please try again.",
        variant: "error",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCheckOut = async () => {
    setLoadingAction("out");
    try {
      const res = await fetch("/api/attendance/check-out", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Check-out failed",
          description: data.error || "Unable to check out.",
          variant: "error",
        });
        return;
      }
      setAttendance(data.attendance);
      toast({
        title: "Checked out",
        description: `Working hours: ${formatWorkingHours(
          data.attendance.working_minutes
        )}`,
        variant: "success",
      });
      router.refresh();
    } catch {
      toast({
        title: "Check-out failed",
        description: "Network error. Please try again.",
        variant: "error",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Greeting Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {greeting}, {profile.full_name.split(" ")[0]}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {todayDisplayDate} • Office Hours: {settings.office_start_time} –{" "}
            {settings.office_end_time} ({settings.timezone})
          </p>
        </div>
        {isHolidayToday && (
          <div className="inline-flex items-center gap-2 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/50 px-3.5 py-2 text-xs font-medium text-violet-700 dark:text-violet-300">
            <span>Holiday Today: {holidayName || "Company Holiday"}</span>
          </div>
        )}
      </div>

      {/* Today's Attendance + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Today's Attendance"
            description="Your real-time attendance status for today"
            action={
              attendance ? (
                <StatusBadge status={attendance.status} />
              ) : (
                <StatusBadge
                  status={isHolidayToday ? "HOLIDAY" : "NOT_CHECKED_IN"}
                  label={isHolidayToday ? "HOLIDAY" : "Not Checked In"}
                />
              )
            }
          />
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3.5">
                <p className="text-xs text-slate-500 dark:text-slate-400">Check In</p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                  {formatOfficeTime(attendance?.check_in, settings.timezone)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3.5">
                <p className="text-xs text-slate-500 dark:text-slate-400">Check Out</p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                  {formatOfficeTime(attendance?.check_out, settings.timezone)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3.5">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Working Hours
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                  {formatWorkingHours(attendance?.working_minutes)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3.5">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Late Minutes
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                  {attendance ? `${attendance.late_minutes}m` : "—"}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {!attendance && (
                <Button
                  onClick={handleCheckIn}
                  loading={loadingAction === "in"}
                  size="lg"
                >
                  <LogIn className="h-4 w-4" />
                  {loadingAction === "in" ? "Checking In..." : "Check In"}
                </Button>
              )}

              {attendance && attendance.check_in && !attendance.check_out && (
                <Button
                  onClick={handleCheckOut}
                  loading={loadingAction === "out"}
                  variant="danger"
                  size="lg"
                >
                  <LogOut className="h-4 w-4" />
                  {loadingAction === "out" ? "Checking Out..." : "Check Out"}
                </Button>
              )}

              {attendance && attendance.check_out && (
                <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 px-4 py-2.5 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  Attendance completed for today
                </div>
              )}

              <Link
                href="/leave"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <CalendarPlus className="h-4 w-4" />
                Apply Leave
              </Link>

              <Link
                href="/late-reports"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <FileWarning className="h-4 w-4" />
                Submit Late Report
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Team Overview */}
        <Card>
          <CardHeader
            title="Team Today"
            description="Permitted live team status"
            action={
              <Link
                href="/team"
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                View all
              </Link>
            }
          />
          <CardContent className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-3">
              <p className="text-xs text-slate-500">Present</p>
              <p className="mt-1 text-xl font-bold text-emerald-600">
                {teamSummary.present}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-3">
              <p className="text-xs text-slate-500">Late</p>
              <p className="mt-1 text-xl font-bold text-amber-600">
                {teamSummary.late}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-3">
              <p className="text-xs text-slate-500">On Leave</p>
              <p className="mt-1 text-xl font-bold text-sky-600">
                {teamSummary.leave}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-3">
              <p className="text-xs text-slate-500">Not Checked In</p>
              <p className="mt-1 text-xl font-bold text-slate-600 dark:text-slate-300">
                {teamSummary.notCheckedIn}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: "Present (Month)", value: monthlyStats.present, tone: "text-emerald-600" },
          { label: "Late (Month)", value: monthlyStats.late, tone: "text-amber-600" },
          { label: "Leave (Month)", value: monthlyStats.leave, tone: "text-sky-600" },
          { label: "Absent (Month)", value: monthlyStats.absent, tone: "text-rose-600" },
          { label: "Attendance %", value: `${monthlyStats.attendanceRate}%`, tone: "text-blue-600" },
        ].map((stat, idx) => (
          <Card key={stat.label} className={idx === 4 ? "col-span-2 sm:col-span-1" : ""}>
            <CardContent className="p-3.5 sm:p-4">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {stat.label}
              </p>
              <p className={`mt-1 text-2xl font-bold ${stat.tone}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pending Requests + Notifications */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Pending Requests"
            description="Your awaiting leave & late report requests"
          />
          <CardContent className="space-y-3">
            {pendingLeaves.length === 0 && pendingLateReports.length === 0 ? (
              <EmptyState
                title="No pending requests"
                description="All your leave requests and late reports have been processed."
                icon={<Clock className="h-5 w-5" />}
              />
            ) : (
              <>
                {pendingLeaves.map((lr) => (
                  <div
                    key={lr.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        Leave: {lr.start_date} to {lr.end_date}
                      </p>
                      <p className="text-xs text-slate-500">
                        {lr.total_days} day(s)
                      </p>
                    </div>
                    <StatusBadge status={lr.status} />
                  </div>
                ))}
                {pendingLateReports.map((rep) => (
                  <div
                    key={rep.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        Late Report: {rep.report_date}
                      </p>
                      <p className="text-xs text-slate-500">{rep.reason}</p>
                    </div>
                    <StatusBadge status={rep.status} />
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Recent Notifications"
            description="Updates on your requests and attendance"
            action={
              <Link
                href="/notifications"
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                View all
              </Link>
            }
          />
          <CardContent className="space-y-3">
            {notifications.length === 0 ? (
              <EmptyState
                title="You're all caught up"
                description="No notifications right now."
                icon={<Bell className="h-5 w-5" />}
              />
            ) : (
              notifications.slice(0, 5).map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 dark:border-slate-800 p-3"
                >
                  <AlertTriangle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {n.message}
                    </p>
                  </div>
                  {!n.read_at && (
                    <span className="h-2 w-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
