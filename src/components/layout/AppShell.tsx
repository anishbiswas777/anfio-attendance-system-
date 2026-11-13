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
import { Spinner } from "@/components/ui/Spinner";
import { FaceLoader } from "@/components/ui/FaceLoader";
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
          prefetch={true}
          onClick={() => {
            if (item.href !== pathname) {
              setNavigatingHref(item.href);
            }
            setMobileOpen(false);
          }}
          className={cn(
            "flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-all",
            active
              ? "bg-blue-50 text-blue-700 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border dark:border-indigo-500/30 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] dark:hover:text-slate-200"
          )}
        >
          <span className="flex items-center gap-2.5">
            {isNavigating ? (
              <Spinner size="sm" />
            ) : (
              <Icon className="h-4 w-4 shrink-0" />
            )}
            <span>{item.label}</span>
          </span>
          {item.href === "/notifications" && unreadNotifications > 0 && (
            <span className="rounded-full bg-blue-600 dark:bg-indigo-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
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
    <div className="min-h-screen flex bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100">
      {navigatingHref && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/10 dark:bg-black/40">
          <FaceLoader />
        </div>
      )}
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#050508]">
        <div className="flex h-16 items-center gap-2.5 border-b border-slate-100 dark:border-white/[0.06] px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-sm shadow-indigo-500/30">
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
                <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Administration
                </p>
                {renderNavList(ADMIN_NAV)}
              </div>
              <div className="space-y-1">
                <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Account
                </p>
                {renderNavList(ADMIN_ACCOUNT_NAV)}
              </div>
            </>
          ) : (
            <div className="space-y-1">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Workspace
              </p>
              {renderNavList(EMPLOYEE_NAV)}
            </div>
          )}
        </nav>

        <div className="border-t border-slate-100 dark:border-white/[0.06] p-3">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-transparent dark:border-white/[0.06] p-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold text-sm shrink-0 shadow-xs">
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
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/[0.1] px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            {loggingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-black/70 backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 w-72 sm:w-80 bg-white dark:bg-[#07070a] border-r border-slate-200 dark:border-white/[0.08] flex flex-col shadow-2xl transition-transform duration-300 ease-out"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-16 items-center justify-between border-b border-slate-100 dark:border-white/[0.06] px-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-sm shadow-indigo-500/30">
                  A
                </div>
                <div>
                  <p className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                    Anfio HRMS
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Attendance & Team
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation menu"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.08]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Profile snippet in drawer */}
            <div className="p-4 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm shrink-0 shadow-xs">
                  {profile.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                    {profile.full_name}
                  </p>
                  <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                    {profile.employee_code || profile.email}
                  </p>
                  <div className="mt-1">
                    <StatusBadge status={profile.role} className="text-[10px] px-1.5 py-0" />
                  </div>
                </div>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 touch-scroll">
              {profile.role === "ADMIN" ? (
                <>
                  <div className="space-y-1">
                    <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Administration
                    </p>
                    {renderNavList(ADMIN_NAV)}
                  </div>
                  <div className="space-y-1">
                    <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Account
                    </p>
                    {renderNavList(ADMIN_ACCOUNT_NAV)}
                  </div>
                </>
              ) : (
                <div className="space-y-1">{renderNavList(EMPLOYEE_NAV)}</div>
              )}
            </nav>
            <div className="border-t border-slate-100 dark:border-white/[0.06] p-3 pb-safe">
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/[0.1] px-3 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                {loggingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-black/85 backdrop-blur-xl px-3 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden rounded-lg p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.08] cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 min-w-0">
              <span className="hidden sm:inline font-semibold text-slate-900 dark:text-white">Anfio</span>
              <ChevronRight className="hidden sm:inline h-3.5 w-3.5 text-slate-400" />
              <span className="font-semibold text-slate-900 dark:text-white sm:font-medium sm:text-slate-800 dark:sm:text-slate-200 capitalize truncate text-sm sm:text-xs">
                {pathname.split("/").filter(Boolean).slice(-1)[0]?.replace(/-/g, " ") || "Dashboard"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="rounded-lg p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.08] cursor-pointer"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            <Link
              href="/notifications"
              aria-label="Notifications"
              prefetch={true}
              className="relative rounded-lg p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.08]"
            >
              <Bell className="h-4 w-4" />
              {unreadNotifications > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-1 text-[10px] font-bold text-white shadow-xs">
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </span>
              )}
            </Link>

            <Link
              href="/profile"
              aria-label="My Profile"
              prefetch={true}
              className="flex items-center gap-2 rounded-lg p-1 sm:px-2.5 sm:py-1.5 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xs shrink-0 shadow-xs">
                {profile.full_name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline text-xs font-medium text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
                {profile.employee_code || profile.full_name.split(" ")[0]}
              </span>
            </Link>
          </div>
        </header>

        <main className="flex-1 px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pb-36 sm:pb-28 lg:pb-8 max-w-7xl w-full mx-auto min-w-0">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav
          aria-label="Mobile Bottom Navigation"
          className="fixed bottom-0 inset-x-0 z-30 lg:hidden border-t border-slate-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-black/90 backdrop-blur-xl grid grid-cols-5 min-h-[4rem] h-auto py-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))]"
        >
          {(profile.role === "ADMIN"
            ? [
                { label: "Admin", href: "/admin", icon: ShieldCheck },
                { label: "Approve", href: "/admin/registrations", icon: UserCheck },
                { label: "Attendance", href: "/admin/attendance", icon: Clock },
                { label: "Leave", href: "/admin/leave", icon: CalendarDays },
              ]
            : [
                { label: "Home", href: "/dashboard", icon: LayoutDashboard },
                { label: "Attend", href: "/attendance", icon: Clock },
                { label: "Leave", href: "/leave", icon: CalendarDays },
                { label: "Team", href: "/team", icon: Users },
              ]
          ).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={() => {
                  if (item.href !== pathname) {
                    setNavigatingHref(item.href);
                  }
                }}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-[11px] font-medium relative transition-colors py-1",
                  active
                    ? "text-blue-600 dark:text-indigo-400 font-semibold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
              >
                <Icon className={cn("h-4 w-4", active && "scale-110 transition-transform")} />
                <span className="truncate max-w-[60px]">{item.label}</span>
                {active && (
                  <span className="w-1 h-1 rounded-full bg-blue-600 dark:bg-indigo-400" />
                )}
                {item.href === "/admin/registrations" && pendingRegistrations > 0 && (
                  <span className="absolute top-1.5 right-4 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-black" />
                )}
              </Link>
            );
          })}

          {/* 5th item: More / Menu drawer trigger */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer py-1"
          >
            <Menu className="h-4 w-4" />
            <span>More</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
