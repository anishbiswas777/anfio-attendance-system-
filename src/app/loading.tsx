import { Spinner } from "@/components/ui/Spinner";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-3">
        <Spinner size="lg" />
      </div>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wide animate-pulse">
        Loading...
      </p>
    </div>
  );
}
