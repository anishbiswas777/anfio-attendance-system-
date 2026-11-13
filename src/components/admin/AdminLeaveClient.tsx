"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useApp } from "@/components/providers/AppProviders";
import type { LeaveRequest } from "@/types/database";

export function AdminLeaveClient({
  requests: initial,
}: {
  requests: LeaveRequest[];
}) {
  const router = useRouter();
  const { toast } = useApp();
  const [requests, setRequests] = useState(initial);
  const [statusFilter, setStatusFilter] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<LeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleReview = async (
    id: string,
    decision: "APPROVED" | "REJECTED",
    reason?: string
  ) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/leave/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, rejection_reason: reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Review failed",
          description: data.error || "Unable to review leave request.",
          variant: "error",
        });
        return;
      }
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...data.request } : r))
      );
      setRejectTarget(null);
      setRejectionReason("");
      toast({
        title: `Leave request ${decision.toLowerCase()}`,
        variant: "success",
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(() => {
    if (!statusFilter) return requests;
    return requests.filter((r) => r.status === statusFilter);
  }, [requests, statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Leave Requests Administration
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Review, approve, or reject employee leave requests.
        </p>
      </div>

      <Card>
        <CardHeader
          title={`All Leave Requests (${filtered.length})`}
          action={
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              className="w-full sm:w-auto rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#0c0c12] px-3 py-1.5 text-sm text-slate-900 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          }
        />
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              title="No leave requests"
              description="No leave requests match this filter."
              icon={<CalendarDays className="h-5 w-5" />}
            />
          ) : (
            <>
              {/* Mobile Card View (< md) to avoid table overflow/overlap */}
              <div className="block md:hidden divide-y divide-slate-100 dark:divide-white/[0.06]">
                {filtered.map((lr) => (
                  <div key={lr.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                          {lr.employee?.full_name || "—"}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {lr.employee?.department?.name || "General"}
                        </p>
                      </div>
                      <StatusBadge status={lr.status} />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {lr.leave_type?.name || "Leave"}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] font-mono text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-white/[0.08]">
                        {lr.start_date} → {lr.end_date} ({lr.total_days}d)
                      </span>
                    </div>

                    {lr.reason && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50/80 dark:bg-white/[0.02] p-2.5 rounded-lg border border-slate-100 dark:border-white/[0.04]">
                        {lr.reason}
                      </p>
                    )}

                    {lr.status === "PENDING" ? (
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          className="flex-1"
                          loading={busyId === lr.id}
                          disabled={Boolean(busyId)}
                          onClick={() => handleReview(lr.id, "APPROVED")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          className="flex-1"
                          disabled={Boolean(busyId)}
                          onClick={() => setRejectTarget(lr)}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <div className="text-right">
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          Reviewed
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop / Tablet Table View (>= md) */}
              <div className="hidden md:block overflow-x-auto touch-scroll">
                <table className="w-full text-left text-sm min-w-[650px]">
                  <thead className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] text-xs uppercase text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3 whitespace-nowrap">Employee</th>
                      <th className="px-4 py-3 whitespace-nowrap">Type</th>
                      <th className="px-4 py-3 whitespace-nowrap">Dates</th>
                      <th className="px-4 py-3 whitespace-nowrap">Days</th>
                      <th className="px-4 py-3 whitespace-nowrap">Reason</th>
                      <th className="px-4 py-3 whitespace-nowrap">Status</th>
                      <th className="px-4 py-3 whitespace-nowrap text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                    {filtered.map((lr) => (
                      <tr key={lr.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900 dark:text-white">
                            {lr.employee?.full_name || "—"}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {lr.employee?.department?.name || "—"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-slate-800 dark:text-slate-200">
                          {lr.leave_type?.name || "—"}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {lr.start_date} → {lr.end_date}
                        </td>
                        <td className="px-4 py-3 text-slate-800 dark:text-slate-200">
                          {lr.total_days}
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate text-slate-600 dark:text-slate-400">
                          {lr.reason}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={lr.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          {lr.status === "PENDING" ? (
                            <div className="inline-flex gap-2">
                              <Button
                                size="sm"
                                loading={busyId === lr.id}
                                disabled={Boolean(busyId)}
                                onClick={() => handleReview(lr.id, "APPROVED")}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                disabled={Boolean(busyId)}
                                onClick={() => setRejectTarget(lr)}
                              >
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              Reviewed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Modal
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        title="Reject Leave Request"
      >
        <div className="space-y-4">
          <textarea
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Reason for rejection (required)..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={Boolean(busyId)}
              onClick={() =>
                rejectTarget &&
                handleReview(rejectTarget.id, "REJECTED", rejectionReason)
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
