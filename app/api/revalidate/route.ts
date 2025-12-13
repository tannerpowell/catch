import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { validateSecret } from "@/lib/auth/validate-secret";

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');

  if (!validateSecret(secret, process.env.REVALIDATION_SECRET)) {
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
