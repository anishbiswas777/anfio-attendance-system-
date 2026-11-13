import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export async function getCurrentUserProfile(): Promise<{
  userId: string | null;
  profile: Profile | null;
}> {
  if (!isSupabaseConfigured()) {
    return { userId: null, profile: null };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { userId: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `
      *,
      department:departments!profiles_department_id_fkey(id, name, description, is_active, manager_id, created_at, updated_at)
    `
    )
    .eq("id", user.id)
    .single();

  let typedProfile = (profile as Profile | null) ?? null;
  if (typedProfile?.manager_id) {
    const { data: mgr } = await supabase
      .from("profiles")
      .select("id, full_name, email, designation")
      .eq("id", typedProfile.manager_id)
      .maybeSingle();
    if (mgr) {
      typedProfile = { ...typedProfile, manager: mgr };
    }
  }

  return {
    userId: user.id,
    profile: typedProfile,
  };
}

/**
 * Enforces an authenticated, ACTIVE user for Server Components.
 * Redirects PENDING users to /pending-approval and REJECTED/SUSPENDED to /account-blocked.
 */
export async function requireActiveUser(): Promise<Profile> {
  const { userId, profile } = await getCurrentUserProfile();

  if (!userId || !profile) {
    redirect("/login");
  }

  if (profile.account_status === "PENDING") {
    redirect("/pending-approval");
  }

  if (
    profile.account_status === "REJECTED" ||
    profile.account_status === "SUSPENDED"
  ) {
    redirect("/account-blocked");
  }

  return profile;
}

/**
 * Enforces an ACTIVE ADMIN for Server Components.
 */
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireActiveUser();
  if (profile.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return profile;
}

/**
 * API-route helper: returns { profile } or { error, status } without redirecting.
 */
export async function requireApiActiveUser(): Promise<
  | { ok: true; profile: Profile }
  | { ok: false; status: number; error: string }
> {
  const { userId, profile } = await getCurrentUserProfile();

  if (!userId || !profile) {
    return { ok: false, status: 401, error: "Authentication required." };
  }

  if (profile.account_status === "PENDING") {
    return {
      ok: false,
      status: 403,
      error: "Your account is pending administrator approval.",
    };
  }

  if (profile.account_status === "REJECTED") {
    return { ok: false, status: 403, error: "Your registration was rejected." };
  }

  if (profile.account_status === "SUSPENDED") {
    return {
      ok: false,
      status: 403,
      error: "Your account has been suspended. Please contact an administrator.",
    };
  }

  return { ok: true, profile };
}

export async function requireApiAdmin(): Promise<
  | { ok: true; profile: Profile }
  | { ok: false; status: number; error: string }
> {
  const auth = await requireApiActiveUser();
  if (!auth.ok) return auth;
  if (auth.profile.role !== "ADMIN") {
    return {
      ok: false,
      status: 403,
      error: "Administrator privileges required.",
    };
  }
  return auth;
}
