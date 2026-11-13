"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
  CalendarDays,
  FileWarning,
  Users,
  Bell,
  UserCircle,
  Settings,
  ShieldCheck,
  UserCheck,
  Building2,
  CalendarRange,
  FileBarChart2,
  ScrollText,
  SlidersHorizontal,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/components/providers/AppProviders";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/Badge";
import type { Profile } from "@/types/database";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const EMPLOYEE_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Attendance", href: "/attendance", icon: Clock },
  { label: "Late Reports", href: "/late-reports", icon: FileWarning },
  { label: "Leave", href: "/leave", icon: CalendarDays },
  { label: "Team", href: "/team", icon: Users },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Profile", href: "/profile", icon: UserCircle },
  { label: "Settings", href: "/settings", icon: Settings },
];

const ADMIN_ACCOUNT_NAV: NavItem[] = [
  { label: "Team", href: "/team", icon: Users },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Profile", href: "/profile", icon: UserCircle },
  { label: "Account Settings", href: "/settings", icon: Settings },
];

const ADMIN_NAV: NavItem[] = [
  { label: "Admin Overview", href: "/admin", icon: ShieldCheck },
  { label: "Registrations", href: "/admin/registrations", icon: UserCheck },
  { label: "Employees", href: "/admin/employees", icon: Users },
  { label: "Attendance", href: "/admin/attendance", icon: Clock },
  { label: "Leave Requests", href: "/admin/leave", icon: CalendarDays },
  { label: "Late Reports", href: "/admin/late-reports", icon: FileWarning },
  { label: "Departments", href: "/admin/departments", icon: Building2 },
  { label: "Holidays", href: "/admin/holidays", icon: CalendarRange },
  { label: "Reports", href: "/admin/reports", icon: FileBarChart2 },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText },
  { label: "Office Settings", href: "/admin/settings", icon: SlidersHorizontal },
];

export function AppShell({
  profile,
  unreadNotifications,
  pendingRegistrations = 0,
  children,
}: {
  profile: Profile;
  unreadNotifications: number;
  pendingRegistrations?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme, toast } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [navigatingHref, setNavigatingHref] = useState<string | null>(null);

  useEffect(() => {
    setNavigatingHref(null);
  }, [pathname]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch {
      toast({
        title: "Logout failed",
        description: "Please try again.",
        variant: "error",
      });
    } finally {
      setLoggingOut(false);
    }
  };

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin" || pathname === "/admin/dashboard";
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const renderNavList = (items: NavItem[]) =>
    items.map((item) => {
      const Icon = item.icon;
      const active = isActive(item.href);
      const isNavigating = navigatingHref === item.href;
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => {
            if (item.href !== pathname) {
              setNavigatingHref(item.href);
            }
            setMobileOpen(false);
          }}
          className={cn(
            "flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-colors",
            active
              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80"
          )}
        >
          <span className="flex items-center gap-2.5">
            {isNavigating ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-600 dark:text-blue-400" />
            ) : (
              <Icon className="h-4 w-4 shrink-0" />
            )}
            <span>{item.label}</span>
          </span>
          {item.href === "/notifications" && unreadNotifications > 0 && (
            <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {unreadNotifications}
            </span>
          )}
          {item.href === "/admin/registrations" && pendingRegistrations > 0 && (
            <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {pendingRegistrations}
            </span>
          )}
        </Link>
      );
    });

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {navigatingHref && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-blue-100 dark:bg-blue-950 overflow-hidden">
          <div className="h-full bg-blue-600 animate-[pulse_0.8s_ease-in-out_infinite] w-full" />
        </div>
      )}
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex h-16 items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
            A
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              Anfio HRMS
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Attendance & Team
            </p>
          </div>
        </div>

        <nav
          aria-label="Primary Navigation"
          className="flex-1 overflow-y-auto px-3 py-4 space-y-6"
        >
          {profile.role === "ADMIN" ? (
            <>
              <div className="space-y-1">
                <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Administration
                </p>
                {renderNavList(ADMIN_NAV)}
              </div>
              <div className="space-y-1">
                <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Account
                </p>
                {renderNavList(ADMIN_ACCOUNT_NAV)}
              </div>
            </>
          ) : (
            <div className="space-y-1">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Workspace
              </p>
              {renderNavList(EMPLOYEE_NAV)}
            </div>
          )}
        </nav>

        <div className="border-t border-slate-100 dark:border-slate-800 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-semibold text-sm shrink-0">
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                {profile.full_name}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <StatusBadge status={profile.role} className="text-[10px] px-1.5 py-0" />
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            {loggingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-slate-950/60 backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-16 items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4">
              <span className="text-sm font-bold">Anfio HRMS</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation menu"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
              {profile.role === "ADMIN" ? (
                <>
                  <div className="space-y-1">
                    <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Administration
                    </p>
                    {renderNavList(ADMIN_NAV)}
                  </div>
                  <div className="space-y-1">
                    <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Account
                    </p>
                    {renderNavList(ADMIN_ACCOUNT_NAV)}
                  </div>
                </>
              ) : (
                <div className="space-y-1">{renderNavList(EMPLOYEE_NAV)}</div>
              )}
            </nav>
            <div className="border-t border-slate-100 dark:border-slate-800 p-3">
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden rounded-lg p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span>Anfio</span>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="font-medium text-slate-800 dark:text-slate-200 capitalize">
                {pathname.split("/").filter(Boolean).join(" / ") || "Dashboard"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="rounded-lg p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            <Link
              href="/notifications"
              aria-label="Notifications"
              className="relative rounded-lg p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Bell className="h-4 w-4" />
              {unreadNotifications > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </span>
              )}
            </Link>

            <Link
              href="/profile"
              className="hidden sm:flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                {profile.employee_code || profile.full_name}
              </span>
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 lg:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav
          aria-label="Mobile Bottom Navigation"
          className="fixed bottom-0 inset-x-0 z-30 lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md grid grid-cols-5 h-16"
        >
          {(profile.role === "ADMIN"
            ? [
                { label: "Admin", href: "/admin", icon: ShieldCheck },
                { label: "Approve", href: "/admin/registrations", icon: UserCheck },
                { label: "Leave", href: "/admin/leave", icon: CalendarDays },
                { label: "Staff", href: "/admin/employees", icon: Users },
                { label: "Alerts", href: "/notifications", icon: Bell },
              ]
            : [
                { label: "Home", href: "/dashboard", icon: LayoutDashboard },
                { label: "Attend", href: "/attendance", icon: Clock },
                { label: "Leave", href: "/leave", icon: CalendarDays },
                { label: "Team", href: "/team", icon: Users },
                { label: "Alerts", href: "/notifications", icon: Bell },
              ]
          ).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-[11px] font-medium relative",
                  active
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-500 dark:text-slate-400"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {item.href === "/notifications" && unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-4 h-2 w-2 rounded-full bg-blue-600" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
