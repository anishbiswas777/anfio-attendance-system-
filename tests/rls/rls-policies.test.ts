import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const migration001 = fs.readFileSync(
  path.join(process.cwd(), "supabase/migrations/0001_initial_schema.sql"),
  "utf8"
);
const migration002 = fs.readFileSync(
  path.join(process.cwd(), "supabase/migrations/0002_rls_policies.sql"),
  "utf8"
);

describe("PostgreSQL Schema & RLS Policy Verification", () => {
  const tables = [
    "departments",
    "profiles",
    "attendance",
    "leave_types",
    "leave_requests",
    "late_reports",
    "holidays",
    "notifications",
    "audit_logs",
    "app_settings",
  ];

  it("enables Row Level Security on every core table", () => {
    for (const table of tables) {
      expect(migration002).toContain(
        `alter table public.${table} enable row level security;`
      );
    }
  });

  it("enforces unique(employee_id, attendance_date) on attendance", () => {
    expect(migration001).toContain("unique(employee_id, attendance_date)");
  });

  it("protects restricted profile columns via BEFORE UPDATE trigger", () => {
    expect(migration002).toContain("protect_profile_restricted_columns");
    expect(migration002).toContain("trg_protect_profile_columns");
    expect(migration002).toContain("new.role is distinct from old.role");
    expect(migration002).toContain(
      "new.account_status is distinct from old.account_status"
    );
  });

  it("prevents employees/managers from self-approving leave or late reports in RLS", () => {
    expect(migration002).toContain("employee_id <> auth.uid()");
  });

  it("restricts audit_logs reads to active admins only and blocks client writes", () => {
    expect(migration002).toContain("audit_logs_admin_select");
    expect(migration002).not.toContain("on public.audit_logs for insert");
  });

  it("provides privacy-safe get_team_overview RPC without exposing private leave reasons", () => {
    expect(migration002).toContain("create or replace function public.get_team_overview");
    expect(migration002).not.toContain("lr.reason");
    expect(migration002).not.toContain("lr.attachment_url");
  });
});
