import { requireActiveUser } from "@/lib/auth/session";
import { getShellCounts } from "@/lib/layout/shell-data";
import { AppShell } from "@/components/layout/AppShell";
import { AccountSettingsClient } from "@/components/settings/AccountSettingsClient";

export default async function SettingsPage() {
  const profile = await requireActiveUser();
  const { unreadNotifications, pendingRegistrations } = await getShellCounts(profile);

  return (
    <AppShell
      profile={profile}
      unreadNotifications={unreadNotifications}
      pendingRegistrations={pendingRegistrations}
    >
      <AccountSettingsClient email={profile.email} />
    </AppShell>
  );
}
