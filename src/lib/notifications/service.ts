import { createAdminClient } from "@/lib/supabase/server";

export async function notifyUser(params: {
  userId: string;
  title: string;
  message: string;
  type?: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  link?: string;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("notifications").insert({
      user_id: params.userId,
      title: params.title,
      message: params.message,
      type: params.type ?? "INFO",
      link: params.link ?? null,
    });
    if (error) {
      console.error("[notifications] notifyUser failed:", error.message);
    }
  } catch (err) {
    console.error("[notifications] notifyUser error:", err);
  }
}

export async function notifyAdmins(params: {
  title: string;
  message: string;
  type?: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  link?: string;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: admins, error: fetchError } = await admin
      .from("profiles")
      .select("id")
      .eq("role", "ADMIN")
      .eq("account_status", "ACTIVE");

    if (fetchError || !admins?.length) return;

    const rows = admins.map((a) => ({
      user_id: a.id,
      title: params.title,
      message: params.message,
      type: params.type ?? "INFO",
      link: params.link ?? null,
    }));

    const { error } = await admin.from("notifications").insert(rows);
    if (error) {
      console.error("[notifications] notifyAdmins failed:", error.message);
    }
  } catch (err) {
    console.error("[notifications] notifyAdmins error:", err);
  }
}

export async function notifyManager(params: {
  employeeId: string;
  title: string;
  message: string;
  type?: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  link?: string;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: emp } = await admin
      .from("profiles")
      .select("manager_id, department_id")
      .eq("id", params.employeeId)
      .single();

    let managerId = emp?.manager_id ?? null;

    if (!managerId && emp?.department_id) {
      const { data: dept } = await admin
        .from("departments")
        .select("manager_id")
        .eq("id", emp.department_id)
        .single();
      managerId = dept?.manager_id ?? null;
    }

    if (managerId && managerId !== params.employeeId) {
      await notifyUser({
        userId: managerId,
        title: params.title,
        message: params.message,
        type: params.type ?? "INFO",
        link: params.link,
      });
    }
  } catch (err) {
    console.error("[notifications] notifyManager error:", err);
  }
}
