import { Skeleton } from "@/components/ui/skeleton";

export default function LocationsLoading() {
  return (
    <div className="min-h-screen bg-[var(--color--dark-slate-deepest)] animate-in fade-in duration-300">
      {/* Map skeleton */}
      <div className="h-[300px] md:h-[400px]">
        <Skeleton className="h-full w-full bg-white/5" />
      </div>

      {/* Region tabs skeleton */}
      <nav className="flex gap-2 px-4 py-3 border-b border-white/10 overflow-x-auto">
        <Skeleton className="h-9 w-24 bg-white/10 shrink-0" />
        <Skeleton className="h-9 w-16 bg-white/10 shrink-0" />
        <Skeleton className="h-9 w-16 bg-white/10 shrink-0" />
        <Skeleton className="h-9 w-20 bg-white/10 shrink-0" />
        <Skeleton className="h-9 w-24 bg-white/10 shrink-0" />
        <Skeleton className="h-9 w-20 bg-white/10 shrink-0" />
      </nav>

      {/* Location cards skeleton */}
      <div className="px-4 py-6 space-y-6">
        {/* Region section */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-24 bg-white/10" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="py-4 border-b border-white/10 space-y-2">
              <div className="flex justify-between items-start">
                <Skeleton className="h-5 w-40 bg-white/10" />
                <Skeleton className="h-5 w-14 bg-white/10 rounded-full" />
              </div>
              <Skeleton className="h-4 w-64 bg-white/5" />
              <Skeleton className="h-4 w-48 bg-white/5" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 w-16 bg-white/10 rounded" />
                <Skeleton className="h-8 w-20 bg-white/10 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
