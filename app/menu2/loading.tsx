import { Skeleton } from "@/components/ui/skeleton";

export default function Menu2Loading() {
  return (
    <div className="min-h-screen bg-[var(--color--crema-fresca)] animate-in fade-in duration-300">
      {/* Location selector bar skeleton */}
      <div className="border-b border-black/10 p-4">
        <Skeleton className="h-10 w-64 mx-auto bg-black/5" />
      </div>

      {/* Region tabs skeleton */}
      <div className="flex justify-center gap-2 p-3 border-b border-black/10">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-8 w-20 bg-black/5 rounded" />
        ))}
      </div>

      {/* Category pills skeleton */}
      <div className="flex gap-2 p-4 overflow-x-auto">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} className="h-9 w-24 bg-black/5 rounded-full shrink-0" />
        ))}
      </div>

      {/* Menu items grid skeleton */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <div key={i} className="bg-white rounded-lg p-4 shadow-sm space-y-3">
            <Skeleton className="aspect-[4/3] w-full bg-black/5 rounded" />
            <Skeleton className="h-5 w-3/4 bg-black/5" />
            <Skeleton className="h-4 w-full bg-black/5" />
            <div className="flex justify-between items-center pt-2">
              <Skeleton className="h-5 w-16 bg-black/5" />
              <Skeleton className="h-9 w-20 bg-black/10 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
