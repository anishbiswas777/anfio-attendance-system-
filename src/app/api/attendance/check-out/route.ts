import { NextResponse } from "next/server";
import { requireApiActiveUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getOfficeSettings } from "@/lib/settings/server";
import {
  calculateWorkingMinutes,
  determineAttendanceStatus,
  getOfficeDateString,
} from "@/lib/attendance/calculations";
import { createAuditLog } from "@/lib/audit/logger";

export async function POST() {
  try {
    const auth = await requireApiActiveUser();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { profile } = auth;
    if (profile.role === "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Administrator accounts are for monitoring and approvals only and do not check out.",
        },
        { status: 403 }
      );
    }
    const supabase = await createClient();
    const settings = await getOfficeSettings();
    const now = new Date();
    const attendanceDate = getOfficeDateString(now, settings.timezone);

    const { data: existing, error: fetchError } = await supabase
      .from("attendance")
      .select("*")
      .eq("employee_id", profile.id)
      .eq("attendance_date", attendanceDate)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        { error: "Unable to verify today's attendance." },
        { status: 500 }
      );
    }

    if (!existing || !existing.check_in) {
      return NextResponse.json(
        { error: "You must check in before checking out." },
        { status: 400 }
      );
    }

    if (existing.check_out) {
      return NextResponse.json(
        { error: "You have already checked out for today." },
        { status: 409 }
      );
    }

    const checkInDate = new Date(existing.check_in);
    const workingMinutes = calculateWorkingMinutes(checkInDate, now);
    const status = determineAttendanceStatus({
      checkIn: checkInDate,
      checkOut: now,
      lateMinutes: existing.late_minutes,
      halfDayThresholdMinutes: settings.half_day_threshold_minutes,
    });

    const { data: updated, error: updateError } = await supabase
      .from("attendance")
      .update({
        check_out: now.toISOString(),
        working_minutes: workingMinutes,
        status,
      })
      .eq("id", existing.id)
      .is("check_out", null)
      .select("*")
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: "Unable to record check-out. Please try again." },
        { status: 500 }
      );
    }

    createAuditLog({
      actorId: profile.id,
      action: "CHECK_OUT",
      entityType: "attendance",
      entityId: updated.id,
      oldData: { check_out: null, status: existing.status },
      newData: {
        check_out: updated.check_out,
        working_minutes: workingMinutes,
        status,
      },
    }).catch((err) => console.error("[check-out] audit log error:", err));

    return NextResponse.json({ attendance: updated });
  } catch (err) {
    console.error("[check-out] Unexpected error:", err);
    return NextResponse.json(
      { error: "Unable to record check-out. Please try again." },
      { status: 500 }
    );
  }
}
