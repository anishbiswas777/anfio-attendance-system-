"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/validations/schemas";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useApp } from "@/components/providers/AppProviders";
import type { z } from "zod";

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useApp();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email.toLowerCase(),
        password: values.password,
      });

      if (error || !data.user) {
        setServerError("Invalid email or password.");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, account_status")
        .eq("id", data.user.id)
        .single();

      if (!profile) {
        setServerError("Employee profile not found. Please contact an administrator.");
        return;
      }

      if (profile.account_status === "PENDING") {
        setIsNavigating(true);
        router.push("/pending-approval");
        return;
      }

      if (
        profile.account_status === "REJECTED" ||
        profile.account_status === "SUSPENDED"
      ) {
        setIsNavigating(true);
        router.push("/account-blocked");
        return;
      }

      toast({
        title: "Welcome back",
        description: "Signed in successfully.",
        variant: "success",
      });

      setIsNavigating(true);
      router.push(profile.role === "ADMIN" ? "/admin" : "/dashboard");
      router.refresh();
    } catch {
      setIsNavigating(false);
      setServerError("Unable to sign in right now. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
              A
            </div>
            <span className="text-base font-bold text-slate-900 dark:text-white">
              Anfio HRMS
            </span>
          </Link>
          <h1 className="mt-5 text-2xl font-bold text-slate-900 dark:text-white">
            Sign in to your account
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Enter your work email and password to continue.
          </p>
        </div>

        {serverError && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 px-4 py-3 text-sm text-rose-700 dark:text-rose-300"
          >
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Work Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
              aria-invalid={Boolean(errors.email)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="you@company.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              {...register("password")}
              error={Boolean(errors.password)}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" loading={isSubmitting || isNavigating} className="w-full">
            {isNavigating
              ? "Loading dashboard..."
              : isSubmitting
              ? "Signing in..."
              : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          New employee?{" "}
          <Link href="/register" className="font-semibold text-blue-600 hover:underline">
            Register for an account
          </Link>
        </p>
      </div>
    </div>
  );
}
