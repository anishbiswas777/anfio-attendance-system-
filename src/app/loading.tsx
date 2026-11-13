import { Spinner } from "@/components/ui/Spinner";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/20 dark:bg-black/40 backdrop-blur-md pointer-events-none">
      <div className="flex flex-col items-center justify-center gap-3">
        <Spinner size="xl" className="h-14 w-14 drop-shadow-md" />
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 tracking-wide drop-shadow-sm">
          Loading...
        </p>
      </div>
    </div>
  );
}
