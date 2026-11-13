export function getPublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase public environment variables. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return {
    supabaseUrl: url,
    supabaseAnonKey: anonKey,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    defaultTimezone: process.env.NEXT_PUBLIC_TIMEZONE || "Asia/Kolkata",
  };
}

export function getServiceRoleKey(): string {
  if (typeof window !== "undefined") {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY must never be accessed in the browser.");
  }
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY environment variable on the server."
    );
  }
  return key;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
