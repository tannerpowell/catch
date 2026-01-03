import { Skeleton } from "@/components/ui/skeleton";

/**
 * Homepage loading skeleton matching the luxury hero + signature dishes layout.
 */
export default function HomeLoading() {
  return (
    <div className="animate-in fade-in duration-300">
      {/* Hero skeleton - full viewport */}
      <section className="relative h-screen bg-slate-900">
        <Skeleton className="absolute inset-0 bg-slate-800" />

        {/* Hero content skeleton */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <Skeleton className="h-4 w-32 mb-6 bg-white/10" />
          <Skeleton className="h-16 w-64 mb-2 bg-white/10" />
          <Skeleton className="h-16 w-48 mb-6 bg-white/10" />
          <Skeleton className="h-5 w-80 mb-8 bg-white/10" />
          <div className="flex gap-4">
            <Skeleton className="h-12 w-32 rounded-lg bg-white/10" />
            <Skeleton className="h-12 w-36 rounded-lg bg-white/10" />
          </div>
        </div>
      </section>

      {/* Signature dishes skeleton */}
      <section className="py-20 px-6 bg-[#FDF8ED]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Skeleton className="h-4 w-28 mx-auto mb-4" />
            <Skeleton className="h-10 w-64 mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`${i === 1 ? 'md:col-span-2 lg:col-span-1' : ''}`}>
                <Skeleton className="aspect-4/3 w-full rounded-lg mb-4" />
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story section skeleton */}
      <section className="grid md:grid-cols-2 min-h-[60vh]">
        <Skeleton className="aspect-square md:aspect-auto" />
        <div className="p-12 flex flex-col justify-center bg-[#FDF8ED]">
          <Skeleton className="h-4 w-24 mb-4" />
          <Skeleton className="h-12 w-48 mb-2" />
          <Skeleton className="h-12 w-32 mb-6" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-6" />
          <Skeleton className="h-5 w-36" />
        </div>
      </section>

      {/* Locations ribbon skeleton */}
      <section className="py-16 bg-slate-900">
        <div className="text-center">
          <Skeleton className="h-12 w-48 mx-auto mb-2 bg-white/10" />
          <Skeleton className="h-5 w-56 mx-auto mb-6 bg-white/10" />
          <Skeleton className="h-12 w-40 mx-auto rounded-lg bg-white/10" />
        </div>
      </section>
    </div>
  );
}
