import { describe, expect, it } from "vitest";
import {
  canCorrectAttendance,
  canManageSettings,
  canReviewLateReport,
  canReviewLeaveRequest,
  canViewAdminArea,
  canViewAuditLogs,
} from "@/lib/permissions/rbac";
import {
  registerSchema,
  reviewDecisionSchema,
} from "@/lib/validations/schemas";

describe("RBAC Permissions", () => {
  it("restricts admin capabilities to ADMIN role", () => {
    expect(canViewAdminArea("ADMIN")).toBe(true);
    expect(canViewAdminArea("MANAGER")).toBe(false);
    expect(canViewAdminArea("EMPLOYEE")).toBe(false);

    expect(canCorrectAttendance("ADMIN")).toBe(true);
    expect(canCorrectAttendance("MANAGER")).toBe(false);
    expect(canViewAuditLogs("ADMIN")).toBe(true);
    expect(canViewAuditLogs("EMPLOYEE")).toBe(false);
    expect(canManageSettings("ADMIN")).toBe(true);
    expect(canManageSettings("MANAGER")).toBe(false);
  });

  it("prevents employees and managers from approving their own requests", () => {
    expect(
      canReviewLeaveRequest({
        actor: { id: "u1", role: "ADMIN", account_status: "ACTIVE" },
        targetEmployee: { id: "u1", manager_id: null, department_id: null },
        settings: { manager_can_approve_leave: true },
      })
    ).toBe(false);

    expect(
      canReviewLateReport({
        actor: { id: "u2", role: "MANAGER", account_status: "ACTIVE" },
        targetEmployee: { id: "u2", manager_id: "u2", department_id: null },
        settings: { manager_can_approve_late: true },
      })
    ).toBe(false);
  });

  it("scopes manager approvals strictly to assigned team", () => {
    expect(
      canReviewLeaveRequest({
        actor: { id: "mgr1", role: "MANAGER", account_status: "ACTIVE" },
        targetEmployee: { id: "emp1", manager_id: "mgr1", department_id: "d1" },
        settings: { manager_can_approve_leave: true },
      })
    ).toBe(true);

    expect(
      canReviewLeaveRequest({
        actor: { id: "mgr1", role: "MANAGER", account_status: "ACTIVE" },
        targetEmployee: { id: "emp2", manager_id: "mgr2", department_id: "d2" },
        departmentManagerId: "mgr2",
        settings: { manager_can_approve_leave: true },
      })
    ).toBe(false);
  });
});

describe("Zod Validation Schemas", () => {
  it("requires rejection reason when decision is REJECTED", () => {
    expect(
      reviewDecisionSchema.safeParse({
        decision: "REJECTED",
        rejection_reason: "",
      }).success
    ).toBe(false);

    expect(
      reviewDecisionSchema.safeParse({
        decision: "REJECTED",
        rejection_reason: "Insufficient leave balance",
      }).success
    ).toBe(true);
  });

  it("validates strong passwords during registration", () => {
    const weak = registerSchema.safeParse({
      full_name: "Test User",
      email: "test@company.com",
      phone: "9876543210",
      employee_code: "EMP-1",
      department_id: "00000000-0000-0000-0000-000000000001",
      designation: "Engineer",
      joining_date: "2026-11-12",
      password: "weak",
      confirm_password: "weak",
    });
    expect(weak.success).toBe(false);
  });
});
