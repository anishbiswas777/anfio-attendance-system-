import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const auth = await requireApiAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim();
    const departmentId = searchParams.get("departmentId") || "";
    const status = searchParams.get("status") || "";
    const role = searchParams.get("role") || "";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(50, Math.max(5, Number(searchParams.get("pageSize") || 15)));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const admin = createAdminClient();
    let query = admin
      .from("profiles")
      .select(
        `
        *,
        department:departments!profiles_department_id_fkey(id, name)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%,employee_code.ilike.%${search}%`
      );
    }
    if (departmentId) {
      query = query.eq("department_id", departmentId);
    }
    if (status) {
      query = query.eq("account_status", status);
    }
    if (role) {
      query = query.eq("role", role);
    }

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Unable to load employees." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      employees: data ?? [],
      total: count ?? 0,
      page,
      pageSize,
    });
  } catch (err) {
    console.error("[admin employees GET] Error:", err);
    return NextResponse.json(
      { error: "Unable to load employees." },
      { status: 500 }
    );
  }
}
