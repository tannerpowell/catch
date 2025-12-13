import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { validateSecret } from "@/lib/auth/validate-secret";

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");

  if (!validateSecret(secret, process.env.SANITY_WEBHOOK_SECRET)) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }

  // We only need to know a publish happened; paths are hard-coded for now
  revalidatePath("/menu");
  revalidatePath("/menu2");
  revalidatePath("/locations");

  return NextResponse.json({ revalidated: true, timestamp: Date.now() });
}
