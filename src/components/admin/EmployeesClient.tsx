"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Users } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useApp } from "@/components/providers/AppProviders";
import type {
  AccountStatus,
  Department,
  Profile,
  UserRole,
} from "@/types/database";

export function EmployeesClient({
  employees: initial,
  departments,
}: {
  employees: Profile[];
  departments: Department[];
}) {
  const router = useRouter();
  const { toast } = useApp();
  const [employees, setEmployees] = useState(initial);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [editing, setEditing] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);

  const [formState, setFormState] = useState({
    full_name: "",
    phone: "",
    employee_code: "",
    department_id: "",
    designation: "",
    manager_id: "",
    joining_date: "",
    role: "EMPLOYEE" as UserRole,
    account_status: "ACTIVE" as AccountStatus,
  });

  const openEdit = (emp: Profile) => {
    setEditing(emp);
    setFormState({
      full_name: emp.full_name,
      phone: emp.phone ?? "",
      employee_code: emp.employee_code ?? "",
      department_id: emp.department_id ?? "",
      designation: emp.designation ?? "",
      manager_id: emp.manager_id ?? "",
      joining_date: emp.joining_date ?? "",
      role: emp.role,
      account_status: emp.account_status,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/employees/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Update failed",
          description: data.error || "Unable to update employee.",
          variant: "error",
        });
        return;
      }

      const deptObj =
        departments.find((d) => d.id === formState.department_id) ?? null;
      setEmployees((prev) =>
        prev.map((item) =>
          item.id === editing.id
            ? { ...item, ...data.employee, department: deptObj }
            : item
        )
      );
      setEditing(null);
      toast({ title: "Employee updated", variant: "success" });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    return employees.filter((emp) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        emp.full_name.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        (emp.employee_code || "").toLowerCase().includes(q);
      const matchesDept = !deptFilter || emp.department_id === deptFilter;
      const matchesStatus = !statusFilter || emp.account_status === statusFilter;
      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employees, search, deptFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const managersList = employees.filter(
    (e) =>
      e.account_status === "ACTIVE" &&
      (e.role === "MANAGER" || e.role === "ADMIN")
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Employee Management
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Search, filter, edit roles, assign managers, or suspend employees.
        </p>
      </div>

      <Card>
        <CardHeader
          title={`Employees (${filtered.length})`}
          action={
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search name, email, ID..."
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 pl-9 pr-3 py-1.5 text-sm"
                />
              </div>
              <select
                value={deptFilter}
                onChange={(e) => {
                  setDeptFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-sm"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          }
        />
        <CardContent className="p-0">
          {paginated.length === 0 ? (
            <EmptyState
              title="No employees found"
              description="Try adjusting your search or filter criteria."
              icon={<Users className="h-5 w-5" />}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginated.map((emp) => (
                    <tr key={emp.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium">{emp.full_name}</p>
                        <p className="text-xs text-slate-500">{emp.email}</p>
                      </td>
                      <td className="px-4 py-3">{emp.employee_code || "—"}</td>
                      <td className="px-4 py-3">
                        <p>{emp.department?.name || "Unassigned"}</p>
                        <p className="text-xs text-slate-500">{emp.designation}</p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={emp.role} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={emp.account_status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(emp)}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 px-4 py-3 text-xs">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={`Edit Employee — ${editing?.full_name ?? ""}`}
      >
        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formState.full_name}
                onChange={(e) =>
                  setFormState((s) => ({ ...s, full_name: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Employee ID</label>
              <input
                type="text"
                required
                value={formState.employee_code}
                onChange={(e) =>
                  setFormState((s) => ({ ...s, employee_code: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Department</label>
              <select
                value={formState.department_id}
                onChange={(e) =>
                  setFormState((s) => ({ ...s, department_id: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              >
                <option value="">Unassigned</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Manager</label>
              <select
                value={formState.manager_id}
                onChange={(e) =>
                  setFormState((s) => ({ ...s, manager_id: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              >
                <option value="">None</option>
                {managersList
                  .filter((m) => m.id !== editing?.id)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Role</label>
              <select
                value={formState.role}
                onChange={(e) =>
                  setFormState((s) => ({
                    ...s,
                    role: e.target.value as UserRole,
                  }))
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              >
                <option value="EMPLOYEE">EMPLOYEE</option>
                <option value="MANAGER">MANAGER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                Account Status
              </label>
              <select
                value={formState.account_status}
                onChange={(e) =>
                  setFormState((s) => ({
                    ...s,
                    account_status: e.target.value as AccountStatus,
                  }))
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="PENDING">PENDING</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Designation</label>
              <input
                type="text"
                value={formState.designation}
                onChange={(e) =>
                  setFormState((s) => ({ ...s, designation: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Joining Date</label>
              <input
                type="date"
                value={formState.joining_date}
                onChange={(e) =>
                  setFormState((s) => ({ ...s, joining_date: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing(null)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
