"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export default function PendingApprovalPage() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600">
          <Clock className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
          Waiting for Administrator Approval
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Your registration has been received and is currently pending review. You will
          gain access to the employee dashboard as soon as an administrator approves your
          account.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="outline" onClick={() => router.refresh()}>
            Check Status
          </Button>
          <Button variant="secondary" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
