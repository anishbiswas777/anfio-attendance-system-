import type { OfficeSettings, Profile, UserRole } from "@/types/database";

export function canViewAdminArea(role: UserRole): boolean {
  return role === "ADMIN";
}

export function canManageEmployees(role: UserRole): boolean {
  return role === "ADMIN";
}

export function canCorrectAttendance(role: UserRole): boolean {
  return role === "ADMIN";
}

export function canViewAuditLogs(role: UserRole): boolean {
  return role === "ADMIN";
}

export function canManageSettings(role: UserRole): boolean {
  return role === "ADMIN";
}

export function canExportAllReports(role: UserRole): boolean {
  return role === "ADMIN";
}

export function canReviewLeaveRequest(params: {
  actor: Pick<Profile, "id" | "role" | "account_status">;
  targetEmployee: Pick<Profile, "id" | "manager_id" | "department_id">;
  departmentManagerId?: string | null;
  settings: Pick<OfficeSettings, "manager_can_approve_leave">;
}): boolean {
  const { actor, targetEmployee, departmentManagerId, settings } = params;

  if (actor.account_status !== "ACTIVE") return false;
  // Employees/managers can never approve their own request
  if (actor.id === targetEmployee.id) return false;

  if (actor.role === "ADMIN") return true;

  if (actor.role === "MANAGER" && settings.manager_can_approve_leave) {
    return (
      targetEmployee.manager_id === actor.id ||
      departmentManagerId === actor.id
    );
  }

  return false;
}

export function canReviewLateReport(params: {
  actor: Pick<Profile, "id" | "role" | "account_status">;
  targetEmployee: Pick<Profile, "id" | "manager_id" | "department_id">;
  departmentManagerId?: string | null;
  settings: Pick<OfficeSettings, "manager_can_approve_late">;
}): boolean {
  const { actor, targetEmployee, departmentManagerId, settings } = params;

  if (actor.account_status !== "ACTIVE") return false;
  if (actor.id === targetEmployee.id) return false;

  if (actor.role === "ADMIN") return true;

  if (actor.role === "MANAGER" && settings.manager_can_approve_late) {
    return (
      targetEmployee.manager_id === actor.id ||
      departmentManagerId === actor.id
    );
  }

  return false;
}
