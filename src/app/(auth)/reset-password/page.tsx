"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "@/lib/validations/schemas";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useApp } from "@/components/providers/AppProviders";
import type { z } from "zod";

type ResetValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const { toast } = useApp();

  const [mode, setMode] = useState<"link" | "otp">("link");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
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

      // If user is verifying with 6-digit OTP code first
      if (mode === "otp") {
        if (!email.trim() || !otpCode.trim()) {
          setErrorMsg("Please enter both your work email and the 6-digit code.");
          return;
        }

        const { error: otpError } = await supabase.auth.verifyOtp({
          email: email.trim().toLowerCase(),
          token: otpCode.trim(),
          type: "recovery",
        });

        if (otpError) {
          setErrorMsg("Invalid or expired 6-digit verification code. Please try again.");
          return;
        }
      }

      // Update password with active recovery session
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        if (
          error.message.toLowerCase().includes("session") ||
          error.message.toLowerCase().includes("auth")
        ) {
          setErrorMsg(
            "No active reset session found. Please click the reset link in your email or enter your 6-digit code below."
          );
          setMode("otp");
          return;
        }
        setErrorMsg(
          error.message ||
            "Unable to update password. Your reset link may have expired."
        );
        return;
      }

      toast({
        title: "Password updated",
        description: "You can now sign in with your new password.",
        variant: "success",
      });
      router.push("/login");
    } catch {
      setErrorMsg("Unable to reset password. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Set a new password
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Choose a strong new password for your Anfio HRMS account.
      </p>

      {/* Mode Switcher */}
      <div className="mt-5 grid grid-cols-2 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => {
            setMode("link");
            setErrorMsg(null);
          }}
          className={`rounded-lg py-1.5 transition-all cursor-pointer ${
            mode === "link"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          From Email Link
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("otp");
            setErrorMsg(null);
          }}
          className={`rounded-lg py-1.5 transition-all cursor-pointer ${
            mode === "otp"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Use 6-Digit Code
        </button>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 px-4 py-3 text-sm text-rose-700 dark:text-rose-300"
        >
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        {mode === "otp" && (
          <>
            <div>
              <label htmlFor="otp_email" className="block text-sm font-medium mb-1">
                Work Email
              </label>
              <input
                id="otp_email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm"
                placeholder="name@company.com"
              />
            </div>

            <div>
              <label htmlFor="otp_code" className="block text-sm font-medium mb-1">
                6-Digit Verification Code
              </label>
              <input
                id="otp_code"
                type="text"
                maxLength={8}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.trim())}
                required
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm font-mono tracking-widest text-center text-lg"
                placeholder="123456"
              />
            </div>
          </>
        )}

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            New Password
          </label>
          <PasswordInput
            id="password"
            {...register("password")}
            error={Boolean(errors.password)}
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
          <PasswordInput
            id="confirm_password"
            {...register("confirm_password")}
            error={Boolean(errors.confirm_password)}
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

      <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
        <Link href="/login" className="font-semibold text-blue-600 hover:underline">
          Back to Sign in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <Suspense fallback={<div className="text-slate-400 text-sm">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
