"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays } from "lucide-react";
import { leaveRequestSchema } from "@/lib/validations/schemas";
import { calculateLeaveDays } from "@/lib/leave/calculations";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { useApp } from "@/components/providers/AppProviders";
import type {
  Holiday,
  LeaveRequest,
  LeaveType,
  OfficeSettings,
  Profile,
} from "@/types/database";
import type { z } from "zod";

type LeaveFormValues = z.input<typeof leaveRequestSchema>;

export function LeaveClient({
  profile,
  leaveTypes,
  ownRequests: initialOwn,
  teamRequests: initialTeam,
  holidays,
  settings,
  todayStr,
}: {
  profile: Profile;
  leaveTypes: LeaveType[];
  ownRequests: LeaveRequest[];
  teamRequests: LeaveRequest[];
  holidays: Holiday[];
  settings: OfficeSettings;
  todayStr: string;
}) {
  const router = useRouter();
  const { toast } = useApp();
  const [ownRequests, setOwnRequests] = useState(initialOwn);
  const [teamRequests, setTeamRequests] = useState(initialTeam);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [rejectTarget, setRejectTarget] = useState<LeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const holidayDates = useMemo(
    () => holidays.map((h) => h.holiday_date),
    [holidays]
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      leave_type_id: leaveTypes[0]?.id ?? "",
      start_date: todayStr,
      end_date: todayStr,
      is_half_day: false,
      reason: "",
    },
  });

  const startDate = useWatch({ control, name: "start_date" });
  const endDate = useWatch({ control, name: "end_date" });
  const isHalfDay = useWatch({ control, name: "is_half_day" });

  const previewDays = useMemo(
    () =>
      calculateLeaveDays(startDate, endDate, {
        isHalfDay: Boolean(isHalfDay),
        weekendDays: settings.weekend_days,
        holidays: holidayDates,
      }),
    [startDate, endDate, isHalfDay, settings.weekend_days, holidayDates]
  );

  const onSubmit = async (values: LeaveFormValues) => {
    try {
      let attachmentUrl: string | null = null;
      if (attachmentFile) {
        const fd = new FormData();
        fd.append("bucket", "attachments");
        fd.append("file", attachmentFile);
        const upRes = await fetch("/api/uploads", { method: "POST", body: fd });
        const upData = await upRes.json();
        if (!upRes.ok) {
          toast({
            title: "Upload failed",
            description: upData.error || "Could not upload attachment.",
            variant: "error",
          });
          return;
        }
        attachmentUrl = upData.path;
      }

      const res = await fetch("/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, attachment_url: attachmentUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Leave request failed",
          description: data.error || "Unable to submit leave request.",
          variant: "error",
        });
        return;
      }

      const selectedType = leaveTypes.find((t) => t.id === values.leave_type_id);
      setOwnRequests((prev) => [
        { ...data.request, leave_type: selectedType },
        ...prev,
      ]);
      setAttachmentFile(null);
      reset({
        leave_type_id: leaveTypes[0]?.id ?? "",
        start_date: todayStr,
        end_date: todayStr,
        is_half_day: false,
        reason: "",
      });
      toast({
        title: "Leave request submitted successfully.",
        description: "Your request is pending review.",
        variant: "success",
      });
      router.refresh();
    } catch {
      toast({
        title: "Submission failed",
        description: "Network error. Please try again.",
        variant: "error",
      });
    }
  };

  const handleCancel = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/leave/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Cannot cancel",
          description: data.error || "Unable to cancel request.",
          variant: "error",
        });
        return;
      }
      setOwnRequests((prev) => prev.filter((r) => r.id !== id));
      toast({ title: "Leave request cancelled", variant: "info" });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

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
          description: data.error || "Unable to process review.",
          variant: "error",
        });
        return;
      }
      setTeamRequests((prev) =>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Leave Management
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Apply for leave, track approval status, and view your leave history.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Apply for Leave" />
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label
                  htmlFor="leave_type_id"
                  className="block text-sm font-medium mb-1"
                >
                  Leave Type *
                </label>
                <select
                  id="leave_type_id"
                  {...register("leave_type_id")}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                >
                  {leaveTypes.map((lt) => (
                    <option key={lt.id} value={lt.id}>
                      {lt.name}
                    </option>
                  ))}
                </select>
                {errors.leave_type_id && (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.leave_type_id.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium mb-1">
                    Start Date *
                  </label>
                  <input
                    id="start_date"
                    type="date"
                    {...register("start_date")}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium mb-1">
                    End Date *
                  </label>
                  <input
                    id="end_date"
                    type="date"
                    {...register("end_date")}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              {errors.end_date && (
                <p className="text-xs text-rose-600">{errors.end_date.message}</p>
              )}

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  {...register("is_half_day")}
                  className="rounded border-slate-300"
                />
                <span>Half-day leave</span>
              </label>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2.5 text-xs flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  Calculated Working Days:
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {previewDays} day(s)
                </span>
              </div>

              <div>
                <label htmlFor="reason" className="block text-sm font-medium mb-1">
                  Reason *
                </label>
                <textarea
                  id="reason"
                  rows={3}
                  {...register("reason")}
                  placeholder="Reason for leave..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                />
                {errors.reason && (
                  <p className="mt-1 text-xs text-rose-600">{errors.reason.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="leave-attach" className="block text-sm font-medium mb-1">
                  Attachment (optional)
                </label>
                <input
                  id="leave-attach"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={(e) => setAttachmentFile(e.target.files?.[0] ?? null)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs"
                />
              </div>

              <Button type="submit" loading={isSubmitting} className="w-full">
                {isSubmitting ? "Submitting..." : "Apply Leave"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="My Leave History"
            description="Track all your leave requests"
          />
          <CardContent className="p-0">
            {ownRequests.length === 0 ? (
              <EmptyState
                title="No leave requests yet"
                description="You haven't submitted any leave requests."
                icon={<CalendarDays className="h-5 w-5" />}
              />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {ownRequests.map((lr) => (
                  <div
                    key={lr.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {lr.leave_type?.name || "Leave"}
                        </span>
                        <span className="text-xs text-slate-500">
                          {lr.start_date} to {lr.end_date} ({lr.total_days}d)
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {lr.reason}
                      </p>
                      {lr.rejection_reason && (
                        <p className="text-xs text-rose-600 mt-1">
                          Rejection reason: {lr.rejection_reason}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={lr.status} />
                      {lr.status === "PENDING" && (
                        <Button
                          size="sm"
                          variant="outline"
                          loading={busyId === lr.id}
                          onClick={() => handleCancel(lr.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Manager / Admin Team Leave Reviews */}
      {(profile.role === "MANAGER" || profile.role === "ADMIN") &&
        teamRequests.length > 0 && (
          <Card>
            <CardHeader
              title="Team Leave Requests"
              description="Review leave requests from your assigned team"
            />
            <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800">
              {teamRequests.map((lr) => (
                <div
                  key={lr.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {lr.employee?.full_name} — {lr.leave_type?.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {lr.start_date} to {lr.end_date} ({lr.total_days} day(s))
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {lr.reason}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {lr.status === "PENDING" ? (
                      <>
                        <Button
                          size="sm"
                          loading={busyId === lr.id}
                          onClick={() => handleReview(lr.id, "APPROVED")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setRejectTarget(lr)}
                        >
                          Reject
                        </Button>
                      </>
                    ) : (
                      <StatusBadge status={lr.status} />
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

      <Modal
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        title="Reject Leave Request"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Provide a reason for rejecting this leave request.
          </p>
          <textarea
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Reason for rejection..."
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
