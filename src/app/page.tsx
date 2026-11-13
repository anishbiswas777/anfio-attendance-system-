import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock, ShieldCheck, Users } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentUserProfile } from "@/lib/auth/session";

export default async function HomePage() {
  if (isSupabaseConfigured()) {
    try {
      const { profile } = await getCurrentUserProfile();
      if (profile) {
        if (profile.account_status === "ACTIVE") {
          redirect(profile.role === "ADMIN" ? "/admin" : "/dashboard");
        } else if (profile.account_status === "PENDING") {
          redirect("/pending-approval");
        } else {
          redirect("/account-blocked");
        }
      }
    } catch {
      // Fall through to landing page if session check fails
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
              A
            </div>
            <span className="text-base font-bold text-slate-900 dark:text-white">
              Anfio HRMS
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-xs"
            >
              Employee Register
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-2xl">
          <span className="inline-flex items-center rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
            Office Attendance & Team Management
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Reliable attendance, leave, and team operations in one workspace.
          </h1>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Built with timezone-accurate check-in/check-out, admin-approved onboarding,
            automated late calculation, leave workflows, audit logging, and Row Level Security.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
            >
              Sign in to Workspace
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              New Employee Registration
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Clock,
              title: "Timezone-Safe Attendance",
              desc: "One-tap check-in & check-out with configurable office hours, grace period, and working hours.",
            },
            {
              icon: CheckCircle2,
              title: "Leave & Late Workflows",
              desc: "Submit leave requests and late reports with manager/admin review and real-time notifications.",
            },
            {
              icon: Users,
              title: "Privacy-First Team View",
              desc: "See team presence and approved leave without exposing private reasons or attachments.",
            },
            {
              icon: ShieldCheck,
              title: "Enterprise Security & RLS",
              desc: "PostgreSQL Row Level Security, server-side authorization, and immutable audit logs.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">
                  {item.title}
                </h2>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
