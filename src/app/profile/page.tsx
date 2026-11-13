import { requireActiveUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import { getShellCounts } from "@/lib/layout/shell-data";
import { AppShell } from "@/components/layout/AppShell";
import { ProfileClient } from "@/components/profile/ProfileClient";

export default async function ProfilePage() {
  const profile = await requireActiveUser();

  const [{ unreadNotifications, pendingRegistrations }, avatarSignedUrl] =
    await Promise.all([
      getShellCounts(profile),
      profile.avatar_url
        ? createAdminClient()
            .storage.from("avatars")
            .createSignedUrl(profile.avatar_url, 3600)
            .then(({ data }) => data?.signedUrl ?? null)
        : Promise.resolve(null),
    ]);

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
