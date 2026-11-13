"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Edit3 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useApp } from "@/components/providers/AppProviders";
import {
  formatOfficeTime,
  formatWorkingHours,
} from "@/lib/attendance/calculations";
import type {
  AttendanceRecord,
  AttendanceStatus,
  OfficeSettings,
  Profile,
} from "@/types/database";

export function AdminAttendanceClient({
  records: initialRecords,
  employees,
  settings,
  todayStr,
}: {
  records: AttendanceRecord[];
  employees: Pick<Profile, "id" | "full_name" | "employee_code">[];
  settings: OfficeSettings;
  todayStr: string;
}) {
  const router = useRouter();
  const { toast } = useApp();
  const [records, setRecords] = useState(initialRecords);
  const [dateFilter, setDateFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    employee_id: employees[0]?.id ?? "",
    attendance_date: todayStr,
    check_in: "09:30",
    check_out: "18:30",
    status: "PRESENT" as AttendanceStatus,
    remarks: "",
  });

  const openCorrectionFor = (rec?: AttendanceRecord) => {
    if (rec) {
      setForm({
        employee_id: rec.employee_id,
        attendance_date: rec.attendance_date,
        check_in: rec.check_in
          ? formatOfficeTime(rec.check_in, settings.timezone, "HH:mm")
          : "",
        check_out: rec.check_out
          ? formatOfficeTime(rec.check_out, settings.timezone, "HH:mm")
          : "",
        status: rec.status,
        remarks: rec.remarks || "",
      });
    } else {
      setForm({
        employee_id: employees[0]?.id ?? "",
        attendance_date: todayStr,
        check_in: settings.office_start_time,
        check_out: settings.office_end_time,
        status: "PRESENT",
        remarks: "",
      });
    }
    setModalOpen(true);
  };

  const handleCorrect = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/attendance/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: form.employee_id,
          attendance_date: form.attendance_date,
          check_in: form.check_in || null,
          check_out: form.check_out || null,
          status: form.status,
          remarks: form.remarks,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Correction failed",
          description: data.error || "Unable to save attendance correction.",
          variant: "error",
        });
        return;
      }

      const emp = employees.find((x) => x.id === form.employee_id);
      const saved = { ...data.attendance, employee: emp };

      setRecords((prev) => {
        const idx = prev.findIndex((r) => r.id === saved.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], ...saved };
          return next;
        }
        return [saved, ...prev];
      });

      setModalOpen(false);
      toast({
        title: "Attendance corrected",
        description: "Audit log recorded.",
        variant: "success",
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (dateFilter && r.attendance_date !== dateFilter) return false;
      if (employeeFilter && r.employee_id !== employeeFilter) return false;
      return true;
    });
  }, [records, dateFilter, employeeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Attendance Administration
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Inspect organization attendance and perform audited corrections.
          </p>
        </div>
        <Button onClick={() => openCorrectionFor()}>
          <Edit3 className="h-4 w-4" />
          New Attendance Correction
        </Button>
      </div>

      <Card>
        <CardHeader
          title={`Attendance Logs (${filtered.length})`}
          action={
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full sm:w-auto">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                aria-label="Filter by date"
                className="w-full sm:w-auto rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-sm"
              />
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                aria-label="Filter by employee"
                className="w-full sm:w-auto rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-sm"
              >
                <option value="">All Employees</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.full_name} ({e.employee_code || "—"})
                  </option>
                ))}
              </select>
            </div>
          }
        />
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              title="No attendance records"
              description="No records match the current filter."
              icon={<Clock className="h-5 w-5" />}
            />
          ) : (
            <div className="overflow-x-auto touch-scroll">
              <table className="w-full text-left text-sm min-w-[650px]">
                <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 whitespace-nowrap">Employee</th>
                    <th className="px-4 py-3 whitespace-nowrap">Date</th>
                    <th className="px-4 py-3 whitespace-nowrap">Check In</th>
                    <th className="px-4 py-3 whitespace-nowrap">Check Out</th>
                    <th className="px-4 py-3 whitespace-nowrap">Hours</th>
                    <th className="px-4 py-3 whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 whitespace-nowrap text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium">{r.employee?.full_name || "—"}</p>
                        <p className="text-xs text-slate-500">
                          {r.employee?.employee_code || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">{r.attendance_date}</td>
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
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openCorrectionFor(r)}
                        >
                          Correct
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Attendance Correction"
        description="Every correction is permanently recorded in the audit log."
      >
        <form onSubmit={handleCorrect} className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1">Employee</label>
            <select
              value={form.employee_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, employee_id: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name} ({emp.employee_code || "—"})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Date</label>
              <input
                type="date"
                required
                value={form.attendance_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, attendance_date: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: e.target.value as AttendanceStatus,
                  }))
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              >
                <option value="PRESENT">PRESENT</option>
                <option value="LATE">LATE</option>
                <option value="HALF_DAY">HALF_DAY</option>
                <option value="LEAVE">LEAVE</option>
                <option value="HOLIDAY">HOLIDAY</option>
                <option value="ABSENT">ABSENT</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                Check In ({settings.timezone})
              </label>
              <input
                type="time"
                value={form.check_in}
                onChange={(e) =>
                  setForm((f) => ({ ...f, check_in: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                Check Out ({settings.timezone})
              </label>
              <input
                type="time"
                value={form.check_out}
                onChange={(e) =>
                  setForm((f) => ({ ...f, check_out: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">
              Correction Reason *
            </label>
            <textarea
              rows={2}
              required
              value={form.remarks}
              onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
              placeholder="e.g., Employee forgot checkout"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save Correction
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
