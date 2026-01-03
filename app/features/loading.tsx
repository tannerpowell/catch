import { Skeleton } from "@/components/ui/skeleton";

export default function FeaturesLoading() {
  return (
    <div className="features-page animate-in fade-in duration-300">
      {/* Hero Section */}
      <section className="py-20 px-4 min-h-[55vh] flex items-center justify-center">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-12 w-full max-w-lg mx-auto" />
            <Skeleton className="h-12 w-4/5 max-w-md mx-auto" />
          </div>
          <Skeleton className="h-5 w-96 max-w-full mx-auto" />
          <div className="flex gap-6 justify-center pt-4 flex-wrap border-t border-gray-200 mt-8 pt-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-5 w-40" />
            ))}
          </div>
        </div>
      </section>

      {/* Feature Sections (7 sections with alternating layouts) */}
      {[1, 2, 3, 4, 5, 6, 7].map((i) => {
        const isDark = i === 2 || i === 5;
        const isReversed = i % 2 === 0;
        return (
          <section
            key={i}
            className={`py-16 px-4 ${isDark ? "bg-slate-900" : ""}`}
          >
            <div
              className={`max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center`}
            >
              <div
                className={`space-y-4 ${isReversed ? "lg:order-2" : ""}`}
              >
                <Skeleton
                  className={`h-10 w-4/5 ${isDark ? "bg-white/10" : ""}`}
                />
                <div className="space-y-2">
                  <Skeleton
                    className={`h-4 w-full ${isDark ? "bg-white/10" : ""}`}
                  />
                  <Skeleton
                    className={`h-4 w-11/12 ${isDark ? "bg-white/10" : ""}`}
                  />
                </div>
                <div className="space-y-2 pt-2">
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton
                      key={j}
                      className={`h-4 w-3/4 ${isDark ? "bg-white/10" : ""}`}
                    />
                  ))}
                </div>
              </div>
              <div className={isReversed ? "lg:order-1" : ""}>
                <Skeleton
                  className={`aspect-video w-full max-w-md mx-auto rounded-lg ${
                    isDark ? "bg-white/10" : ""
                  }`}
                />
              </div>
            </div>
          </section>
        );
      })}

      {/* Closing Summary */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-11/12 mx-auto" />
          <Skeleton className="h-5 w-4/5 mx-auto" />
        </div>
      </section>
    </div>
  );
}
