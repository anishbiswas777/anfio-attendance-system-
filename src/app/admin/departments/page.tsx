import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import { getShellCounts } from "@/lib/layout/shell-data";
import { AppShell } from "@/components/layout/AppShell";
import { DepartmentsClient } from "@/components/admin/DepartmentsClient";
import type { Department, Profile } from "@/types/database";

export default async function AdminDepartmentsPage() {
  const profile = await requireAdmin();

  const admin = createAdminClient();
  const [{ unreadNotifications, pendingRegistrations }, { data: departments }, { data: managers }] = await Promise.all([
    getShellCounts(profile),
    admin.from("departments").select("*").order("name", { ascending: true }),
    admin
      .from("profiles")
      .select("id, full_name")
      .eq("account_status", "ACTIVE")
      .in("role", ["MANAGER", "ADMIN"])
      .order("full_name", { ascending: true }),
  ]);

  return (
    <AppShell
      profile={profile}
      unreadNotifications={unreadNotifications}
      pendingRegistrations={pendingRegistrations}
    >
      <DepartmentsClient
        departments={(departments as Department[]) ?? []}
        managers={(managers as Pick<Profile, "id" | "full_name">[]) ?? []}
      />
    </AppShell>
  );
}
