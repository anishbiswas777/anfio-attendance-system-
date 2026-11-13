import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      {
        error:
          "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY to .env.local.",
        departments: [],
      },
      { status: 503 }
    );
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("departments")
      .select("id, name, is_active")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: "Unable to load departments.", departments: [] },
        { status: 500 }
      );
    }

    return NextResponse.json({ departments: data ?? [] });
  } catch {
    return NextResponse.json(
      { error: "Unable to load departments.", departments: [] },
      { status: 500 }
    );
  }
}
