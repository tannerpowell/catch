import { Skeleton } from "@/components/ui/skeleton";

export default function GiftCardsLoading() {
  return (
    <section className="section padding-large animate-in fade-in duration-300">
      <div className="max-w-3xl mx-auto text-center">
        {/* Title */}
        <Skeleton className="h-10 w-44 mx-auto mb-6" />

        {/* Paragraphs */}
        <div className="space-y-4 mb-8">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4 mx-auto" />
        </div>

        <div className="space-y-4 mb-8">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6 mx-auto" />
        </div>

        {/* Button */}
        <Skeleton className="h-12 w-40 mx-auto rounded-md" />
      </div>
    </section>
  );
}
