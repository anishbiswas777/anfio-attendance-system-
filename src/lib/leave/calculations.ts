import { isWeekendDate } from "@/lib/attendance/calculations";

/**
 * Calculates total leave days between startDate and endDate (inclusive),
 * excluding configured weekend days and company holidays.
 * If isHalfDay is true and startDate === endDate on a working day, returns 0.5.
 */
export function calculateLeaveDays(
  startDate: string,
  endDate: string,
  options?: {
    isHalfDay?: boolean;
    weekendDays?: number[];
    holidays?: string[];
  }
): number {
  if (!startDate || !endDate || endDate < startDate) {
    return 0;
  }

  const weekendDays = options?.weekendDays ?? [0, 6];
  const holidaySet = new Set(options?.holidays ?? []);

  if (options?.isHalfDay) {
    if (startDate !== endDate) return 0;
    if (isWeekendDate(startDate, weekendDays) || holidaySet.has(startDate)) {
      return 0;
    }
    return 0.5;
  }

  let count = 0;
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ey, em, ed] = endDate.split("-").map(Number);

  const current = new Date(Date.UTC(sy, sm - 1, sd));
  const end = new Date(Date.UTC(ey, em - 1, ed));

  while (current <= end) {
    const y = current.getUTCFullYear();
    const m = String(current.getUTCMonth() + 1).padStart(2, "0");
    const d = String(current.getUTCDate()).padStart(2, "0");
    const iso = `${y}-${m}-${d}`;

    if (!isWeekendDate(iso, weekendDays) && !holidaySet.has(iso)) {
      count += 1;
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return count;
}

/**
 * Returns true if [startA, endA] overlaps [startB, endB] (inclusive).
 */
export function hasOverlappingDates(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return startA <= endB && endA >= startB;
}

export function validateLeaveDateRange(params: {
  startDate: string;
  endDate: string;
  isHalfDay?: boolean;
  todayDate: string;
  allowPastLeave: boolean;
}): { valid: boolean; error?: string } {
  const { startDate, endDate, isHalfDay, todayDate, allowPastLeave } = params;

  if (!startDate || !endDate) {
    return { valid: false, error: "Start date and end date are required." };
  }

  if (endDate < startDate) {
    return { valid: false, error: "End date cannot be before start date." };
  }

  if (isHalfDay && startDate !== endDate) {
    return {
      valid: false,
      error: "Half-day leave must have the same start and end date.",
    };
  }

  if (!allowPastLeave && startDate < todayDate) {
    return {
      valid: false,
      error: "Past-dated leave requests are not allowed by company policy.",
    };
  }

  return { valid: true };
}
