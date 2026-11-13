import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import { getOfficeSettings } from "@/lib/settings/server";
import { getShellCounts } from "@/lib/layout/shell-data";
import { formatOfficeDateTime } from "@/lib/attendance/calculations";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { AuditLog } from "@/types/database";

export default async function AdminAuditLogsPage() {
  const profile = await requireAdmin();
  const settings = await getOfficeSettings();
  const { unreadNotifications, pendingRegistrations } = await getShellCounts(profile);

  const admin = createAdminClient();
  const { data } = await admin
    .from("audit_logs")
    .select(
      "*, actor:profiles!audit_logs_actor_id_fkey(id, full_name, email, role)"
    )
    .order("created_at", { ascending: false })
    .limit(150);

  const logs = (data as AuditLog[]) ?? [];

  return (
    <AppShell
      profile={profile}
      unreadNotifications={unreadNotifications}
      pendingRegistrations={pendingRegistrations}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            System Audit Logs
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Immutable security and operational audit trail.
          </p>
        </div>

        <Card>
          <CardHeader title={`Recent Events (${logs.length})`} />
          <CardContent className="p-0">
            {logs.length === 0 ? (
              <EmptyState
                title="No audit logs yet"
                description="Sensitive actions will be recorded here."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">Actor</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Entity</th>
                      <th className="px-4 py-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                          {formatOfficeDateTime(log.created_at, settings.timezone)}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">
                            {log.actor?.full_name || "System"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {log.actor?.email || ""}
                          </p>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-semibold">
                          {log.action}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={log.entity_type.toUpperCase()} />
                        </td>
                        <td className="px-4 py-3 max-w-md truncate text-xs text-slate-500 font-mono">
                          {log.new_data ? JSON.stringify(log.new_data) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
