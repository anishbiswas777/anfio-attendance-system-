"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileUpdateSchema } from "@/lib/validations/schemas";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { useApp } from "@/components/providers/AppProviders";
import type { Profile } from "@/types/database";
import type { z } from "zod";

type ProfileFormValues = z.infer<typeof profileUpdateSchema>;

export function ProfileClient({
  profile,
  avatarSignedUrl,
}: {
  profile: Profile;
  avatarSignedUrl: string | null;
}) {
  const router = useRouter();
  const { toast } = useApp();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(avatarSignedUrl);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      full_name: profile.full_name,
      phone: profile.phone ?? "",
      designation: profile.designation ?? "",
    },
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append("bucket", "avatars");
      fd.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Avatar upload failed",
          description: data.error || "Unable to upload photo.",
          variant: "error",
        });
        return;
      }
      if (data.signedUrl) setAvatarPreview(data.signedUrl);
      toast({ title: "Profile photo updated", variant: "success" });
      router.refresh();
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) {
      toast({
        title: "Update failed",
        description: data.error || "Unable to update profile.",
        variant: "error",
      });
      return;
    }
    toast({ title: "Profile updated successfully", variant: "success" });
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          My Profile
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          View your employment details and update allowed personal information.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Profile Overview" />
          <CardContent className="flex flex-col items-center text-center">
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarPreview}
                alt={profile.full_name}
                className="h-24 w-24 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 text-2xl font-bold">
                {profile.full_name.charAt(0).toUpperCase()}
              </div>
            )}

            <h2 className="mt-4 text-lg font-bold">{profile.full_name}</h2>
            <p className="text-xs text-slate-500">
              {profile.designation || "Employee"} • {profile.employee_code || "—"}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <StatusBadge status={profile.role} />
              <StatusBadge status={profile.account_status} />
            </div>

            <label className="mt-5 inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800">
              {uploadingAvatar ? "Uploading..." : "Change Photo"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={uploadingAvatar}
              />
            </label>

            <div className="mt-6 w-full space-y-2.5 border-t border-slate-100 dark:border-slate-800 pt-4 text-left text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Email</span>
                <span className="font-medium">{profile.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department</span>
                <span className="font-medium">
                  {profile.department?.name || "Unassigned"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Manager</span>
                <span className="font-medium">
                  {profile.manager?.full_name || "Unassigned"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Joining Date</span>
                <span className="font-medium">{profile.joining_date || "—"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Edit Allowed Information"
            description="Role, department, manager, employee ID, and status are managed by administrators."
          />
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium mb-1">
                  Full Name
                </label>
                <input
                  id="full_name"
                  type="text"
                  {...register("full_name")}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm"
                />
                {errors.full_name && (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.full_name.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-1">
                  Phone
                </label>
                <input
                  id="phone"
                  type="tel"
                  {...register("phone")}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm"
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-rose-600">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="designation" className="block text-sm font-medium mb-1">
                  Designation
                </label>
                <input
                  id="designation"
                  type="text"
                  {...register("designation")}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm"
                />
                {errors.designation && (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.designation.message}
                  </p>
                )}
              </div>

              <Button type="submit" loading={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
