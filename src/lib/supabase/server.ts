import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getPublicEnv, getServiceRoleKey } from "@/lib/env";

export async function createClient() {
  const cookieStore = await cookies();
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: {
      name: "sb-anfio-auth-token",
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component where setting cookies is a no-op;
          // proxy.ts handles refreshing session cookies.
        }
      },
    },
  });
}

/**
 * Server-only privileged client using the service role key.
 * NEVER import or call this from client components.
 */
export function createAdminClient() {
  const { supabaseUrl } = getPublicEnv();
  const serviceRoleKey = getServiceRoleKey();
  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
