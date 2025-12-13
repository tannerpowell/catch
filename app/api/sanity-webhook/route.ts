import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");

  // Timing-safe secret comparison to prevent timing attacks
  const providedSecret = secret || "";
  const expectedSecret = process.env.SANITY_WEBHOOK_SECRET || "";

  try {
    const bufProvided = Buffer.from(providedSecret);
    const bufExpected = Buffer.from(expectedSecret);

    // Pad to same length for constant-time comparison
    const bufferLength = Math.max(bufProvided.length, bufExpected.length);
    const paddedProvided = Buffer.alloc(bufferLength);
    const paddedExpected = Buffer.alloc(bufferLength);
    bufProvided.copy(paddedProvided);
    bufExpected.copy(paddedExpected);

    if (!timingSafeEqual(paddedProvided, paddedExpected)) {
      return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }

  // We only need to know a publish happened; paths are hard-coded for now
  revalidatePath("/menu");
  revalidatePath("/menu2");
  revalidatePath("/locations");

  return NextResponse.json({ revalidated: true, timestamp: Date.now() });
}
