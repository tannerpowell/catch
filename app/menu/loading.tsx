import { Skeleton } from "@/components/ui/skeleton";

/**
 * Menu page loading skeleton matching the 3-pane layout.
 */
export default function MenuLoading() {
  return (
    <div className="min-h-screen bg-[var(--color--dark-slate-deepest,#0f1720)] animate-in fade-in duration-300">
      {/* Location selector bar */}
      <div className="border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
          <Skeleton className="h-10 w-64 bg-white/5 rounded-lg" />
        </div>
      </div>

      {/* 3-pane layout */}
      <div className="flex max-w-7xl mx-auto">
        {/* Categories sidebar - hidden on mobile */}
        <div className="w-48 p-4 space-y-2 hidden md:block border-r border-white/5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full bg-white/5 rounded" />
          ))}
        </div>

        {/* Menu items - center pane */}
        <div className="flex-1 p-4">
          {/* Category header */}
          <div className="mb-6">
            <Skeleton className="h-6 w-32 bg-white/5 mb-4" />
          </div>

          {/* Menu items grid */}
          <div className="grid grid-cols-1 gap-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3 px-2 border-b border-white/5"
              >
                <Skeleton className="h-5 w-48 bg-white/5" />
                <Skeleton className="h-5 w-16 bg-white/5" />
              </div>
            ))}
          </div>
        </div>

        {/* Preview pane - hidden on smaller screens */}
        <div className="w-80 p-6 hidden lg:block border-l border-white/5">
          <Skeleton className="aspect-square w-full bg-white/5 rounded-lg mb-4" />
          <Skeleton className="h-7 w-3/4 bg-white/5 mb-3" />
          <Skeleton className="h-4 w-full bg-white/5 mb-2" />
          <Skeleton className="h-4 w-full bg-white/5 mb-2" />
          <Skeleton className="h-4 w-2/3 bg-white/5 mb-6" />
          <Skeleton className="h-6 w-20 bg-white/5" />
        </div>
      </div>
    </div>
  );
}
