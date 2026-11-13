"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export default function AccountBlockedPage() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
          Account Access Restricted
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Your account is currently suspended or your registration was rejected. Please
          contact your HR administrator for assistance.
        </p>
        <div className="mt-6">
          <Button variant="secondary" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
