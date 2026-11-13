import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import { getShellCounts } from "@/lib/layout/shell-data";
import { AppShell } from "@/components/layout/AppShell";
import { AdminLeaveClient } from "@/components/admin/AdminLeaveClient";
import type { LeaveRequest } from "@/types/database";

export default async function AdminLeavePage() {
  const profile = await requireAdmin();
  const { unreadNotifications, pendingRegistrations } = await getShellCounts(profile);

  const admin = createAdminClient();
  const { data } = await admin
    .from("leave_requests")
    .select(
      `
      *,
      leave_type:leave_types(*),
      employee:profiles!leave_requests_employee_id_fkey(id, full_name, employee_code, department_id, department:departments!profiles_department_id_fkey(id, name))
    `
    )
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <AppShell
      profile={profile}
      unreadNotifications={unreadNotifications}
      pendingRegistrations={pendingRegistrations}
    >
      <AdminLeaveClient requests={(data as LeaveRequest[]) ?? []} />
    </AppShell>
  );
}
