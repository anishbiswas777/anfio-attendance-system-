"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { registerSchema } from "@/lib/validations/schemas";
import { Button } from "@/components/ui/Button";
import type { Department } from "@/types/database";
import type { z } from "zod";

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptNotice, setDeptNotice] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch("/api/departments")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setDeptNotice(
            data.error ||
              "Unable to load departments. Please check your Supabase configuration."
          );
          return;
        }
        const active = Array.isArray(data.departments)
          ? data.departments.filter((d: Department) => d.is_active)
          : [];
        setDepartments(active);
        if (active.length === 0) {
          setDeptNotice(
            "No active departments found. Run supabase/seed.sql in Supabase SQL Editor or create a department in Admin."
          );
        }
      })
      .catch(() => {
        setDeptNotice("Unable to load departments.");
      });
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      joining_date: new Date().toISOString().slice(0, 10),
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([k, v]) => formData.append(k, String(v)));
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || "Registration failed.");
        return;
      }

      setSubmitted(true);
    } catch {
      setServerError("Unable to submit registration. Please try again.");
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
            Registration submitted successfully.
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Your account is waiting for administrator approval. You will be able to sign
            in once an administrator activates your account.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Back to Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-10">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
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
            Employee Registration
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Complete your details below. New accounts require administrator approval.
          </p>
        </div>

        {deptNotice && (
          <div
            role="status"
            className="mb-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 px-4 py-3 text-sm text-amber-800 dark:text-amber-300"
          >
            {deptNotice}
          </div>
        )}

        {serverError && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 px-4 py-3 text-sm text-rose-700 dark:text-rose-300"
          >
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium mb-1">
                Full Name *
              </label>
              <input
                id="full_name"
                type="text"
                {...register("full_name")}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm"
                placeholder="Anish Biswas"
              />
              {errors.full_name && (
                <p className="mt-1 text-xs text-rose-600">{errors.full_name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Work Email *
              </label>
              <input
                id="email"
                type="email"
                {...register("email")}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm"
                placeholder="anish@company.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1">
                Phone *
              </label>
              <input
                id="phone"
                type="tel"
                {...register("phone")}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm"
                placeholder="+91 9876543210"
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-rose-600">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="employee_code" className="block text-sm font-medium mb-1">
                Employee ID *
              </label>
              <input
                id="employee_code"
                type="text"
                {...register("employee_code")}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm uppercase"
                placeholder="EMP-101"
              />
              {errors.employee_code && (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.employee_code.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="department_id" className="block text-sm font-medium mb-1">
                Department *
              </label>
              <select
                id="department_id"
                {...register("department_id")}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm"
              >
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              {errors.department_id && (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.department_id.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="designation" className="block text-sm font-medium mb-1">
                Designation *
              </label>
              <input
                id="designation"
                type="text"
                {...register("designation")}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm"
                placeholder="Software Engineer"
              />
              {errors.designation && (
                <p className="mt-1 text-xs text-rose-600">{errors.designation.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="joining_date" className="block text-sm font-medium mb-1">
                Joining Date *
              </label>
              <input
                id="joining_date"
                type="date"
                {...register("joining_date")}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm"
              />
              {errors.joining_date && (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.joining_date.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="avatar" className="block text-sm font-medium mb-1">
                Profile Photo (optional)
              </label>
              <input
                id="avatar"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Password *
              </label>
              <input
                id="password"
                type="password"
                {...register("password")}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm"
                placeholder="Min 8 chars, upper, lower, number"
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
                Confirm Password *
              </label>
              <input
                id="confirm_password"
                type="password"
                {...register("confirm_password")}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm"
                placeholder="Repeat password"
              />
              {errors.confirm_password && (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.confirm_password.message}
                </p>
              )}
            </div>
          </div>

          <Button type="submit" loading={isSubmitting} className="w-full mt-2">
            {isSubmitting ? "Submitting registration..." : "Submit Registration"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
