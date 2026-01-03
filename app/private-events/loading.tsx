import { Skeleton } from "@/components/ui/skeleton";

export default function PrivateEventsLoading() {
  return (
    <div className="animate-in fade-in duration-300">
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] bg-slate-900">
        <Skeleton className="absolute inset-0 bg-slate-800" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4 px-4">
            <Skeleton className="h-4 w-24 mx-auto bg-white/10" />
            <Skeleton className="h-12 w-80 mx-auto bg-white/10" />
            <Skeleton className="h-5 w-64 mx-auto bg-white/10" />
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-16 px-4 bg-(--color--crema-fresca)">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48 mx-auto" />
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
            <Skeleton className="h-32 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
        </div>
      </section>

      {/* Info Cards */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center space-y-4 p-6">
                <Skeleton className="h-12 w-12 mx-auto rounded-full" />
                <Skeleton className="h-6 w-32 mx-auto" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6 mx-auto" />
                  <Skeleton className="h-4 w-4/5 mx-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
