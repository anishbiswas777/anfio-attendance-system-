"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useApp } from "@/components/providers/AppProviders";
import type { Department, Profile } from "@/types/database";

export function DepartmentsClient({
  departments: initial,
  managers,
}: {
  departments: Department[];
  managers: Pick<Profile, "id" | "full_name">[];
}) {
  const router = useRouter();
  const { toast } = useApp();
  const [departments, setDepartments] = useState(initial);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    manager_id: "",
    is_active: true,
  });

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", description: "", manager_id: "", is_active: true });
    setModalOpen(true);
  };

  const openEdit = (d: Department) => {
    setEditing(d);
    setForm({
      name: d.name,
      description: d.description ?? "",
      manager_id: d.manager_id ?? "",
      is_active: d.is_active,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing
        ? `/api/admin/departments/${editing.id}`
        : "/api/admin/departments";
      const method = editing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Save failed",
          description: data.error || "Unable to save department.",
          variant: "error",
        });
        return;
      }

      if (editing) {
        setDepartments((prev) =>
          prev.map((d) => (d.id === editing.id ? data.department : d))
        );
      } else {
        setDepartments((prev) => [...prev, data.department]);
      }

      setModalOpen(false);
      toast({
        title: editing ? "Department updated" : "Department created",
        variant: "success",
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Departments
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create, edit, deactivate departments and assign department managers.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" />
          New Department
        </Button>
      </div>

      <Card>
        <CardHeader title={`All Departments (${departments.length})`} />
        <CardContent className="p-0">
          {departments.length === 0 ? (
            <EmptyState
              title="No departments yet"
              description="Create your first department to organize employees."
              icon={<Building2 className="h-5 w-5" />}
            />
          ) : (
            <div className="overflow-x-auto touch-scroll">
              <table className="w-full text-left text-sm min-w-[550px]">
                <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 whitespace-nowrap">Name</th>
                    <th className="px-4 py-3 whitespace-nowrap">Description</th>
                    <th className="px-4 py-3 whitespace-nowrap">Manager</th>
                    <th className="px-4 py-3 whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 whitespace-nowrap text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {departments.map((d) => {
                    const mgr = managers.find((m) => m.id === d.manager_id);
                    return (
                      <tr key={d.id}>
                        <td className="px-4 py-3 font-medium">{d.name}</td>
                        <td className="px-4 py-3 text-slate-500">
                          {d.description || "—"}
                        </td>
                        <td className="px-4 py-3">{mgr?.full_name || "Unassigned"}</td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            status={d.is_active ? "ACTIVE" : "SUSPENDED"}
                            label={d.is_active ? "Active" : "Inactive"}
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(d)}
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Department" : "New Department"}
      >
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1">Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Manager</label>
            <select
              value={form.manager_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, manager_id: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            >
              <option value="">Unassigned</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_active: e.target.checked }))
              }
            />
            <span>Department is active</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
