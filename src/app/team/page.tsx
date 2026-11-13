import { requireActiveUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getOfficeSettings } from "@/lib/settings/server";
import { getShellCounts } from "@/lib/layout/shell-data";
import { getOfficeDateString } from "@/lib/attendance/calculations";
import { AppShell } from "@/components/layout/AppShell";
import { TeamClient } from "@/components/team/TeamClient";
import type { TeamOverviewMember } from "@/types/database";

export default async function TeamPage() {
  const profile = await requireActiveUser();
  const settings = await getOfficeSettings();
  const { unreadNotifications, pendingRegistrations } = await getShellCounts(profile);
  const todayStr = getOfficeDateString(new Date(), settings.timezone);

  const supabase = await createClient();
  const { data } = await supabase.rpc("get_team_overview", {
    target_date: todayStr,
  });

  return (
    <AppShell
      profile={profile}
      unreadNotifications={unreadNotifications}
      pendingRegistrations={pendingRegistrations}
    >
      <TeamClient
        members={(data as TeamOverviewMember[]) ?? []}
        settings={settings}
        todayStr={todayStr}
      />
    </AppShell>
  );
}
