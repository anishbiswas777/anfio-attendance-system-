import { NextResponse } from "next/server";
import { requireApiActiveUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import { getOfficeSettings } from "@/lib/settings/server";
import { reviewDecisionSchema } from "@/lib/validations/schemas";
import { canReviewLateReport } from "@/lib/permissions/rbac";
import { createAuditLog } from "@/lib/audit/logger";
import { notifyUser } from "@/lib/notifications/service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireApiActiveUser();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = reviewDecisionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid review payload." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: report, error: fetchError } = await admin
      .from("late_reports")
      .select(
        `
        *,
        employee:profiles!late_reports_employee_id_fkey(id, full_name, manager_id, department_id)
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !report) {
      return NextResponse.json(
        { error: "Late report not found." },
        { status: 404 }
      );
    }

    if (report.status !== "PENDING") {
      return NextResponse.json(
        { error: "This late report has already been reviewed." },
        { status: 409 }
      );
    }

    const settings = await getOfficeSettings();
    let departmentManagerId: string | null = null;
    if (report.employee?.department_id) {
      const { data: dept } = await admin
        .from("departments")
        .select("manager_id")
        .eq("id", report.employee.department_id)
        .maybeSingle();
      departmentManagerId = dept?.manager_id ?? null;
    }

    const allowed = canReviewLateReport({
      actor: auth.profile,
      targetEmployee: report.employee,
      departmentManagerId,
      settings,
    });

    if (!allowed) {
      return NextResponse.json(
        { error: "You are not authorized to review this late report." },
        { status: 403 }
      );
    }

    const nowIso = new Date().toISOString();
    const { data: updated, error: updateError } = await admin
      .from("late_reports")
      .update({
        status: parsed.data.decision,
        reviewed_by: auth.profile.id,
        reviewed_at: nowIso,
        rejection_reason:
          parsed.data.decision === "REJECTED"
            ? parsed.data.rejection_reason ?? null
            : null,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: "Unable to update late report." },
        { status: 500 }
      );
    }

    await createAuditLog({
      actorId: auth.profile.id,
      action:
        parsed.data.decision === "APPROVED"
          ? "LATE_REPORT_APPROVED"
          : "LATE_REPORT_REJECTED",
      entityType: "late_report",
      entityId: id,
      oldData: { status: "PENDING" },
      newData: {
        status: parsed.data.decision,
        rejection_reason: updated.rejection_reason,
      },
    });

    await notifyUser({
      userId: report.employee_id,
      title:
        parsed.data.decision === "APPROVED"
          ? "Late Report Approved"
          : "Late Report Rejected",
      message:
        parsed.data.decision === "APPROVED"
          ? `Your late report for ${report.report_date} has been approved.`
          : `Your late report for ${report.report_date} was rejected: ${parsed.data.rejection_reason}`,
      type: parsed.data.decision === "APPROVED" ? "SUCCESS" : "WARNING",
      link: "/late-reports",
    });

    return NextResponse.json({ report: updated });
  } catch (err) {
    console.error("[late-reports PATCH] Error:", err);
    return NextResponse.json(
      { error: "Unable to process late report review." },
      { status: 500 }
    );
  }
}
