import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Check if Clerk is configured
const isClerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

// Routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/account(.*)',
  '/api/orders/history(.*)',
  '/api/notifications/preferences(.*)',
  '/api/reorder(.*)',
]);

// Fallback middleware when Clerk is not configured
function fallbackMiddleware(request: NextRequest) {
  // Redirect protected routes to home when auth is not configured
  const url = request.nextUrl.clone();
  if (isProtectedRoute(request)) {
    url.pathname = '/';
    url.searchParams.set('auth_required', 'true');
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

// Clerk middleware when configured
const clerkHandler = clerkMiddleware(async (auth, req) => {
  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

// Export the appropriate middleware based on configuration
export default isClerkConfigured ? clerkHandler : fallbackMiddleware;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
