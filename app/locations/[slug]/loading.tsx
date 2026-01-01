import { Skeleton } from "@/components/ui/skeleton";

export default function LocationDetailLoading() {
  return (
    <div className="animate-in fade-in duration-300 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Section title */}
        <Skeleton className="h-8 w-48 mb-6" />

        <div className="space-y-3">
          {/* Address */}
          <Skeleton className="h-4 w-72" />

          {/* Phone */}
          <Skeleton className="h-4 w-36" />

          {/* Hours section */}
          <div className="mt-6 space-y-3">
            <Skeleton className="h-5 w-16" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <Skeleton key={day} className="h-4 w-32" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
