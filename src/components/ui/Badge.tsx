import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  PRESENT: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
  LATE: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
  HALF_DAY: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800",
  LEAVE: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800",
  HOLIDAY: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800",
  ABSENT: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
  SUSPENDED: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
  NOT_CHECKED_IN: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  ADMIN: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800",
  MANAGER: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800",
  EMPLOYEE: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label?: string;
  className?: string;
}) {
  const style =
    STATUS_STYLES[status] ??
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        style,
        className
      )}
    >
      {label ?? status.replace(/_/g, " ")}
    </span>
  );
}
