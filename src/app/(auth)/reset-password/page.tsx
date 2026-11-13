"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "@/lib/validations/schemas";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { useApp } from "@/components/providers/AppProviders";
import type { z } from "zod";

type ResetValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast } = useApp();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (values: ResetValues) => {
    setErrorMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        setErrorMsg("Unable to update password. Your reset link may have expired.");
        return;
      }

      toast({
        title: "Password updated",
        description: "You can now sign in with your new password.",
        variant: "success",
      });
      router.push("/login");
    } catch {
      setErrorMsg("Unable to reset password.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Set a new password
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Choose a strong password for your account.
        </p>

        {errorMsg && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 px-4 py-3 text-sm text-rose-700 dark:text-rose-300"
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              New Password
            </label>
            <input
              id="password"
              type="password"
              {...register("password")}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirm_password"
              className="block text-sm font-medium mb-1"
            >
              Confirm New Password
            </label>
            <input
              id="confirm_password"
              type="password"
              {...register("confirm_password")}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm"
            />
            {errors.confirm_password && (
              <p className="mt-1 text-xs text-rose-600">
                {errors.confirm_password.message}
              </p>
            )}
          </div>

          <Button type="submit" loading={isSubmitting} className="w-full">
            {isSubmitting ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
