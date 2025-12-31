import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { validateSecret } from "@/lib/auth/validate-secret";
import { CACHE_TAGS } from "@/lib/adapters/sanity-catch";

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");

  if (!validateSecret(secret, process.env.SANITY_WEBHOOK_SECRET)) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }

  // Invalidate all Sanity data caches (categories, locations, items)
  // expire: 0 forces immediate revalidation
  revalidateTag(CACHE_TAGS.all, { expire: 0 });

  // Revalidate all ISR pages that depend on Sanity content
  revalidatePath("/");
  revalidatePath("/menu");
  revalidatePath("/menu2");
  revalidatePath("/menu3");
  revalidatePath("/locations");
  revalidatePath("/tv-menu-display");
  revalidatePath("/print-menu");

  return NextResponse.json({
    revalidated: true,
    tags: [CACHE_TAGS.all],
    paths: ["/", "/menu", "/menu2", "/menu3", "/locations", "/tv-menu-display", "/print-menu"],
    timestamp: Date.now(),
  });
}
