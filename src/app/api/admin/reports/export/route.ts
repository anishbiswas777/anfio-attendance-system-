import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import { getOfficeSettings } from "@/lib/settings/server";
import { formatOfficeTime, formatWorkingHours } from "@/lib/attendance/calculations";

export async function GET(request: Request) {
  try {
    const auth = await requireApiAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "daily";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const departmentId = searchParams.get("departmentId") || "";

    const admin = createAdminClient();
    const settings = await getOfficeSettings();

    if (type === "leave") {
      let query = admin
        .from("leave_requests")
        .select(
          `
          *,
          leave_type:leave_types(name, code),
          employee:profiles!leave_requests_employee_id_fkey(full_name, employee_code, department_id, department:departments!profiles_department_id_fkey(name))
        `
        )
        .order("start_date", { ascending: false });

      if (startDate) query = query.gte("start_date", startDate);
      if (endDate) query = query.lte("end_date", endDate);

      const { data } = await query.limit(1000);
      const rows = (data ?? [])
        .filter((r) => !departmentId || r.employee?.department_id === departmentId)
        .map((r) => ({
          Employee: r.employee?.full_name ?? "—",
          EmployeeID: r.employee?.employee_code ?? "—",
          Department: r.employee?.department?.name ?? "—",
          LeaveType: r.leave_type?.name ?? "—",
          StartDate: r.start_date,
          EndDate: r.end_date,
          Days: r.total_days,
          Status: r.status,
        }));

      return NextResponse.json({ rows });
    }

    if (type === "late") {
      let query = admin
        .from("late_reports")
        .select(
          `
          *,
          employee:profiles!late_reports_employee_id_fkey(full_name, employee_code, department_id, department:departments!profiles_department_id_fkey(name))
        `
        )
        .order("report_date", { ascending: false });

      if (startDate) query = query.gte("report_date", startDate);
      if (endDate) query = query.lte("report_date", endDate);

      const { data } = await query.limit(1000);
      const rows = (data ?? [])
        .filter((r) => !departmentId || r.employee?.department_id === departmentId)
        .map((r) => ({
          Employee: r.employee?.full_name ?? "—",
          EmployeeID: r.employee?.employee_code ?? "—",
          Department: r.employee?.department?.name ?? "—",
          Date: r.report_date,
          ExpectedArrival: r.expected_arrival ?? "—",
          ActualArrival: r.actual_arrival ?? "—",
          Reason: r.reason,
          Status: r.status,
        }));

      return NextResponse.json({ rows });
    }

    // Default: daily attendance report
    let query = admin
      .from("attendance")
      .select(
        `
        *,
        employee:profiles!attendance_employee_id_fkey(full_name, employee_code, department_id, department:departments!profiles_department_id_fkey(name))
      `
      )
      .order("attendance_date", { ascending: false });

    if (startDate) query = query.gte("attendance_date", startDate);
    if (endDate) query = query.lte("attendance_date", endDate);

    const { data } = await query.limit(1000);
    const rows = (data ?? [])
      .filter((r) => !departmentId || r.employee?.department_id === departmentId)
      .map((r) => ({
        Employee: r.employee?.full_name ?? "—",
        EmployeeID: r.employee?.employee_code ?? "—",
        Department: r.employee?.department?.name ?? "—",
        Date: r.attendance_date,
        CheckIn: formatOfficeTime(r.check_in, settings.timezone),
        CheckOut: formatOfficeTime(r.check_out, settings.timezone),
        WorkingHours: formatWorkingHours(r.working_minutes),
        Status: r.status,
        LateMinutes: r.late_minutes,
      }));

    return NextResponse.json({ rows });
  } catch (err) {
    console.error("[admin reports export] Error:", err);
    return NextResponse.json(
      { error: "Unable to export report." },
      { status: 500 }
    );
  }
}
