"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { useApp } from "@/components/providers/AppProviders";
import { formatOfficeDateTime } from "@/lib/attendance/calculations";
import type { OfficeSettings, Profile } from "@/types/database";

export function RegistrationsClient({
  registrations: initial,
  settings,
}: {
  registrations: Profile[];
  settings: OfficeSettings;
}) {
  const router = useRouter();
  const { toast } = useApp();
  const [items, setItems] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<Profile | null>(null);
  const [rejectItem, setRejectItem] = useState<Profile | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleDecision = async (
    id: string,
    decision: "APPROVED" | "REJECTED",
    reason?: string
  ) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/registrations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, rejection_reason: reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Action failed",
          description: data.error || "Unable to process registration.",
          variant: "error",
        });
        return;
      }

      setItems((prev) => prev.filter((p) => p.id !== id));
      setRejectItem(null);
      setRejectionReason("");
      toast({
        title:
          decision === "APPROVED"
            ? "Registration approved"
            : "Registration rejected",
        variant: "success",
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Pending Registrations
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Approve or reject new employee account registrations.
        </p>
      </div>

      <Card>
        <CardHeader title={`Awaiting Review (${items.length})`} />
        <CardContent className="p-0">
          {items.length === 0 ? (
            <EmptyState
              title="No pending registrations"
              description="All employee registrations have been reviewed."
              icon={<UserCheck className="h-5 w-5" />}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Employee ID</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Joining Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium">{p.full_name}</p>
                        <p className="text-xs text-slate-500">{p.email}</p>
                      </td>
                      <td className="px-4 py-3">{p.employee_code || "—"}</td>
                      <td className="px-4 py-3">
                        <p>{p.department?.name || "—"}</p>
                        <p className="text-xs text-slate-500">{p.designation}</p>
                      </td>
                      <td className="px-4 py-3">{p.joining_date || "—"}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={p.account_status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={Boolean(busyId)}
                            onClick={() => setViewItem(p)}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            loading={busyId === p.id}
                            disabled={Boolean(busyId)}
                            onClick={() => handleDecision(p.id, "APPROVED")}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={Boolean(busyId)}
                            onClick={() => setRejectItem(p)}
                          >
                            Reject
                          </Button>
                        </div>
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
        open={Boolean(viewItem)}
        onClose={() => setViewItem(null)}
        title="Registration Details"
      >
        {viewItem && (
          <div className="space-y-2.5 text-sm">
            <p>
              <strong>Name:</strong> {viewItem.full_name}
            </p>
            <p>
              <strong>Email:</strong> {viewItem.email}
            </p>
            <p>
              <strong>Phone:</strong> {viewItem.phone || "—"}
            </p>
            <p>
              <strong>Employee ID:</strong> {viewItem.employee_code || "—"}
            </p>
            <p>
              <strong>Department:</strong> {viewItem.department?.name || "—"}
            </p>
            <p>
              <strong>Designation:</strong> {viewItem.designation || "—"}
            </p>
            <p>
              <strong>Joining Date:</strong> {viewItem.joining_date || "—"}
            </p>
            <p>
              <strong>Registered At:</strong>{" "}
              {formatOfficeDateTime(viewItem.created_at, settings.timezone)}
            </p>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(rejectItem)}
        onClose={() => setRejectItem(null)}
        title="Reject Registration"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Optionally provide a reason for rejecting{" "}
            <strong>{rejectItem?.full_name}</strong>.
          </p>
          <textarea
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Optional rejection reason..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejectItem(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={Boolean(busyId)}
              onClick={() =>
                rejectItem &&
                handleDecision(rejectItem.id, "REJECTED", rejectionReason)
              }
            >
              Confirm Reject
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
