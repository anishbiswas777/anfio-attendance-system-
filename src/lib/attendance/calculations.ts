import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import type { AttendanceStatus, OfficeSettings } from "@/types/database";

export const DEFAULT_OFFICE_SETTINGS: OfficeSettings = {
  office_start_time: "09:30",
  office_end_time: "18:30",
  grace_period_minutes: 10,
  late_threshold_minutes: 10,
  half_day_threshold_minutes: 240,
  timezone: "Asia/Kolkata",
  weekend_days: [0, 6],
  allow_past_leave: false,
  allow_overlapping_leave: false,
  team_show_checkin_time: true,
  manager_can_approve_leave: true,
  manager_can_approve_late: true,
};

/**
 * Returns YYYY-MM-DD in the configured office timezone.
 */
export function getOfficeDateString(date: Date = new Date(), timezone = "Asia/Kolkata"): string {
  return formatInTimeZone(date, timezone, "yyyy-MM-dd");
}

/**
 * Formats an ISO timestamp or Date into a display time in the office timezone.
 */
export function formatOfficeTime(
  value: Date | string | null | undefined,
  timezone = "Asia/Kolkata",
  pattern = "hh:mm a"
): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return formatInTimeZone(d, timezone, pattern);
}

/**
 * Formats an ISO timestamp or Date into a display date + time in the office timezone.
 */
export function formatOfficeDateTime(
  value: Date | string | null | undefined,
  timezone = "Asia/Kolkata"
): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return formatInTimeZone(d, timezone, "dd MMM yyyy, hh:mm a");
}

/**
 * Converts a local office date (YYYY-MM-DD) + HH:mm time string into a UTC Date.
 */
export function parseTimeOnOfficeDate(
  dateStr: string,
  timeStr: string,
  timezone = "Asia/Kolkata"
): Date {
  const normalizedTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  return fromZonedTime(`${dateStr} ${normalizedTime}`, timezone);
}

/**
 * Calculates late minutes based on office start time and grace period.
 * Example (start 09:30, grace 10m):
 *   09:39 -> 0
 *   09:40 -> 0
 *   09:41 -> 11
 *   09:47 -> 17
 */
export function calculateLateMinutes(
  checkIn: Date,
  attendanceDate: string,
  settings: Pick<OfficeSettings, "office_start_time" | "grace_period_minutes" | "timezone">
): number {
  const officeStart = parseTimeOnOfficeDate(
    attendanceDate,
    settings.office_start_time,
    settings.timezone
  );

  const minutesFromStart = Math.floor(
    (checkIn.getTime() - officeStart.getTime()) / 60000
  );

  if (minutesFromStart <= settings.grace_period_minutes) {
    return 0;
  }

  return minutesFromStart;
}

/**
 * Calculates total working minutes between check-in and check-out.
 */
export function calculateWorkingMinutes(checkIn: Date, checkOut: Date): number {
  const diffMs = checkOut.getTime() - checkIn.getTime();
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / 60000);
}

/**
 * Formats working minutes as "8h 55m".
 */
export function formatWorkingHours(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || minutes < 0) return "—";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m`;
}

/**
 * Determines attendance status from check-in, check-out, late minutes, and office thresholds.
 */
export function determineAttendanceStatus(params: {
  checkIn?: Date | null;
  checkOut?: Date | null;
  lateMinutes?: number;
  isHoliday?: boolean;
  isOnApprovedLeave?: boolean;
  halfDayThresholdMinutes?: number;
}): AttendanceStatus {
  const {
    checkIn,
    checkOut,
    lateMinutes = 0,
    isHoliday = false,
    isOnApprovedLeave = false,
    halfDayThresholdMinutes = 240,
  } = params;

  if (!checkIn) {
    if (isHoliday) return "HOLIDAY";
    if (isOnApprovedLeave) return "LEAVE";
    return "ABSENT";
  }

  if (checkOut) {
    const workingMinutes = calculateWorkingMinutes(checkIn, checkOut);
    if (workingMinutes < halfDayThresholdMinutes) {
      return "HALF_DAY";
    }
  }

  if (lateMinutes > 0) {
    return "LATE";
  }

  return "PRESENT";
}

/**
 * Checks whether a YYYY-MM-DD date falls on a configured weekend day (0=Sun..6=Sat).
 */
export function isWeekendDate(dateStr: string, weekendDays: number[] = [0, 6]): boolean {
  const [y, m, d] = dateStr.split("-").map(Number);
  const utcDay = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return weekendDays.includes(utcDay);
}
