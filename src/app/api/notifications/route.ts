import { NextResponse } from "next/server";
import { requireApiActiveUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const auth = await requireApiActiveUser();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", auth.profile.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json(
        { error: "Unable to load notifications." },
        { status: 500 }
      );
    }

    const notifications = data ?? [];
    const unreadCount = notifications.filter((n) => !n.read_at).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (err) {
    console.error("[notifications GET] Error:", err);
    return NextResponse.json(
      { error: "Unable to load notifications." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireApiActiveUser();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const supabase = await createClient();
    const nowIso = new Date().toISOString();

    if (body?.markAll === true) {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: nowIso })
        .eq("user_id", auth.profile.id)
        .is("read_at", null);

      if (error) {
        return NextResponse.json(
          { error: "Unable to mark notifications as read." },
          { status: 500 }
        );
      }
      return NextResponse.json({ updated: true });
    }

    if (typeof body?.id === "string") {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: nowIso })
        .eq("id", body.id)
        .eq("user_id", auth.profile.id);

      if (error) {
        return NextResponse.json(
          { error: "Unable to mark notification as read." },
          { status: 500 }
        );
      }
      return NextResponse.json({ updated: true });
    }

    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  } catch (err) {
    console.error("[notifications PATCH] Error:", err);
    return NextResponse.json(
      { error: "Unable to update notifications." },
      { status: 500 }
    );
  }
}
