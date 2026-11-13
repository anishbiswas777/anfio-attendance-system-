"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatOfficeDateTime } from "@/lib/attendance/calculations";
import { useApp } from "@/components/providers/AppProviders";
import type { NotificationItem, OfficeSettings } from "@/types/database";

export function NotificationsClient({
  notifications: initial,
  settings,
}: {
  notifications: NotificationItem[];
  settings: OfficeSettings;
}) {
  const router = useRouter();
  const { toast } = useApp();
  const [items, setItems] = useState(initial);
  const [loadingAll, setLoadingAll] = useState(false);

  const unreadCount = items.filter((n) => !n.read_at).length;

  const markAsRead = async (id: string) => {
    const res = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      const now = new Date().toISOString();
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: now } : n))
      );
      router.refresh();
    }
  };

  const markAllAsRead = async () => {
    setLoadingAll(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      if (res.ok) {
        const now = new Date().toISOString();
        setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? now })));
        toast({ title: "All notifications marked as read", variant: "success" });
        router.refresh();
      }
    } finally {
      setLoadingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Notifications
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            loading={loadingAll}
            onClick={markAllAsRead}
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader title="Activity Feed" />
        <CardContent className="p-0">
          {items.length === 0 ? (
            <EmptyState
              title="No notifications"
              description="You have no notifications yet."
              icon={<Bell className="h-5 w-5" />}
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((n) => (
                <div
                  key={n.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 ${
                    !n.read_at ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      {!n.read_at && (
                        <span className="h-2 w-2 rounded-full bg-blue-600" />
                      )}
                      <p className="text-sm font-semibold">{n.title}</p>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {n.message}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {formatOfficeDateTime(n.created_at, settings.timezone)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {n.link && (
                      <Link
                        href={n.link}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Open
                      </Link>
                    )}
                    {!n.read_at && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markAsRead(n.id)}
                      >
                        Mark read
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
