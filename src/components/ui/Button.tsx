"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 focus-visible:ring-indigo-500 shadow-sm shadow-indigo-500/25 active:scale-[0.99] border border-white/15",
    secondary:
      "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-white/[0.06] dark:text-slate-100 dark:hover:bg-white/[0.1] dark:border dark:border-white/[0.08]",
    outline:
      "border border-slate-300 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.08] backdrop-blur-xs",
    danger:
      "bg-gradient-to-r from-rose-600 to-rose-700 text-white hover:from-rose-500 hover:to-rose-600 focus-visible:ring-rose-500 shadow-sm shadow-rose-500/20 active:scale-[0.99] border border-white/10",
    ghost:
      "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06]",
  };

  const sizes = {
    sm: "h-8 px-3 text-xs rounded-lg",
    md: "h-10 px-4 text-sm rounded-lg",
    lg: "h-11 px-5 text-base rounded-xl",
  };

  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <Spinner size="sm" useCurrentColor />}
      {children}
    </button>
  );
}
