import { Skeleton } from "@/components/ui/skeleton";

export default function MenuLoading() {
  return (
    <div className="min-h-screen bg-[var(--color--crema-fresca)] animate-in fade-in duration-300">
      {/* Location selector skeleton */}
      <div className="border-b border-black/10 p-4">
        <Skeleton className="h-10 w-64 mx-auto bg-black/5" />
      </div>

      {/* Category tabs skeleton */}
      <div className="flex gap-2 p-4 overflow-x-auto border-b border-black/10">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-9 w-28 bg-black/5 rounded shrink-0" />
        ))}
      </div>

      {/* Menu items list skeleton */}
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="flex justify-between items-center py-3 border-b border-black/10">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-48 bg-black/5" />
              <Skeleton className="h-4 w-72 bg-black/5" />
            </div>
            <Skeleton className="h-5 w-16 bg-black/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
