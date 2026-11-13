"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema } from "@/lib/validations/schemas";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useApp } from "@/components/providers/AppProviders";
import type { z } from "zod";

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export function AccountSettingsClient({ email }: { email: string }) {
  const { theme, toggleTheme, toast } = useApp();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (values: ChangePasswordValues) => {
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: values.current_password,
      });

      if (signInError) {
        toast({
          title: "Incorrect current password",
          description: "Please verify your current password.",
          variant: "error",
        });
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: values.new_password,
      });

      if (error) {
        toast({
          title: "Password update failed",
          description: error.message,
          variant: "error",
        });
        return;
      }

      reset();
      toast({
        title: "Password changed",
        description: "Your password has been updated securely.",
        variant: "success",
      });
    } catch {
      toast({
        title: "Password update failed",
        description: "Unable to change password right now.",
        variant: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Account Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage your password and appearance preferences.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Change Password"
            description="Update your Supabase Auth password"
          />
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label
                  htmlFor="current_password"
                  className="block text-sm font-medium mb-1"
                >
                  Current Password
                </label>
                <input
                  id="current_password"
                  type="password"
                  {...register("current_password")}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm"
                />
                {errors.current_password && (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.current_password.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="new_password" className="block text-sm font-medium mb-1">
                  New Password
                </label>
                <input
                  id="new_password"
                  type="password"
                  {...register("new_password")}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm"
                />
                {errors.new_password && (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.new_password.message}
                  </p>
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
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm"
                />
                {errors.confirm_password && (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.confirm_password.message}
                  </p>
                )}
              </div>

              <Button type="submit" loading={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Appearance"
            description="Customize light or dark mode"
          />
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="text-xs text-slate-500">
                Currently using {theme} mode
              </p>
            </div>
            <Button variant="outline" onClick={toggleTheme}>
              Switch to {theme === "dark" ? "Light" : "Dark"} Mode
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
