"use client";

import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  formatOfficeTime,
  formatWorkingHours,
  isWeekendDate,
} from "@/lib/attendance/calculations";
import type { AttendanceRecord, Holiday, OfficeSettings } from "@/types/database";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DOT_COLOR: Record<string, string> = {
  PRESENT: "bg-emerald-500",
  LATE: "bg-amber-500",
  LEAVE: "bg-sky-500",
  HOLIDAY: "bg-violet-500",
  HALF_DAY: "bg-orange-500",
  ABSENT: "bg-rose-500",
};

export function AttendanceCalendarClient({
  records,
  holidays,
  settings,
  todayStr,
}: {
  records: AttendanceRecord[];
  holidays: Holiday[];
  settings: OfficeSettings;
  todayStr: string;
}) {
  const [initYear, initMonth] = todayStr.split("-").map(Number);
  const [year, setYear] = useState(initYear);
  const [month, setMonth] = useState(initMonth - 1); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const recordMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const r of records) {
      map.set(r.attendance_date, r);
    }
    return map;
  }, [records]);

  const holidayMap = useMemo(() => {
    const map = new Map<string, Holiday>();
    for (const h of holidays) {
      map.set(h.holiday_date, h);
    }
    return map;
  }, [holidays]);

  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const firstDayUtc = new Date(Date.UTC(year, month, 1)).getUTCDay();
  // Convert Sunday=0..Saturday=6 to Monday=0..Sunday=6
  const leadingBlanks = (firstDayUtc + 6) % 7;

  const prevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthRecords = records.filter((r) =>
    r.attendance_date.startsWith(monthPrefix)
  );

  const selectedRecord = selectedDate ? recordMap.get(selectedDate) : null;
  const selectedHoliday = selectedDate ? holidayMap.get(selectedDate) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Attendance & Calendar
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          View your monthly attendance calendar and detailed daily logs.
        </p>
      </div>

      {/* Calendar Card */}
      <Card>
        <CardHeader
          title={`${MONTH_NAMES[month]} ${year}`}
          description="Click any date to inspect check-in, check-out, and working hours"
          action={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prevMonth}
                aria-label="Previous month"
                className="rounded-lg border border-slate-200 dark:border-slate-700 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                aria-label="Next month"
                className="rounded-lg border border-slate-200 dark:border-slate-700 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          }
        />
        <CardContent>
          {/* Legend */}
          <div className="mb-4 flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-400">
            {Object.entries(DOT_COLOR).map(([status, color]) => (
              <span key={status} className="inline-flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                {status.replace("_", " ")}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-slate-500 mb-2">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-1">
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: leadingBlanks }).map((_, i) => (
              <div key={`blank-${i}`} className="h-16 sm:h-20 rounded-xl bg-slate-50/50 dark:bg-slate-900/30" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dateStr = `${monthPrefix}-${String(day).padStart(2, "0")}`;
              const rec = recordMap.get(dateStr);
              const hol = holidayMap.get(dateStr);
              const weekend = isWeekendDate(dateStr, settings.weekend_days);
              const isFuture = dateStr > todayStr;

              let effectiveStatus: string | null = rec?.status ?? null;
              if (!effectiveStatus && hol) effectiveStatus = "HOLIDAY";
              if (!effectiveStatus && !weekend && !isFuture && dateStr < todayStr) {
                effectiveStatus = "ABSENT";
              }

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setSelectedDate(dateStr)}
                  className={`h-16 sm:h-20 rounded-xl border p-1.5 sm:p-2 flex flex-col items-start justify-between text-left transition-colors cursor-pointer ${
                    dateStr === todayStr
                      ? "border-blue-500 bg-blue-50/40 dark:bg-blue-950/30"
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {day}
                  </span>
                  {effectiveStatus ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          DOT_COLOR[effectiveStatus] ?? "bg-slate-400"
                        }`}
                      />
                      <span className="hidden sm:inline truncate">
                        {effectiveStatus.replace("_", " ")}
                      </span>
                    </span>
                  ) : weekend ? (
                    <span className="text-[10px] text-slate-400">Off</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Monthly History Table */}
      <Card>
        <CardHeader
          title={`Attendance History (${MONTH_NAMES[month]} ${year})`}
          description="Chronological attendance logs for the selected month"
        />
        <CardContent className="p-0">
          {monthRecords.length === 0 ? (
            <EmptyState
              title="No attendance records"
              description="No attendance logs were recorded for this month."
              icon={<CalendarIcon className="h-5 w-5" />}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Check In</th>
                    <th className="px-4 py-3">Check Out</th>
                    <th className="px-4 py-3">Working Hours</th>
                    <th className="px-4 py-3">Late</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {monthRecords.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-3 font-medium">{r.attendance_date}</td>
                      <td className="px-4 py-3">
                        {formatOfficeTime(r.check_in, settings.timezone)}
                      </td>
                      <td className="px-4 py-3">
                        {formatOfficeTime(r.check_out, settings.timezone)}
                      </td>
                      <td className="px-4 py-3">
                        {formatWorkingHours(r.working_minutes)}
                      </td>
                      <td className="px-4 py-3">
                        {r.late_minutes > 0 ? `${r.late_minutes}m` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Date Detail Modal */}
      <Modal
        open={Boolean(selectedDate)}
        onClose={() => setSelectedDate(null)}
        title={`Attendance Details — ${selectedDate ?? ""}`}
      >
        {selectedDate && (
          <div className="space-y-4 text-sm">
            {selectedHoliday && (
              <div className="rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/50 p-3">
                <p className="font-semibold text-violet-800 dark:text-violet-200">
                  Holiday: {selectedHoliday.name}
                </p>
                {selectedHoliday.description && (
                  <p className="text-xs text-violet-600 dark:text-violet-300 mt-1">
                    {selectedHoliday.description}
                  </p>
                )}
              </div>
            )}

            {selectedRecord ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <div className="mt-1">
                    <StatusBadge status={selectedRecord.status} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Late Minutes</p>
                  <p className="mt-1 font-semibold">
                    {selectedRecord.late_minutes}m
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Check In</p>
                  <p className="mt-1 font-semibold">
                    {formatOfficeTime(selectedRecord.check_in, settings.timezone)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Check Out</p>
                  <p className="mt-1 font-semibold">
                    {formatOfficeTime(selectedRecord.check_out, settings.timezone)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-500">Working Hours</p>
                  <p className="mt-1 font-semibold">
                    {formatWorkingHours(selectedRecord.working_minutes)}
                  </p>
                </div>
                {selectedRecord.remarks && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500">Remarks</p>
                    <p className="mt-1 text-slate-700 dark:text-slate-300">
                      {selectedRecord.remarks}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-500">
                No check-in record found for this date.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
