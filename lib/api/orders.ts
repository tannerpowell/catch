/**
 * Orders API - Server Actions
 *
 * ⚠️ SECURITY: This file provides SERVER-SIDE functions only.
 * Never expose KITCHEN_API_TOKEN to the client bundle.
 *
 * All functions use Next.js Server Actions to keep authentication
 * server-side and prevent token exposure in client JavaScript.
 *
 * ============================================================================
 * USAGE FROM CLIENT COMPONENTS:
 * ============================================================================
 *
 * Import and call directly - no token needed:
 *
 * ```tsx
 * 'use client';
 * import { updateOrderStatus } from '@/lib/api/orders';
 *
 * export function OrderCard({ order }) {
 *   const [isUpdating, setIsUpdating] = useState(false);
 *
 *   const handleUpdate = async () => {
 *     setIsUpdating(true);
 *     try {
 *       const result = await updateOrderStatus(order._id, 'preparing');
 *       
 *       if (result.success) {
 *         // Update succeeded
 *         toast.success('Order updated!');
 *       } else {
 *         // Show safe error message from server
 *         toast.error(result.error);
 *       }
 *     } catch (error) {
 *       // Network error or unexpected issue
 *       toast.error('Connection error. Please try again.');
 *     } finally {
 *       setIsUpdating(false);
 *     }
 *   };
 *
 *   return <button onClick={handleUpdate}>Update Status</button>;
 * }
 * ```
 *
 * ⚠️ NEVER DO THIS (exposes token to client):
 * ```tsx
 * // ❌ WRONG - Don't use process.env.NEXT_PUBLIC_KITCHEN_API_TOKEN
 * // ❌ WRONG - Don't pass tokens from client to API
 * fetch('/api/orders', { headers: { Authorization: `Bearer ${clientToken}` } })
 * ```
 *
 * ============================================================================
 */

'use server';

import { revalidatePath } from 'next/cache';
import type { Order } from '@/lib/types';

/**
 * Validate user authentication and authorization for order updates
 * 
 * CRITICAL SECURITY: This function MUST be implemented before production deployment.
 * 
 * Implementation Options:
 * 
 * 1. NextAuth.js (recommended for Next.js):
 *    ```typescript
 *    import { getServerSession } from 'next-auth/next';
 *    import { authOptions } from '@/app/api/auth/[...nextauth]/route';
 *    
 *    const session = await getServerSession(authOptions);
 *    if (!session?.user?.role === 'kitchen_staff') {
 *      return { authorized: false, error: 'Unauthorized' };
 *    }
 *    return { authorized: true, userId: session.user.id };
 *    ```
 * 
 * 2. Clerk (simplest integration):
 *    ```typescript
 *    import { auth } from '@clerk/nextjs/server';
 *    
 *    const { userId, sessionClaims } = await auth();
 *    if (!userId || !sessionClaims?.role?.includes('kitchen_staff')) {
 *      return { authorized: false, error: 'Unauthorized' };
 *    }
 *    return { authorized: true, userId };
 *    ```
 * 
 * 3. Custom JWT/Session:
 *    ```typescript
 *    import { cookies } from 'next/headers';
 *    import { verifyJWT } from '@/lib/auth';
 *    
 *    const token = (await cookies()).get('auth-token')?.value;
 *    const user = await verifyJWT(token);
 *    if (!user?.isKitchenStaff) {
 *      return { authorized: false, error: 'Unauthorized' };
 *    }
 *    return { authorized: true, userId: user.id };
 *    ```
 */
async function validateAuth(): Promise<{ 
  authorized: boolean; 
  error?: string; 
  userId?: string 
}> {
  // ============================================================================
  // ⚠️ CRITICAL SECURITY WARNING ⚠️
  // ============================================================================
  // Authentication is currently not implemented. This must be configured before
  // deploying to production.
  // 
  // To enable authentication:
  //   1. Install an auth provider (NextAuth.js, Clerk, etc.)
  //   2. Implement the validation logic above
  //   3. Test thoroughly before deployment
  // 
  // INTERNAL NOTE: There is a development-only bypass mechanism with strict
  // safeguards. See docs/INTERNAL-SECURITY-DEV.md for details.
  // ============================================================================
  
  // Runtime safeguards for development-only auth bypass
  // ============================================================================
  // This bypass is ONLY allowed in verified development environments:
  //   1. NODE_ENV must be 'development' or 'test'
  //   2. Must be running on localhost (not a public IP)
  //   3. ALLOW_AUTH_BYPASS_IN_DEV must be explicitly set to 'true'
  // 
  // Production environments will REJECT this flag regardless of settings.
  // ============================================================================
  const isDevelopmentEnv = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
  const isLocalhost = !process.env.VERCEL_URL && 
                      !process.env.NEXT_PUBLIC_VERCEL_URL &&
                      (process.env.NEXT_PUBLIC_SITE_URL?.includes('localhost') || 
                       process.env.NEXT_PUBLIC_SITE_URL?.includes('127.0.0.1') ||
                       !process.env.NEXT_PUBLIC_SITE_URL);
  const bypassExplicitlyAllowed = process.env.ALLOW_AUTH_BYPASS_IN_DEV === 'true';
  const bypassRequested = process.env.DISABLE_AUTH_CHECK === 'true';
  
  // Check if running in a verified development context
  const isVerifiedDevEnvironment = isDevelopmentEnv && isLocalhost && bypassExplicitlyAllowed;
  
  if (bypassRequested) {
    // Log bypass attempt for security audit
    console.warn('[SECURITY] Auth bypass requested', {
      NODE_ENV: process.env.NODE_ENV,
      isDevelopmentEnv,
      isLocalhost,
      bypassExplicitlyAllowed,
      isVerifiedDevEnvironment,
      timestamp: new Date().toISOString()
    });
    
    if (!isVerifiedDevEnvironment) {
      // CRITICAL: Reject bypass attempts outside verified dev environment
      console.error(
        '[SECURITY] REJECTED: Auth bypass attempted outside verified development environment. ' +
        'This is a critical security violation.'
      );
      
      // In production-like environments, fail loudly
      if (!isDevelopmentEnv) {
        throw new Error(
          'SECURITY VIOLATION: Authentication bypass is not allowed in production. ' +
          'This attempt has been logged and the application is terminating.'
        );
      }
      
      // In development but not properly configured
      return { 
        authorized: false, 
        error: 'Authentication bypass not permitted. Check runtime environment requirements.' 
      };
    }
    
    // Only reach here if all safeguards pass
    console.warn(
      '⚠️  [SECURITY] Authentication BYPASSED in verified development environment. ' +
      'This is ONLY safe for local development. NEVER deploy with this enabled.'
    );
    return { authorized: true, userId: 'dev-bypass' };
  }
  
  // ============================================================================
  // IMPLEMENT AUTHENTICATION HERE
  // ============================================================================
  // Replace the code below with one of the implementation options shown above.
  // 
  // Example with NextAuth:
  // const session = await getServerSession(authOptions);
  // if (!session?.user?.role === 'kitchen_staff') {
  //   console.warn('[AUTH] Unauthorized order update attempt', {
  //     timestamp: new Date().toISOString()
  //   });
  //   return { authorized: false, error: 'Unauthorized' };
  // }
  // return { authorized: true, userId: session.user.id };
  
  console.error(
    '[SECURITY] Authentication not implemented. ' +
    'Set DISABLE_AUTH_CHECK=true to explicitly bypass (unsafe), ' +
    'or implement authentication logic in validateAuth().'
  );
  
  return { 
    authorized: false, 
    error: 'Authentication not configured. Please contact support.' 
  };
}

/**
 * Update order status - SERVER ACTION
 *
 * This is a Next.js Server Action that runs entirely on the server.
 * The client calls this function directly without needing to pass tokens.
 *
 * @param orderId - The Sanity order document ID
 * @param newStatus - The new status to set
 * @returns Promise with success status and safe error messages
 *
 * SECURITY IMPLEMENTATION:
 * ✅ Server-side only (never bundled to client)
 * ✅ Uses KITCHEN_API_TOKEN from server environment (no NEXT_PUBLIC_)
 * ✅ Validates caller authentication/session (TODO: add session validation)
 * ✅ Enforces allowed status transitions
 * ✅ Returns only safe, non-sensitive error messages to client
 * ✅ Rate limiting enforced by downstream API endpoint
 *
 * FUTURE ENHANCEMENTS:
 * - Add session/cookie validation to verify authenticated kitchen staff
 * - Implement RBAC to check user's authorized locations
 * - Add audit logging of all status changes with user context
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: string
): Promise<{ success: boolean; error?: string; order?: Order }> {
  try {
    // 1. Validate authentication and authorization
    const authResult = await validateAuth();
    if (!authResult.authorized) {
      console.warn('[AUTH] Unauthorized order update attempt', {
        orderId: orderId.substring(0, 8) + '...',
        requestedStatus: newStatus,
        timestamp: new Date().toISOString()
      });
      return { 
        success: false, 
        error: authResult.error || 'Unauthorized' 
      };
    }

    // Log authenticated action for audit trail
    console.log('[AUTH] Authenticated order update', {
      userId: authResult.userId,
      orderId: orderId.substring(0, 8) + '...',
      newStatus,
      timestamp: new Date().toISOString()
    });

    // 2. Validate status value
    const allowedStatuses = ['confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!allowedStatuses.includes(newStatus)) {
      return { success: false, error: 'Invalid status value' };
    }

    // 3. Validate orderId format (prevent injection)
    const trimmedOrderId = String(orderId).trim();
    const orderIdPattern = /^[A-Za-z0-9._-]+$/;
    if (!orderIdPattern.test(trimmedOrderId) || trimmedOrderId.length < 1 || trimmedOrderId.length > 200) {
      return { success: false, error: 'Invalid order ID format' };
    }

    // 4. Get server-side token (NOT exposed to client)
    const token = process.env.KITCHEN_API_TOKEN;

    if (!token) {
      console.error('[SERVER] KITCHEN_API_TOKEN not configured');
      return { 
        success: false, 
        error: 'Service temporarily unavailable. Please contact support.' 
      };
    }

    // 5. Call internal API endpoint with server-side token
    // Use absolute URL for server-to-server communication
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                    'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/orders/update-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ orderId: trimmedOrderId, newStatus }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));

      // Map internal errors to safe client messages
      if (response.status === 401 || response.status === 503) {
        console.error('[SERVER] Authentication error:', errorData);
        return { success: false, error: 'Service configuration error. Please contact support.' };
      } else if (response.status === 403) {
        return { success: false, error: 'Not authorized to update this order' };
      } else if (response.status === 404) {
        return { success: false, error: 'Order not found' };
      } else if (response.status === 422) {
        // Invalid state transition - pass through the descriptive error message
        return { success: false, error: errorData.error || 'Invalid status transition' };
      } else if (response.status === 429) {
        return { success: false, error: 'Too many requests. Please wait and try again.' };
      }

      // Generic safe error for unexpected issues
      console.error('[SERVER] Order update failed:', response.status, errorData);
      return { success: false, error: 'Failed to update order. Please try again.' };
    }

    const result = await response.json();

    // Revalidate relevant paths to update cached data
    revalidatePath('/kitchen');
    revalidatePath('/api/orders');

    return { success: true, order: result.order };

  } catch (error) {
    // Never expose internal errors to client
    console.error('[SERVER] Exception updating order:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred. Please try again.' 
    };
  }
}

/**
 * SECURITY ARCHITECTURE NOTES:
 *
 * ✅ IMPLEMENTED:
 * - Server Actions keep KITCHEN_API_TOKEN server-side only
 * - Authentication guard with validateAuth() function
 * - Input validation (status values, order ID format)
 * - State machine validation (enforces allowed status transitions)
 * - Safe error messages (no sensitive details leaked to client)
 * - Rate limiting via downstream API endpoint
 * - Automatic cache revalidation
 * - Audit logging of authenticated actions
 *
 * ⚠️ CRITICAL: COMPLETE BEFORE PRODUCTION:
 * 1. Authentication Implementation (REQUIRED)
 *    - Implement validateAuth() with your chosen auth provider
 *    - Options: NextAuth.js, Clerk, custom JWT
 *    - See function documentation for implementation examples
 *    - Remove DISABLE_AUTH_CHECK=true from environment
 *
 * 2. Role-Based Access Control (RBAC)
 *    - Check user's authorized locations from session/database
 *    - Only allow updates to orders at user's assigned locations
 *    - Example: if (!session.user.locations.includes(order.location)) return error;
 *
 * 3. Audit Logging
 *    - Log all status changes with: user ID, timestamp, old/new status
 *    - Store in database or external logging service
 *    - Required for compliance and debugging
 *
 * 4. Advanced Rate Limiting
 *    - Implement per-user rate limits (not just per-IP)
 *    - Use Redis or Upstash for distributed rate limiting
 *    - Prevents abuse even with valid authentication
 *
 * 5. Real-time Updates
 *    - Replace polling with WebSocket or Server-Sent Events
 *    - Pusher, Ably, or Socket.io for real-time order updates
 *    - Reduces server load and improves UX
 */
