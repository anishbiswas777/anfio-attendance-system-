import { NextResponse } from "next/server";
import { requireApiActiveUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getOfficeSettings } from "@/lib/settings/server";
import {
  calculateLateMinutes,
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
            "Administrator accounts are for monitoring and approvals only and do not check in.",
        },
        { status: 403 }
      );
    }
    const supabase = await createClient();
    const settings = await getOfficeSettings();
    const now = new Date();
    const attendanceDate = getOfficeDateString(now, settings.timezone);

    // Check if an attendance record already exists for today
    const { data: existing } = await supabase
      .from("attendance")
      .select("id, check_in")
      .eq("employee_id", profile.id)
      .eq("attendance_date", attendanceDate)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "An attendance record already exists for today." },
        { status: 409 }
      );
    }

    const lateMinutes = calculateLateMinutes(now, attendanceDate, settings);
    const status = determineAttendanceStatus({
      checkIn: now,
      lateMinutes,
      halfDayThresholdMinutes: settings.half_day_threshold_minutes,
    });

    const { data: created, error } = await supabase
      .from("attendance")
      .insert({
        employee_id: profile.id,
        attendance_date: attendanceDate,
        check_in: now.toISOString(),
        status,
        late_minutes: lateMinutes,
      })
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "An attendance record already exists for today." },
          { status: 409 }
        );
      }
      console.error("[check-in] DB error:", error.message);
      return NextResponse.json(
        { error: "Unable to record check-in. Please try again." },
        { status: 500 }
      );
    }

    createAuditLog({
      actorId: profile.id,
      action: "CHECK_IN",
      entityType: "attendance",
      entityId: created.id,
      newData: {
        attendance_date: attendanceDate,
        check_in: created.check_in,
        status,
        late_minutes: lateMinutes,
      },
    }).catch((err) => console.error("[check-in] audit log error:", err));

    return NextResponse.json({ attendance: created }, { status: 201 });
  } catch (err) {
    console.error("[check-in] Unexpected error:", err);
    return NextResponse.json(
      { error: "Unable to record check-in. Please try again." },
      { status: 500 }
    );
  }
}
