import { Skeleton } from "@/components/ui/skeleton";

export default function FeaturesLoading() {
  return (
    <div className="features-page animate-in fade-in duration-300">
      {/* Hero Section */}
      <section className="py-20 px-4 bg-[var(--color--crema-fresca)]">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <Skeleton className="h-4 w-24 mx-auto" />
          <div className="space-y-2">
            <Skeleton className="h-12 w-64 mx-auto" />
            <Skeleton className="h-12 w-80 mx-auto" />
            <Skeleton className="h-12 w-48 mx-auto" />
          </div>
          <Skeleton className="h-5 w-96 mx-auto" />
          <div className="flex gap-4 justify-center pt-4">
            <Skeleton className="h-12 w-48 rounded-md" />
            <Skeleton className="h-12 w-40 rounded-md" />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-8 rounded-xl border border-gray-100 space-y-4"
            >
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-7 w-4/5" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* For Managers Section */}
      <section className="py-16 px-4 bg-slate-900">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <Skeleton className="h-4 w-40 bg-white/10" />
            <div className="space-y-2">
              <Skeleton className="h-10 w-64 bg-white/10" />
              <Skeleton className="h-10 w-48 bg-white/10" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full bg-white/10" />
              <Skeleton className="h-4 w-11/12 bg-white/10" />
              <Skeleton className="h-4 w-4/5 bg-white/10" />
            </div>
            <div className="flex gap-4 pt-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-6 w-32 bg-white/10 rounded-full" />
              ))}
            </div>
          </div>
          <div className="flex justify-center">
            <Skeleton className="h-64 w-80 rounded-xl bg-white/10" />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-[var(--color--crema-fresca)]">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <Skeleton className="h-10 w-72 mx-auto" />
          <Skeleton className="h-5 w-96 mx-auto" />
          <Skeleton className="h-14 w-56 mx-auto rounded-md" />
        </div>
      </section>
    </div>
  );
}
