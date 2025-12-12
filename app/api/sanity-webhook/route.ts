import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const secret = new URL(request.url).searchParams.get("secret");

  if (!secret || secret !== process.env.SANITY_WEBHOOK_SECRET) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }

  // We only need to know a publish happened; paths are hard-coded for now
  revalidatePath("/menu");
  revalidatePath("/menu2");
  revalidatePath("/locations");

  return NextResponse.json({ revalidated: true, timestamp: Date.now() });
}
