import { createAdminClient } from "@/lib/supabase/server";

export interface AuditLogInput {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
}

export async function createAuditLog(input: AuditLogInput): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("audit_logs").insert({
      actor_id: input.actorId,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      old_data: input.oldData ?? null,
      new_data: input.newData ?? null,
    });
    if (error) {
      console.error("[audit_logs] Failed to insert audit log:", error.message);
    }
  } catch (err) {
    console.error("[audit_logs] Unexpected error:", err);
  }
}
