import { Skeleton } from "@/components/ui/skeleton";

/**
 * Checkout page loading skeleton matching the form + summary layout.
 */
export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-[var(--color--crema-fresca,#FDF8ED)] dark:bg-[#0f1720] py-20 px-6 animate-in fade-in duration-300">
      <div className="max-w-[900px] mx-auto">
        {/* Title */}
        <Skeleton className="h-10 w-36 mb-10" />

        <div className="grid md:grid-cols-2 gap-10">
          {/* Left: Form */}
          <div className="space-y-8">
            {/* Contact section */}
            <div>
              <Skeleton className="h-6 w-44 mb-4" />
              <div className="space-y-4">
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
                <div>
                  <Skeleton className="h-4 w-14 mb-2" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              </div>
            </div>

            {/* Order type section */}
            <div>
              <Skeleton className="h-6 w-28 mb-4" />
              <div className="flex gap-2 p-1.5 bg-black/5 dark:bg-white/5 rounded-xl">
                <Skeleton className="flex-1 h-12 rounded-lg" />
                <Skeleton className="flex-1 h-12 rounded-lg" />
              </div>
            </div>

            {/* Special instructions */}
            <div>
              <Skeleton className="h-4 w-48 mb-2" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>

            {/* Submit button */}
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>

          {/* Right: Order summary */}
          <div>
            <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-6 border border-black/5 dark:border-white/5">
              <Skeleton className="h-6 w-36 mb-5" />

              {/* Location */}
              <div className="p-4 bg-black/5 dark:bg-white/5 rounded-lg mb-5">
                <Skeleton className="h-3 w-24 mb-2" />
                <Skeleton className="h-5 w-40" />
              </div>

              {/* Items */}
              <div className="space-y-4 mb-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between pb-4 border-b border-black/5 dark:border-white/5">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="pt-4 border-t border-black/10 dark:border-white/10 space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-14" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="flex justify-between pt-3 mt-3 border-t border-black/10 dark:border-white/10">
                  <Skeleton className="h-6 w-14" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
