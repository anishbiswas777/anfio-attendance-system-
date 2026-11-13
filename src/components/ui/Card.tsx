import React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#08080c] shadow-xs dark:shadow-[0_4px_24px_rgba(0,0,0,0.6)] transition-all",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-white/[0.06] px-4 sm:px-5 py-3.5 sm:py-4",
        className
      )}
    >
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-1 sm:mt-0 flex-shrink-0">{action}</div>}
    </div>
  );
}

export function CardContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("p-4 sm:p-5", className)}>{children}</div>;
}
