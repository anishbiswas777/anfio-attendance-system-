import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 animate-pulse"
          >
            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded mb-3" />
            <div className="h-8 w-16 bg-slate-300 dark:bg-slate-700 rounded" />
          </div>
        ))}
      </div>
      <div className="h-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
        <span className="text-xs text-slate-500 animate-pulse">Loading admin data...</span>
      </div>
    </div>
  );
}
