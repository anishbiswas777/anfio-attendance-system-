import { NextResponse } from "next/server";
import { requireApiActiveUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { lateReportSchema } from "@/lib/validations/schemas";
import { createAuditLog } from "@/lib/audit/logger";
import { notifyAdmins, notifyManager } from "@/lib/notifications/service";

export async function GET(request: Request) {
  try {
    const auth = await requireApiActiveUser();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") || "own";
    const status = searchParams.get("status");
    const supabase = await createClient();

    let query = supabase
      .from("late_reports")
      .select(
        `
        *,
        employee:profiles!late_reports_employee_id_fkey(id, full_name, employee_code, email, designation, department_id, department:departments!profiles_department_id_fkey(id, name)),
        reviewer:profiles!late_reports_reviewed_by_fkey(id, full_name)
      `
      )
      .order("created_at", { ascending: false });

    if (scope === "own" || auth.profile.role === "EMPLOYEE") {
      query = query.eq("employee_id", auth.profile.id);
    }

    if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      query = query.eq("status", status);
    }

    const { data, error } = await query.limit(200);
    if (error) {
      return NextResponse.json(
        { error: "Unable to load late reports." },
        { status: 500 }
      );
    }

    return NextResponse.json({ reports: data ?? [] });
  } catch (err) {
    console.error("[late-reports GET] Error:", err);
    return NextResponse.json(
      { error: "Unable to load late reports." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiActiveUser();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    if (auth.profile.role === "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Administrator accounts are for monitoring and approvals only and do not submit late reports.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = lateReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid late report." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Link attendance_id if an attendance record exists for that report_date
    const { data: attendanceRow } = await supabase
      .from("attendance")
      .select("id")
      .eq("employee_id", auth.profile.id)
      .eq("attendance_date", parsed.data.report_date)
      .maybeSingle();

    const { data: created, error } = await supabase
      .from("late_reports")
      .insert({
        employee_id: auth.profile.id,
        attendance_id: attendanceRow?.id ?? null,
        report_date: parsed.data.report_date,
        expected_arrival: parsed.data.expected_arrival,
        actual_arrival: parsed.data.actual_arrival,
        reason: parsed.data.reason,
        description: parsed.data.description ?? null,
        attachment_url: parsed.data.attachment_url ?? null,
        status: "PENDING",
      })
      .select("*")
      .single();

    if (error || !created) {
      return NextResponse.json(
        { error: "Unable to submit late report." },
        { status: 500 }
      );
    }

    await createAuditLog({
      actorId: auth.profile.id,
      action: "LATE_REPORT_SUBMITTED",
      entityType: "late_report",
      entityId: created.id,
      newData: {
        report_date: created.report_date,
        reason: created.reason,
      },
    });

    await notifyAdmins({
      title: "New Late Report",
      message: `${auth.profile.full_name} submitted a late report for ${parsed.data.report_date} (${parsed.data.reason}).`,
      type: "INFO",
      link: "/admin/late-reports",
    });

    await notifyManager({
      employeeId: auth.profile.id,
      title: "Team Late Report",
      message: `${auth.profile.full_name} submitted a late report for ${parsed.data.report_date}.`,
      type: "INFO",
      link: "/team",
    });

    return NextResponse.json({ report: created }, { status: 201 });
  } catch (err) {
    console.error("[late-reports POST] Error:", err);
    return NextResponse.json(
      { error: "Unable to submit late report." },
      { status: 500 }
    );
  }
}
