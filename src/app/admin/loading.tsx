import { FaceLoader } from "@/components/ui/FaceLoader";

export default function AdminLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/10 dark:bg-black/25 pointer-events-none">
      <FaceLoader />
    </div>
  );
}
