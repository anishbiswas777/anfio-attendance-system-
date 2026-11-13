import { cache } from "react";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export const getShellCounts = cache(async function getShellCounts(profile: Profile): Promise<{
  unreadNotifications: number;
  pendingRegistrations: number;
}> {
  const supabase = await createClient();

  if (profile.role === "ADMIN") {
    const admin = createAdminClient();
    const [{ count: unreadCount }, { count: pendingCount }] = await Promise.all([
      supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .is("read_at", null),
      admin
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("account_status", "PENDING"),
    ]);

    return {
      unreadNotifications: unreadCount ?? 0,
      pendingRegistrations: pendingCount ?? 0,
    };
  }

  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .is("read_at", null);

  return {
    unreadNotifications: unreadCount ?? 0,
    pendingRegistrations: 0,
  };
});
