import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import { getShellCounts } from "@/lib/layout/shell-data";
import { AppShell } from "@/components/layout/AppShell";
import { HolidaysClient } from "@/components/admin/HolidaysClient";
import type { Holiday } from "@/types/database";

export default async function AdminHolidaysPage() {
  const profile = await requireAdmin();
  const { unreadNotifications, pendingRegistrations } = await getShellCounts(profile);

  const admin = createAdminClient();
  const { data } = await admin
    .from("holidays")
    .select("*")
    .order("holiday_date", { ascending: true });

  return (
    <AppShell
      profile={profile}
      unreadNotifications={unreadNotifications}
      pendingRegistrations={pendingRegistrations}
    >
      <HolidaysClient holidays={(data as Holiday[]) ?? []} />
    </AppShell>
  );
}
