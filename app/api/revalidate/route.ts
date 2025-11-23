import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');

  // Timing-safe secret comparison to prevent timing attacks
  const providedSecret = secret || '';
  const expectedSecret = process.env.REVALIDATION_SECRET || '';

  // Create buffers for comparison
  let bufProvided: Buffer;
  let bufExpected: Buffer;

  try {
    bufProvided = Buffer.from(providedSecret);
    bufExpected = Buffer.from(expectedSecret);

    // Ensure both buffers are the same length
    // Use a constant-length comparison even if lengths differ
    const bufferLength = Math.max(bufProvided.length, bufExpected.length);

    // Create same-length buffers for comparison
    const paddedProvided = Buffer.alloc(bufferLength);
    const paddedExpected = Buffer.alloc(bufferLength);

    bufProvided.copy(paddedProvided);
    bufExpected.copy(paddedExpected);

    // Perform timing-safe comparison
    const isValid = timingSafeEqual(paddedProvided, paddedExpected);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }
  } catch (error) {
    // If timingSafeEqual throws (lengths don't match after padding, etc.)
    // return 401 without revealing the error
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { path } = body;

    // Revalidate specific path
    if (path) {
      revalidatePath(path);
      return NextResponse.json({
        revalidated: true,
        path,
        timestamp: Date.now()
      });
    }

    // Default: revalidate all menu and location pages
    revalidatePath('/menu');
    revalidatePath('/menu2');
    revalidatePath('/locations');

    return NextResponse.json({
      revalidated: true,
      paths: ['/menu', '/menu2', '/locations'],
      timestamp: Date.now()
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Error revalidating',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
