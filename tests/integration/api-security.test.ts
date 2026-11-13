import { describe, expect, it, vi, beforeEach } from "vitest";

const mockRequireApiActiveUser = vi.fn();
const mockRequireApiAdmin = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  requireApiActiveUser: () => mockRequireApiActiveUser(),
  requireApiAdmin: () => mockRequireApiAdmin(),
}));

const mockSupabaseClient = {
  from: vi.fn(),
};

const mockAdminClient = {
  from: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => mockSupabaseClient,
  createAdminClient: () => mockAdminClient,
}));

vi.mock("@/lib/settings/server", () => ({
  getOfficeSettings: async () => ({
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
  }),
}));

vi.mock("@/lib/audit/logger", () => ({
  createAuditLog: vi.fn(async () => {}),
}));

vi.mock("@/lib/notifications/service", () => ({
  notifyUser: vi.fn(async () => {}),
  notifyAdmins: vi.fn(async () => {}),
  notifyManager: vi.fn(async () => {}),
}));

describe("API Security & Workflow Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks unauthenticated check-in with 401", async () => {
    mockRequireApiActiveUser.mockResolvedValue({
      ok: false,
      status: 401,
      error: "Authentication required.",
    });

    const { POST } = await import("@/app/api/attendance/check-in/route");
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it("blocks pending/suspended user check-in with 403", async () => {
    mockRequireApiActiveUser.mockResolvedValue({
      ok: false,
      status: 403,
      error: "Your account is pending administrator approval.",
    });

    const { POST } = await import("@/app/api/attendance/check-in/route");
    const res = await POST();
    expect(res.status).toBe(403);
  });

  it("prevents duplicate check-in for the same day (409)", async () => {
    mockRequireApiActiveUser.mockResolvedValue({
      ok: true,
      profile: { id: "emp-1", role: "EMPLOYEE", account_status: "ACTIVE" },
    });

    mockSupabaseClient.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: { id: "att-1", check_in: new Date().toISOString() },
            }),
          }),
        }),
      }),
    });

    const { POST } = await import("@/app/api/attendance/check-in/route");
    const res = await POST();
    expect(res.status).toBe(409);
  });

  it("blocks non-admin from accessing admin settings (403)", async () => {
    mockRequireApiAdmin.mockResolvedValue({
      ok: false,
      status: 403,
      error: "Administrator privileges required.",
    });

    const { PATCH } = await import("@/app/api/admin/settings/route");
    const req = new Request("http://localhost/api/admin/settings", {
      method: "PATCH",
      body: JSON.stringify({}),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(403);
  });

  it("prevents employee from approving their own leave request (403)", async () => {
    mockRequireApiActiveUser.mockResolvedValue({
      ok: true,
      profile: { id: "emp-1", role: "EMPLOYEE", account_status: "ACTIVE" },
    });

    mockAdminClient.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: {
              id: "leave-1",
              employee_id: "emp-1",
              status: "PENDING",
              employee: { id: "emp-1", manager_id: "mgr-1", department_id: null },
            },
            error: null,
          }),
        }),
      }),
    });

    const { PATCH } = await import("@/app/api/leave/[id]/route");
    const req = new Request("http://localhost/api/leave/leave-1", {
      method: "PATCH",
      body: JSON.stringify({ decision: "APPROVED" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "leave-1" }) });
    expect(res.status).toBe(403);
  });
});
