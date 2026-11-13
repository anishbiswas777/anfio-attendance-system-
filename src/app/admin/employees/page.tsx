import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import { getShellCounts } from "@/lib/layout/shell-data";
import { AppShell } from "@/components/layout/AppShell";
import { EmployeesClient } from "@/components/admin/EmployeesClient";
import type { Department, Profile } from "@/types/database";

export default async function AdminEmployeesPage() {
  const profile = await requireAdmin();
  const { unreadNotifications, pendingRegistrations } = await getShellCounts(profile);

  const admin = createAdminClient();
  const [{ data: employees }, { data: departments }] = await Promise.all([
    admin
      .from("profiles")
      .select(
        "*, department:departments!profiles_department_id_fkey(id, name)"
      )
      .order("created_at", { ascending: false })
      .limit(500),
    admin.from("departments").select("*").order("name", { ascending: true }),
  ]);

  return (
    <AppShell
      profile={profile}
      unreadNotifications={unreadNotifications}
      pendingRegistrations={pendingRegistrations}
    >
      <EmployeesClient
        employees={(employees as Profile[]) ?? []}
        departments={(departments as Department[]) ?? []}
      />
    </AppShell>
  );
}
