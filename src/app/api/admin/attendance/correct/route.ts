import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import { getOfficeSettings } from "@/lib/settings/server";
import { attendanceCorrectionSchema } from "@/lib/validations/schemas";
import {
  calculateLateMinutes,
  calculateWorkingMinutes,
  parseTimeOnOfficeDate,
} from "@/lib/attendance/calculations";
import { createAuditLog } from "@/lib/audit/logger";
import { notifyUser } from "@/lib/notifications/service";

export async function POST(request: Request) {
  try {
    const auth = await requireApiAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const parsed = attendanceCorrectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid correction payload." },
        { status: 400 }
      );
    }

    const settings = await getOfficeSettings();
    const { employee_id, attendance_date, check_in, check_out, status, remarks } =
      parsed.data;

    let checkInDate: Date | null = null;
    let checkOutDate: Date | null = null;

    if (check_in) {
      checkInDate = check_in.includes("T")
        ? new Date(check_in)
        : parseTimeOnOfficeDate(attendance_date, check_in, settings.timezone);
    }
    if (check_out) {
      checkOutDate = check_out.includes("T")
        ? new Date(check_out)
        : parseTimeOnOfficeDate(attendance_date, check_out, settings.timezone);
    }

    if (checkInDate && checkOutDate && checkOutDate < checkInDate) {
      return NextResponse.json(
        { error: "Check-out time cannot be earlier than check-in time." },
        { status: 400 }
      );
    }

    const lateMinutes = checkInDate
      ? calculateLateMinutes(checkInDate, attendance_date, settings)
      : 0;
    const workingMinutes =
      checkInDate && checkOutDate
        ? calculateWorkingMinutes(checkInDate, checkOutDate)
        : null;

    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("attendance")
      .select("*")
      .eq("employee_id", employee_id)
      .eq("attendance_date", attendance_date)
      .maybeSingle();

    const { data: saved, error } = await admin
      .from("attendance")
      .upsert(
        {
          employee_id,
          attendance_date,
          check_in: checkInDate ? checkInDate.toISOString() : null,
          check_out: checkOutDate ? checkOutDate.toISOString() : null,
          status,
          late_minutes: lateMinutes,
          working_minutes: workingMinutes,
          remarks,
        },
        { onConflict: "employee_id,attendance_date" }
      )
      .select("*")
      .single();

    if (error || !saved) {
      return NextResponse.json(
        { error: "Unable to save attendance correction." },
        { status: 500 }
      );
    }

    await createAuditLog({
      actorId: auth.profile.id,
      action: "ATTENDANCE_CORRECTED",
      entityType: "attendance",
      entityId: saved.id,
      oldData: existing
        ? {
            check_in: existing.check_in,
            check_out: existing.check_out,
            status: existing.status,
            working_minutes: existing.working_minutes,
            late_minutes: existing.late_minutes,
            remarks: existing.remarks,
          }
        : null,
      newData: {
        check_in: saved.check_in,
        check_out: saved.check_out,
        status: saved.status,
        working_minutes: saved.working_minutes,
        late_minutes: saved.late_minutes,
        remarks: saved.remarks,
      },
    });

    await notifyUser({
      userId: employee_id,
      title: "Attendance Corrected",
      message: `An administrator updated your attendance for ${attendance_date} (${status}). Reason: ${remarks}`,
      type: "INFO",
      link: "/attendance",
    });

    return NextResponse.json({ attendance: saved });
  } catch (err) {
    console.error("[admin attendance correct] Error:", err);
    return NextResponse.json(
      { error: "Unable to save attendance correction." },
      { status: 500 }
    );
  }
}
