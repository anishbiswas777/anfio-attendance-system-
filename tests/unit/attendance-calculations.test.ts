import { describe, expect, it } from "vitest";
import {
  calculateLateMinutes,
  calculateWorkingMinutes,
  DEFAULT_OFFICE_SETTINGS,
  determineAttendanceStatus,
  formatWorkingHours,
  getOfficeDateString,
  isWeekendDate,
  parseTimeOnOfficeDate,
} from "@/lib/attendance/calculations";

describe("Attendance Calculations (Asia/Kolkata)", () => {
  it("treats 09:30, 09:35, 09:39, and 09:40 as on-time (0 late minutes) with 10m grace", () => {
    const date = "2026-11-12";
    expect(
      calculateLateMinutes(
        parseTimeOnOfficeDate(date, "09:30", "Asia/Kolkata"),
        date,
        DEFAULT_OFFICE_SETTINGS
      )
    ).toBe(0);
    expect(
      calculateLateMinutes(
        parseTimeOnOfficeDate(date, "09:35", "Asia/Kolkata"),
        date,
        DEFAULT_OFFICE_SETTINGS
      )
    ).toBe(0);
    expect(
      calculateLateMinutes(
        parseTimeOnOfficeDate(date, "09:39", "Asia/Kolkata"),
        date,
        DEFAULT_OFFICE_SETTINGS
      )
    ).toBe(0);
    expect(
      calculateLateMinutes(
        parseTimeOnOfficeDate(date, "09:40", "Asia/Kolkata"),
        date,
        DEFAULT_OFFICE_SETTINGS
      )
    ).toBe(0);
  });

  it("treats 09:41 as 11 minutes late and 09:47 as 17 minutes late", () => {
    const date = "2026-11-12";
    expect(
      calculateLateMinutes(
        parseTimeOnOfficeDate(date, "09:41", "Asia/Kolkata"),
        date,
        DEFAULT_OFFICE_SETTINGS
      )
    ).toBe(11);
    expect(
      calculateLateMinutes(
        parseTimeOnOfficeDate(date, "09:47", "Asia/Kolkata"),
        date,
        DEFAULT_OFFICE_SETTINGS
      )
    ).toBe(17);
  });

  it("calculates working minutes and formats working hours", () => {
    const checkIn = parseTimeOnOfficeDate("2026-11-12", "09:42", "Asia/Kolkata");
    const checkOut = parseTimeOnOfficeDate("2026-11-12", "18:37", "Asia/Kolkata");
    const mins = calculateWorkingMinutes(checkIn, checkOut);
    expect(mins).toBe(535);
    expect(formatWorkingHours(mins)).toBe("8h 55m");
  });

  it("determines attendance status accurately including HALF_DAY, HOLIDAY, and LEAVE", () => {
    const checkIn = parseTimeOnOfficeDate("2026-11-12", "09:30", "Asia/Kolkata");
    const shortCheckOut = parseTimeOnOfficeDate("2026-11-12", "12:00", "Asia/Kolkata");
    const fullCheckOut = parseTimeOnOfficeDate("2026-11-12", "18:30", "Asia/Kolkata");

    expect(
      determineAttendanceStatus({
        checkIn,
        checkOut: shortCheckOut,
        lateMinutes: 0,
        halfDayThresholdMinutes: 240,
      })
    ).toBe("HALF_DAY");

    expect(
      determineAttendanceStatus({
        checkIn,
        checkOut: fullCheckOut,
        lateMinutes: 0,
        halfDayThresholdMinutes: 240,
      })
    ).toBe("PRESENT");

    expect(
      determineAttendanceStatus({
        checkIn,
        lateMinutes: 15,
      })
    ).toBe("LATE");

    expect(determineAttendanceStatus({ isHoliday: true })).toBe("HOLIDAY");
    expect(determineAttendanceStatus({ isOnApprovedLeave: true })).toBe("LEAVE");
    expect(determineAttendanceStatus({})).toBe("ABSENT");
  });

  it("handles UTC midnight vs Asia/Kolkata date boundary correctly", () => {
    // 2026-11-12T19:00:00Z is 2026-11-13 00:30:00 in Asia/Kolkata!
    const utcMoment = new Date("2026-11-12T19:00:00.000Z");
    expect(getOfficeDateString(utcMoment, "Asia/Kolkata")).toBe("2026-11-13");
    expect(getOfficeDateString(utcMoment, "UTC")).toBe("2026-11-12");
  });

  it("detects configured weekend days", () => {
    // 2026-11-14 is Saturday (6), 2026-11-15 is Sunday (0), 2026-11-16 is Monday (1)
    expect(isWeekendDate("2026-11-14", [0, 6])).toBe(true);
    expect(isWeekendDate("2026-11-15", [0, 6])).toBe(true);
    expect(isWeekendDate("2026-11-16", [0, 6])).toBe(false);
    // If org works Saturdays (only Sunday off)
    expect(isWeekendDate("2026-11-14", [0])).toBe(false);
  });
});
