"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileWarning } from "lucide-react";
import { lateReportSchema } from "@/lib/validations/schemas";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { useApp } from "@/components/providers/AppProviders";
import type { LateReport, Profile } from "@/types/database";
import type { z } from "zod";

type LateFormValues = z.infer<typeof lateReportSchema>;

const REASONS = [
  "Traffic",
  "Public Transport",
  "Personal Emergency",
  "Health",
  "Family Emergency",
  "Other",
];

export function LateReportsClient({
  profile,
  ownReports: initialOwn,
  teamReports: initialTeam,
  todayStr,
  defaultExpected,
}: {
  profile: Profile;
  ownReports: LateReport[];
  teamReports: LateReport[];
  todayStr: string;
  defaultExpected: string;
}) {
  const router = useRouter();
  const { toast } = useApp();
  const [ownReports, setOwnReports] = useState(initialOwn);
  const [teamReports, setTeamReports] = useState(initialTeam);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [rejectTarget, setRejectTarget] = useState<LateReport | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LateFormValues>({
    resolver: zodResolver(lateReportSchema),
    defaultValues: {
      report_date: todayStr,
      expected_arrival: defaultExpected,
      actual_arrival: "",
      reason: "Traffic",
      description: "",
    },
  });

  const onSubmit = async (values: LateFormValues) => {
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

      const res = await fetch("/api/late-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, attachment_url: attachmentUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Submission failed",
          description: data.error || "Unable to submit late report.",
          variant: "error",
        });
        return;
      }

      setOwnReports((prev) => [data.report, ...prev]);
      setAttachmentFile(null);
      reset({
        report_date: todayStr,
        expected_arrival: defaultExpected,
        actual_arrival: "",
        reason: "Traffic",
        description: "",
      });
      toast({
        title: "Late report submitted",
        description: "Your late report has been sent for review.",
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

  const handleReview = async (
    id: string,
    decision: "APPROVED" | "REJECTED",
    reason?: string
  ) => {
    setReviewingId(id);
    try {
      const res = await fetch(`/api/late-reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, rejection_reason: reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Review failed",
          description: data.error || "Unable to review late report.",
          variant: "error",
        });
        return;
      }
      setTeamReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...data.report } : r))
      );
      setRejectTarget(null);
      setRejectionReason("");
      toast({
        title: `Late report ${decision.toLowerCase()}`,
        variant: "success",
      });
      router.refresh();
    } catch {
      toast({ title: "Review failed", variant: "error" });
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Late Reports
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Submit a late arrival explanation and track review status.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Submit Late Report" />
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="report_date" className="block text-sm font-medium mb-1">
                  Date *
                </label>
                <input
                  id="report_date"
                  type="date"
                  {...register("report_date")}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                />
                {errors.report_date && (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.report_date.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="expected_arrival"
                    className="block text-sm font-medium mb-1"
                  >
                    Expected *
                  </label>
                  <input
                    id="expected_arrival"
                    type="time"
                    {...register("expected_arrival")}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="actual_arrival"
                    className="block text-sm font-medium mb-1"
                  >
                    Actual *
                  </label>
                  <input
                    id="actual_arrival"
                    type="time"
                    {...register("actual_arrival")}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                  />
                  {errors.actual_arrival && (
                    <p className="mt-1 text-xs text-rose-600">
                      {errors.actual_arrival.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="reason" className="block text-sm font-medium mb-1">
                  Reason *
                </label>
                <select
                  id="reason"
                  {...register("reason")}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                >
                  {REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  {...register("description")}
                  placeholder="Provide brief context..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label htmlFor="late-attach" className="block text-sm font-medium mb-1">
                  Attachment (optional)
                </label>
                <input
                  id="late-attach"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={(e) => setAttachmentFile(e.target.files?.[0] ?? null)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs"
                />
              </div>

              <Button type="submit" loading={isSubmitting} className="w-full">
                {isSubmitting ? "Submitting..." : "Submit Late Report"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="My Late Report History"
            description="All late reports you have submitted"
          />
          <CardContent className="p-0">
            {ownReports.length === 0 ? (
              <EmptyState
                title="No late reports yet"
                description="You haven't submitted any late arrival reports."
                icon={<FileWarning className="h-5 w-5" />}
              />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {ownReports.map((rep) => (
                  <div
                    key={rep.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {rep.report_date}
                        </span>
                        <span className="text-xs text-slate-500">
                          {rep.expected_arrival} → {rep.actual_arrival}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-1">
                        {rep.reason}
                        {rep.description ? ` — ${rep.description}` : ""}
                      </p>
                      {rep.rejection_reason && (
                        <p className="text-xs text-rose-600 mt-1">
                          Rejection reason: {rep.rejection_reason}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={rep.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Manager / Admin Team Review Section */}
      {(profile.role === "MANAGER" || profile.role === "ADMIN") &&
        teamReports.length > 0 && (
          <Card>
            <CardHeader
              title="Team Late Reports"
              description="Review late arrival reports from your team"
            />
            <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800">
              {teamReports.map((rep) => (
                <div
                  key={rep.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {rep.employee?.full_name} ({rep.report_date})
                    </p>
                    <p className="text-xs text-slate-500">
                      {rep.reason} • Expected {rep.expected_arrival}, Actual{" "}
                      {rep.actual_arrival}
                    </p>
                    {rep.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {rep.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {rep.status === "PENDING" ? (
                      <>
                        <Button
                          size="sm"
                          loading={reviewingId === rep.id}
                          onClick={() => handleReview(rep.id, "APPROVED")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setRejectTarget(rep)}
                        >
                          Reject
                        </Button>
                      </>
                    ) : (
                      <StatusBadge status={rep.status} />
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
        title="Reject Late Report"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Provide a reason for rejecting this late report.
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
              loading={Boolean(reviewingId)}
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
