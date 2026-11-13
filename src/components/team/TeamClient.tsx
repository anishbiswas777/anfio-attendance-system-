"use client";

import React, { useMemo, useState } from "react";
import { Users, Search } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatOfficeTime } from "@/lib/attendance/calculations";
import type { OfficeSettings, TeamOverviewMember } from "@/types/database";

export function TeamClient({
  members,
  settings,
  todayStr,
}: {
  members: TeamOverviewMember[];
  settings: OfficeSettings;
  todayStr: string;
}) {
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  const departments = useMemo(() => {
    const names = new Set<string>();
    for (const m of members) {
      if (m.department_name) names.add(m.department_name);
    }
    return Array.from(names).sort();
  }, [members]);

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch =
        !search ||
        m.full_name.toLowerCase().includes(search.toLowerCase()) ||
        (m.designation || "").toLowerCase().includes(search.toLowerCase());
      const matchesDept =
        !departmentFilter || m.department_name === departmentFilter;
      return matchesSearch && matchesDept;
    });
  }, [members, search, departmentFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Team Attendance
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Live permitted team status for {todayStr}. Private leave reasons and
          attachments are hidden by policy.
        </p>
      </div>

      <Card>
        <CardHeader
          title={`Team Members (${filtered.length})`}
          action={
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-56">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search team..."
                  aria-label="Search team members"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 pl-9 pr-3 py-1.5 text-sm"
                />
              </div>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                aria-label="Filter by department"
                className="w-full sm:w-auto rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-sm"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          }
        />
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              title="No matching team members"
              description="Try adjusting your search or department filter."
              icon={<Users className="h-5 w-5" />}
            />
          ) : (
            <div className="overflow-x-auto touch-scroll">
              <table className="w-full text-left text-sm min-w-[550px]">
                <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 whitespace-nowrap">Employee</th>
                    <th className="px-4 py-3 whitespace-nowrap">Department</th>
                    <th className="px-4 py-3 whitespace-nowrap">Status</th>
                    {settings.team_show_checkin_time && (
                      <th className="px-4 py-3 whitespace-nowrap">Check In</th>
                    )}
                    <th className="px-4 py-3 whitespace-nowrap">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map((m) => (
                    <tr
                      key={m.employee_id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {m.full_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {m.designation || "Team Member"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {m.department_name || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={m.attendance_status} />
                      </td>
                      {settings.team_show_checkin_time && (
                        <td className="px-4 py-3">
                          {formatOfficeTime(m.check_in, settings.timezone)}
                        </td>
                      )}
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {m.on_approved_leave
                          ? m.leave_type_name || "Approved Leave"
                          : m.late_minutes > 0
                            ? `${m.late_minutes}m late`
                            : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
