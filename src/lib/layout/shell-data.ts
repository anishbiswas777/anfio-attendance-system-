import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export async function getShellCounts(profile: Profile): Promise<{
  unreadNotifications: number;
  pendingRegistrations: number;
}> {
  const supabase = await createClient();
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .is("read_at", null);

  let pendingRegistrations = 0;
  if (profile.role === "ADMIN") {
    const admin = createAdminClient();
    const { count: pendingCount } = await admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("account_status", "PENDING");
    pendingRegistrations = pendingCount ?? 0;
  }

  return {
    unreadNotifications: unreadCount ?? 0,
    pendingRegistrations,
  };
}
