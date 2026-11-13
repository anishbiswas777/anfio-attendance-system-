"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarRange, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useApp } from "@/components/providers/AppProviders";
import type { Holiday } from "@/types/database";

export function HolidaysClient({ holidays: initial }: { holidays: Holiday[] }) {
  const router = useRouter();
  const { toast } = useApp();
  const [holidays, setHolidays] = useState(initial);
  const [holidayDate, setHolidayDate] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          holiday_date: holidayDate,
          name,
          description,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Cannot add holiday",
          description: data.error || "Please check date and name.",
          variant: "error",
        });
        return;
      }
      setHolidays((prev) =>
        [...prev, data.holiday].sort((a, b) =>
          a.holiday_date.localeCompare(b.holiday_date)
        )
      );
      setHolidayDate("");
      setName("");
      setDescription("");
      toast({ title: "Holiday added", variant: "success" });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/holidays/${id}`, { method: "DELETE" });
      if (res.ok) {
        setHolidays((prev) => prev.filter((h) => h.id !== id));
        toast({ title: "Holiday removed", variant: "info" });
        router.refresh();
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Holiday Management
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Configure company holidays recognized by attendance and leave calculations.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Add Holiday" />
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={holidayDate}
                  onChange={(e) => setHolidayDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Holiday Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Diwali"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Office Holiday"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                />
              </div>
              <Button type="submit" loading={saving} className="w-full">
                Add Holiday
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title={`Configured Holidays (${holidays.length})`} />
          <CardContent className="p-0">
            {holidays.length === 0 ? (
              <EmptyState
                title="No holidays configured"
                description="Add company holidays using the form."
                icon={<CalendarRange className="h-5 w-5" />}
              />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {holidays.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold">{h.name}</p>
                      <p className="text-xs text-slate-500">
                        {h.holiday_date}
                        {h.description ? ` • ${h.description}` : ""}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`Delete ${h.name}`}
                      loading={deletingId === h.id}
                      disabled={Boolean(deletingId)}
                      onClick={() => handleDelete(h.id)}
                    >
                      <Trash2 className="h-4 w-4 text-rose-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
