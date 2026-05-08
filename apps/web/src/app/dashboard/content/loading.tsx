import { MediaGridSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="h-9 w-64 bg-muted rounded animate-pulse" />
        <div className="h-4 w-96 bg-muted/60 rounded animate-pulse" />
      </div>
      <MediaGridSkeleton />
    </div>
  );
}
