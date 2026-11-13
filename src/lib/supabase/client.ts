import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv } from "@/lib/env";

export function createClient() {
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();
  const isLocalSupabase =
    supabaseUrl.includes("127.0.0.1") || supabaseUrl.includes("localhost");

  const effectiveUrl =
    typeof window !== "undefined" &&
    isLocalSupabase &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
      ? `${window.location.origin}/supabase`
      : supabaseUrl;

  return createBrowserClient(effectiveUrl, supabaseAnonKey, {
    cookieOptions: {
      name: "sb-anfio-auth-token",
    },
  });
}
