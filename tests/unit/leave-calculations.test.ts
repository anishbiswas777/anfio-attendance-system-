import { describe, expect, it } from "vitest";
import {
  calculateLeaveDays,
  hasOverlappingDates,
  validateLeaveDateRange,
} from "@/lib/leave/calculations";

describe("Leave Calculations & Validation", () => {
  it("excludes weekends and holidays when calculating leave days", () => {
    // 2026-11-12 (Thu) to 2026-11-16 (Mon) -> Thu, Fri, [Sat, Sun], Mon = 3 working days
    expect(
      calculateLeaveDays("2026-11-12", "2026-11-16", {
        weekendDays: [0, 6],
        holidays: [],
      })
    ).toBe(3);

    // With Friday 2026-11-13 as a holiday -> 2 working days
    expect(
      calculateLeaveDays("2026-11-12", "2026-11-16", {
        weekendDays: [0, 6],
        holidays: ["2026-11-13"],
      })
    ).toBe(2);
  });

  it("calculates half-day leave as 0.5 on a working day", () => {
    expect(
      calculateLeaveDays("2026-11-12", "2026-11-12", {
        isHalfDay: true,
        weekendDays: [0, 6],
      })
    ).toBe(0.5);

    expect(
      calculateLeaveDays("2026-11-14", "2026-11-14", {
        isHalfDay: true,
        weekendDays: [0, 6],
      })
    ).toBe(0);
  });

  it("detects overlapping date ranges accurately", () => {
    expect(hasOverlappingDates("2026-11-10", "2026-11-12", "2026-11-12", "2026-11-15")).toBe(true);
    expect(hasOverlappingDates("2026-11-10", "2026-11-12", "2026-11-13", "2026-11-15")).toBe(false);
  });

  it("rejects invalid date ranges and past leave when disallowed", () => {
    expect(
      validateLeaveDateRange({
        startDate: "2026-11-15",
        endDate: "2026-11-12",
        todayDate: "2026-11-12",
        allowPastLeave: false,
      }).valid
    ).toBe(false);

    expect(
      validateLeaveDateRange({
        startDate: "2026-11-10",
        endDate: "2026-11-10",
        todayDate: "2026-11-12",
        allowPastLeave: false,
      }).valid
    ).toBe(false);

    expect(
      validateLeaveDateRange({
        startDate: "2026-11-12",
        endDate: "2026-11-13",
        isHalfDay: true,
        todayDate: "2026-11-12",
        allowPastLeave: false,
      }).valid
    ).toBe(false);
  });
});
