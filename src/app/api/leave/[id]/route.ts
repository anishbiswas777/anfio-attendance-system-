import { NextResponse } from "next/server";
import { requireApiActiveUser } from "@/lib/auth/session";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getOfficeSettings } from "@/lib/settings/server";
import { reviewDecisionSchema } from "@/lib/validations/schemas";
import { canReviewLeaveRequest } from "@/lib/permissions/rbac";
import { isWeekendDate } from "@/lib/attendance/calculations";
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
        { error: parsed.error.issues[0]?.message || "Invalid decision payload." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: leaveReq, error: fetchError } = await admin
      .from("leave_requests")
      .select(
        `
        *,
        employee:profiles!leave_requests_employee_id_fkey(id, full_name, manager_id, department_id)
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !leaveReq) {
      return NextResponse.json(
        { error: "Leave request not found." },
        { status: 404 }
      );
    }

    if (leaveReq.status !== "PENDING") {
      return NextResponse.json(
        { error: "This leave request has already been reviewed." },
        { status: 409 }
      );
    }

    const settings = await getOfficeSettings();
    let departmentManagerId: string | null = null;
    if (leaveReq.employee?.department_id) {
      const { data: dept } = await admin
        .from("departments")
        .select("manager_id")
        .eq("id", leaveReq.employee.department_id)
        .maybeSingle();
      departmentManagerId = dept?.manager_id ?? null;
    }

    const allowed = canReviewLeaveRequest({
      actor: auth.profile,
      targetEmployee: leaveReq.employee,
      departmentManagerId,
      settings,
    });

    if (!allowed) {
      return NextResponse.json(
        { error: "You are not authorized to review this leave request." },
        { status: 403 }
      );
    }

    const nowIso = new Date().toISOString();
    const { data: updated, error: updateError } = await admin
      .from("leave_requests")
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
        { error: "Unable to update leave request." },
        { status: 500 }
      );
    }

    // If approved, reflect leave in attendance rows for working days where no attendance exists
    if (parsed.data.decision === "APPROVED") {
      const { data: holidays } = await admin
        .from("holidays")
        .select("holiday_date")
        .gte("holiday_date", leaveReq.start_date)
        .lte("holiday_date", leaveReq.end_date);

      const holidaySet = new Set((holidays ?? []).map((h) => h.holiday_date));
      const [sy, sm, sd] = leaveReq.start_date.split("-").map(Number);
      const [ey, em, ed] = leaveReq.end_date.split("-").map(Number);
      const cur = new Date(Date.UTC(sy, sm - 1, sd));
      const end = new Date(Date.UTC(ey, em - 1, ed));

      while (cur <= end) {
        const y = cur.getUTCFullYear();
        const m = String(cur.getUTCMonth() + 1).padStart(2, "0");
        const d = String(cur.getUTCDate()).padStart(2, "0");
        const dateStr = `${y}-${m}-${d}`;

        if (!isWeekendDate(dateStr, settings.weekend_days) && !holidaySet.has(dateStr)) {
          await admin.from("attendance").upsert(
            {
              employee_id: leaveReq.employee_id,
              attendance_date: dateStr,
              status: leaveReq.is_half_day ? "HALF_DAY" : "LEAVE",
              late_minutes: 0,
              remarks: "Approved leave",
            },
            { onConflict: "employee_id,attendance_date", ignoreDuplicates: true }
          );
        }
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
    }

    await Promise.all([
      createAuditLog({
        actorId: auth.profile.id,
        action:
          parsed.data.decision === "APPROVED"
            ? "LEAVE_APPROVED"
            : "LEAVE_REJECTED",
        entityType: "leave_request",
        entityId: id,
        oldData: { status: "PENDING" },
        newData: {
          status: parsed.data.decision,
          rejection_reason: updated.rejection_reason,
        },
      }),
      notifyUser({
        userId: leaveReq.employee_id,
        title:
          parsed.data.decision === "APPROVED"
            ? "Leave Request Approved"
            : "Leave Request Rejected",
        message:
          parsed.data.decision === "APPROVED"
            ? `Your leave request (${leaveReq.start_date} to ${leaveReq.end_date}) has been approved.`
            : `Your leave request (${leaveReq.start_date} to ${leaveReq.end_date}) was rejected: ${parsed.data.rejection_reason}`,
        type: parsed.data.decision === "APPROVED" ? "SUCCESS" : "WARNING",
        link: "/leave",
      }),
    ]);

    return NextResponse.json({ request: updated });
  } catch (err) {
    console.error("[leave PATCH] Error:", err);
    return NextResponse.json(
      { error: "Unable to process leave review." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireApiActiveUser();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const supabase = await createClient();

    const { data: deleted, error } = await supabase
      .from("leave_requests")
      .delete()
      .eq("id", id)
      .eq("employee_id", auth.profile.id)
      .eq("status", "PENDING")
      .select("id")
      .maybeSingle();

    if (error || !deleted) {
      return NextResponse.json(
        { error: "Only your own pending leave requests can be cancelled." },
        { status: 400 }
      );
    }

    return NextResponse.json({ cancelled: true });
  } catch (err) {
    console.error("[leave DELETE] Error:", err);
    return NextResponse.json(
      { error: "Unable to cancel leave request." },
      { status: 500 }
    );
  }
}
