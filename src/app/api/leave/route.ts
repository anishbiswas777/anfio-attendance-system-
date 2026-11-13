import { NextResponse } from "next/server";
import { requireApiActiveUser } from "@/lib/auth/session";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getOfficeSettings } from "@/lib/settings/server";
import { leaveRequestSchema } from "@/lib/validations/schemas";
import {
  calculateLeaveDays,
  hasOverlappingDates,
  validateLeaveDateRange,
} from "@/lib/leave/calculations";
import { getOfficeDateString } from "@/lib/attendance/calculations";
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
      .from("leave_requests")
      .select(
        `
        *,
        leave_type:leave_types(*),
        employee:profiles!leave_requests_employee_id_fkey(id, full_name, employee_code, email, designation, department_id, department:departments!profiles_department_id_fkey(id, name)),
        reviewer:profiles!leave_requests_reviewed_by_fkey(id, full_name)
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
        { error: "Unable to load leave requests." },
        { status: 500 }
      );
    }

    return NextResponse.json({ requests: data ?? [] });
  } catch (err) {
    console.error("[leave GET] Error:", err);
    return NextResponse.json(
      { error: "Unable to load leave requests." },
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
            "Administrator accounts are for monitoring and approvals only and do not submit leave requests.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = leaveRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid leave request." },
        { status: 400 }
      );
    }

    const { profile } = auth;
    const settings = await getOfficeSettings();
    const todayStr = getOfficeDateString(new Date(), settings.timezone);

    const rangeCheck = validateLeaveDateRange({
      startDate: parsed.data.start_date,
      endDate: parsed.data.end_date,
      isHalfDay: parsed.data.is_half_day,
      todayDate: todayStr,
      allowPastLeave: settings.allow_past_leave,
    });

    if (!rangeCheck.valid) {
      return NextResponse.json({ error: rangeCheck.error }, { status: 400 });
    }

    const supabase = await createClient();
    const admin = createAdminClient();

    // Load holidays in date range
    const { data: holidays } = await admin
      .from("holidays")
      .select("holiday_date")
      .gte("holiday_date", parsed.data.start_date)
      .lte("holiday_date", parsed.data.end_date);

    const holidayDates = (holidays ?? []).map((h) => h.holiday_date);

    const totalDays = calculateLeaveDays(
      parsed.data.start_date,
      parsed.data.end_date,
      {
        isHalfDay: parsed.data.is_half_day,
        weekendDays: settings.weekend_days,
        holidays: holidayDates,
      }
    );

    if (totalDays <= 0) {
      return NextResponse.json(
        {
          error:
            "Selected dates contain only weekends or holidays. No working days to apply for.",
        },
        { status: 400 }
      );
    }

    // Check overlapping leave requests if policy disallows overlap
    if (!settings.allow_overlapping_leave) {
      const { data: existingLeaves } = await supabase
        .from("leave_requests")
        .select("id, start_date, end_date, status")
        .eq("employee_id", profile.id)
        .in("status", ["PENDING", "APPROVED"]);

      const overlap = (existingLeaves ?? []).some((lr) =>
        hasOverlappingDates(
          parsed.data.start_date,
          parsed.data.end_date,
          lr.start_date,
          lr.end_date
        )
      );

      if (overlap) {
        return NextResponse.json(
          {
            error:
              "You already have a pending or approved leave request overlapping these dates.",
          },
          { status: 409 }
        );
      }
    }

    const { data: created, error } = await supabase
      .from("leave_requests")
      .insert({
        employee_id: profile.id,
        leave_type_id: parsed.data.leave_type_id,
        start_date: parsed.data.start_date,
        end_date: parsed.data.end_date,
        total_days: totalDays,
        is_half_day: parsed.data.is_half_day,
        reason: parsed.data.reason,
        attachment_url: parsed.data.attachment_url ?? null,
        status: "PENDING",
      })
      .select("*")
      .single();

    if (error || !created) {
      return NextResponse.json(
        { error: "Unable to submit leave request." },
        { status: 500 }
      );
    }

    await createAuditLog({
      actorId: profile.id,
      action: "LEAVE_SUBMITTED",
      entityType: "leave_request",
      entityId: created.id,
      newData: {
        start_date: created.start_date,
        end_date: created.end_date,
        total_days: totalDays,
      },
    });

    await notifyAdmins({
      title: "New Leave Request",
      message: `${profile.full_name} requested ${totalDays} day(s) of leave (${parsed.data.start_date} to ${parsed.data.end_date}).`,
      type: "INFO",
      link: "/admin/leave",
    });

    await notifyManager({
      employeeId: profile.id,
      title: "Team Leave Request",
      message: `${profile.full_name} submitted a leave request for ${parsed.data.start_date} to ${parsed.data.end_date}.`,
      type: "INFO",
      link: "/team",
    });

    return NextResponse.json({ request: created }, { status: 201 });
  } catch (err) {
    console.error("[leave POST] Error:", err);
    return NextResponse.json(
      { error: "Unable to submit leave request." },
      { status: 500 }
    );
  }
}
