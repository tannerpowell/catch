import { Skeleton } from "@/components/ui/skeleton";

export default function OurStoryLoading() {
  return (
    <section className="section padding-large animate-in fade-in duration-300">
      <div className="max-w-3xl mx-auto text-center">
        {/* Title */}
        <Skeleton className="h-10 w-48 mx-auto mb-6" />

        {/* Paragraphs */}
        <div className="space-y-4 mb-8">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-11/12 mx-auto" />
          <Skeleton className="h-5 w-4/5 mx-auto" />
        </div>

        <div className="space-y-4 mb-8">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-10/12 mx-auto" />
          <Skeleton className="h-5 w-3/4 mx-auto" />
        </div>

        {/* Button */}
        <Skeleton className="h-12 w-40 mx-auto rounded-md" />
      </div>
    </section>
  );
}
