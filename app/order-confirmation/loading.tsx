import { Skeleton } from "@/components/ui/skeleton";

export default function OrderConfirmationLoading() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-10 animate-in fade-in duration-300"
      style={{ background: "var(--color--crema-fresca, #FDF8ED)" }}
    >
      <div className="text-center max-w-lg space-y-6">
        {/* Check icon */}
        <Skeleton className="h-16 w-16 rounded-full mx-auto" />

        {/* Title */}
        <Skeleton className="h-10 w-56 mx-auto" />

        {/* Order number */}
        <Skeleton className="h-5 w-48 mx-auto" />

        {/* Track link */}
        <Skeleton className="h-10 w-44 mx-auto rounded-lg" />

        {/* Subtitle */}
        <Skeleton className="h-4 w-80 mx-auto" />

        {/* Demo notice card */}
        <div className="rounded-xl p-5 space-y-3" style={{ background: "rgba(50, 39, 35, 0.04)" }}>
          <Skeleton className="h-3 w-24 mx-auto" />
          <Skeleton className="h-4 w-72 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>

        {/* Action buttons */}
        <div className="flex gap-4 justify-center pt-2">
          <Skeleton className="h-12 w-32 rounded-lg" />
          <Skeleton className="h-12 w-48 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
