import { createAdminClient } from "@/lib/supabase/server";
import { DEFAULT_OFFICE_SETTINGS } from "@/lib/attendance/calculations";
import type { OfficeSettings } from "@/types/database";

export async function getOfficeSettings(): Promise<OfficeSettings> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from("app_settings").select("key, value");

    if (error || !data) {
      return DEFAULT_OFFICE_SETTINGS;
    }

    const map = new Map<string, unknown>();
    for (const row of data) {
      map.set(row.key, row.value);
    }

    return {
      office_start_time:
        typeof map.get("office_start_time") === "string"
          ? (map.get("office_start_time") as string)
          : DEFAULT_OFFICE_SETTINGS.office_start_time,
      office_end_time:
        typeof map.get("office_end_time") === "string"
          ? (map.get("office_end_time") as string)
          : DEFAULT_OFFICE_SETTINGS.office_end_time,
      grace_period_minutes:
        typeof map.get("grace_period_minutes") === "number"
          ? (map.get("grace_period_minutes") as number)
          : DEFAULT_OFFICE_SETTINGS.grace_period_minutes,
      late_threshold_minutes:
        typeof map.get("late_threshold_minutes") === "number"
          ? (map.get("late_threshold_minutes") as number)
          : DEFAULT_OFFICE_SETTINGS.late_threshold_minutes,
      half_day_threshold_minutes:
        typeof map.get("half_day_threshold_minutes") === "number"
          ? (map.get("half_day_threshold_minutes") as number)
          : DEFAULT_OFFICE_SETTINGS.half_day_threshold_minutes,
      timezone:
        typeof map.get("timezone") === "string"
          ? (map.get("timezone") as string)
          : DEFAULT_OFFICE_SETTINGS.timezone,
      weekend_days: Array.isArray(map.get("weekend_days"))
        ? (map.get("weekend_days") as number[])
        : DEFAULT_OFFICE_SETTINGS.weekend_days,
      allow_past_leave:
        typeof map.get("allow_past_leave") === "boolean"
          ? (map.get("allow_past_leave") as boolean)
          : DEFAULT_OFFICE_SETTINGS.allow_past_leave,
      allow_overlapping_leave:
        typeof map.get("allow_overlapping_leave") === "boolean"
          ? (map.get("allow_overlapping_leave") as boolean)
          : DEFAULT_OFFICE_SETTINGS.allow_overlapping_leave,
      team_show_checkin_time:
        typeof map.get("team_show_checkin_time") === "boolean"
          ? (map.get("team_show_checkin_time") as boolean)
          : DEFAULT_OFFICE_SETTINGS.team_show_checkin_time,
      manager_can_approve_leave:
        typeof map.get("manager_can_approve_leave") === "boolean"
          ? (map.get("manager_can_approve_leave") as boolean)
          : DEFAULT_OFFICE_SETTINGS.manager_can_approve_leave,
      manager_can_approve_late:
        typeof map.get("manager_can_approve_late") === "boolean"
          ? (map.get("manager_can_approve_late") as boolean)
          : DEFAULT_OFFICE_SETTINGS.manager_can_approve_late,
    };
  } catch {
    return DEFAULT_OFFICE_SETTINGS;
  }
}
