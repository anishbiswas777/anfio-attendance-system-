import { requireActiveUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import { getShellCounts } from "@/lib/layout/shell-data";
import { AppShell } from "@/components/layout/AppShell";
import { ProfileClient } from "@/components/profile/ProfileClient";

export default async function ProfilePage() {
  const profile = await requireActiveUser();
  const { unreadNotifications, pendingRegistrations } = await getShellCounts(profile);

  let avatarSignedUrl: string | null = null;
  if (profile.avatar_url) {
    const admin = createAdminClient();
    const { data } = await admin.storage
      .from("avatars")
      .createSignedUrl(profile.avatar_url, 3600);
    avatarSignedUrl = data?.signedUrl ?? null;
  }

  return (
    <AppShell
      profile={profile}
      unreadNotifications={unreadNotifications}
      pendingRegistrations={pendingRegistrations}
    >
      <ProfileClient profile={profile} avatarSignedUrl={avatarSignedUrl} />
    </AppShell>
  );
}
