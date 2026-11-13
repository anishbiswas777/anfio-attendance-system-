import { requireAdmin } from "@/lib/auth/session";
import { getOfficeSettings } from "@/lib/settings/server";
import { getShellCounts } from "@/lib/layout/shell-data";
import { AppShell } from "@/components/layout/AppShell";
import { OfficeSettingsClient } from "@/components/admin/OfficeSettingsClient";

export default async function AdminSettingsPage() {
  const profile = await requireAdmin();
  const settings = await getOfficeSettings();
  const { unreadNotifications, pendingRegistrations } = await getShellCounts(profile);

  return (
    <AppShell
      profile={profile}
      unreadNotifications={unreadNotifications}
      pendingRegistrations={pendingRegistrations}
    >
      <OfficeSettingsClient settings={settings} />
    </AppShell>
  );
}
