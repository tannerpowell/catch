import { Skeleton } from "@/components/ui/skeleton";

/**
 * Kitchen display loading skeleton matching the order cards grid layout.
 */
export default function KitchenLoading() {
  return (
    <div className="min-h-screen bg-slate-900 p-4 animate-in fade-in duration-300">
      {/* Header */}
      <header className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-24 bg-slate-700" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-20 bg-slate-700 rounded-full" />
            <Skeleton className="h-5 w-28 bg-slate-700" />
          </div>
        </div>
        <Skeleton className="h-10 w-28 bg-slate-700 rounded-lg" />
      </header>

      {/* Order cards grid - iPad optimized layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-slate-800 rounded-xl p-4 space-y-4"
          >
            {/* Card header */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-7 w-24 bg-slate-700 rounded" />
              <Skeleton className="h-6 w-16 bg-slate-700 rounded-full" />
            </div>

            {/* Order items */}
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center gap-2">
                  <Skeleton className="h-5 w-6 bg-slate-700 rounded" />
                  <Skeleton className="h-5 flex-1 bg-slate-700 rounded" />
                </div>
              ))}
            </div>

            {/* Timer / meta */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-700">
              <Skeleton className="h-4 w-20 bg-slate-700" />
              <Skeleton className="h-4 w-16 bg-slate-700" />
            </div>

            {/* Action button */}
            <Skeleton className="h-11 w-full bg-slate-700 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
