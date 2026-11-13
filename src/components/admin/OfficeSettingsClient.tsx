"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useApp } from "@/components/providers/AppProviders";
import type { OfficeSettings } from "@/types/database";

const DAY_LABELS = [
  { day: 0, label: "Sunday" },
  { day: 1, label: "Monday" },
  { day: 2, label: "Tuesday" },
  { day: 3, label: "Wednesday" },
  { day: 4, label: "Thursday" },
  { day: 5, label: "Friday" },
  { day: 6, label: "Saturday" },
];

export function OfficeSettingsClient({
  settings: initial,
}: {
  settings: OfficeSettings;
}) {
  const router = useRouter();
  const { toast } = useApp();
  const [form, setForm] = useState<OfficeSettings>(initial);
  const [saving, setSaving] = useState(false);

  const toggleWeekend = (day: number) => {
    setForm((prev) => {
      const exists = prev.weekend_days.includes(day);
      return {
        ...prev,
        weekend_days: exists
          ? prev.weekend_days.filter((d) => d !== day)
          : [...prev.weekend_days, day].sort(),
      };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Save failed",
          description: data.error || "Unable to save office settings.",
          variant: "error",
        });
        return;
      }
      toast({
        title: "Office settings updated",
        description: "Configuration saved and audit logged.",
        variant: "success",
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Office Settings & Policies
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Configure office hours, grace period, timezone, weekend days, and approval
          policies.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader title="Attendance & Timezone Rules" />
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-medium mb-1">
                Office Start Time
              </label>
              <input
                type="time"
                value={form.office_start_time}
                onChange={(e) =>
                  setForm((f) => ({ ...f, office_start_time: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                Office End Time
              </label>
              <input
                type="time"
                value={form.office_end_time}
                onChange={(e) =>
                  setForm((f) => ({ ...f, office_end_time: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                Grace Period (minutes)
              </label>
              <input
                type="number"
                min={0}
                max={120}
                value={form.grace_period_minutes}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    grace_period_minutes: Number(e.target.value),
                  }))
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                Half-Day Threshold (minutes)
              </label>
              <input
                type="number"
                min={60}
                max={480}
                value={form.half_day_threshold_minutes}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    half_day_threshold_minutes: Number(e.target.value),
                  }))
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Timezone</label>
              <input
                type="text"
                value={form.timezone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, timezone: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Weekend Days"
            description="Selected days are treated as non-working weekend days"
          />
          <CardContent className="flex flex-wrap gap-3">
            {DAY_LABELS.map((d) => (
              <label
                key={d.day}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={form.weekend_days.includes(d.day)}
                  onChange={() => toggleWeekend(d.day)}
                />
                <span>{d.label}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Leave, Team & Manager Policies" />
          <CardContent className="space-y-3 text-sm">
            {[
              {
                key: "allow_past_leave",
                label: "Allow employees to submit past-dated leave requests",
              },
              {
                key: "allow_overlapping_leave",
                label: "Allow overlapping leave requests",
              },
              {
                key: "team_show_checkin_time",
                label: "Show check-in time on the Team Attendance page",
              },
              {
                key: "manager_can_approve_leave",
                label: "Allow Managers to approve/reject assigned team leave requests",
              },
              {
                key: "manager_can_approve_late",
                label: "Allow Managers to approve/reject assigned team late reports",
              },
            ].map((item) => {
              const k = item.key as keyof OfficeSettings;
              return (
                <label key={item.key} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(form[k])}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [k]: e.target.checked }))
                    }
                  />
                  <span>{item.label}</span>
                </label>
              );
            })}
          </CardContent>
        </Card>

        <Button type="submit" loading={saving} size="lg">
          {saving ? "Saving Settings..." : "Save Office Settings"}
        </Button>
      </form>
    </div>
  );
}
