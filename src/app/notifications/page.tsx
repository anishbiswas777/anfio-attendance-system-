import { requireActiveUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getOfficeSettings } from "@/lib/settings/server";
import { getShellCounts } from "@/lib/layout/shell-data";
import { AppShell } from "@/components/layout/AppShell";
import { NotificationsClient } from "@/components/notifications/NotificationsClient";
import type { NotificationItem } from "@/types/database";

export default async function NotificationsPage() {
  const profile = await requireActiveUser();
  const settings = await getOfficeSettings();
  const { unreadNotifications, pendingRegistrations } = await getShellCounts(profile);

  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <AppShell
      profile={profile}
      unreadNotifications={unreadNotifications}
      pendingRegistrations={pendingRegistrations}
    >
      <NotificationsClient
        notifications={(data as NotificationItem[]) ?? []}
        settings={settings}
      />
    </AppShell>
  );
}
