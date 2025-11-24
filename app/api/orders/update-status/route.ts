import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@sanity/client';

// Validate required Sanity environment variables
const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const SANITY_WRITE_TOKEN = process.env.SANITY_WRITE_TOKEN;

if (!SANITY_PROJECT_ID || SANITY_PROJECT_ID.trim() === '') {
  throw new Error(
    'NEXT_PUBLIC_SANITY_PROJECT_ID environment variable is required but not set. ' +
    'Configure it in your .env.local file or hosting provider settings.'
  );
}

if (!SANITY_WRITE_TOKEN || SANITY_WRITE_TOKEN.trim() === '') {
  throw new Error(
    'SANITY_WRITE_TOKEN environment variable is required but not set. ' +
    'This token is needed to update orders. Get it from https://sanity.io/manage'
  );
}

const sanityClient = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  useCdn: false,
  apiVersion: '2024-01-01',
  token: SANITY_WRITE_TOKEN,
});

// Simple in-memory rate limiting (per IP)
// ⚠️ NON-PRODUCTION IMPLEMENTATION ⚠️
// This in-memory rate limiter is suitable for development and single-instance deployments only.
// Limitations:
//   - Does not work across multiple server instances (each instance has its own memory)
//   - Not suitable for load-balanced or serverless environments
//   - Limited by server memory
// 
// For production, use a distributed rate-limiting solution such as:
//   - Redis with libraries like `rate-limiter-flexible` or `ioredis`
//   - Upstash Rate Limit (https://upstash.com/docs/redis/features/ratelimiting)
//   - Vercel Edge Config with rate limiting
//   - CloudFlare Rate Limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute

// Cleanup expired rate limit entries to prevent memory leaks
// ==================================================================================
// IMPLEMENTATION NOTE: On-demand cleanup vs. Periodic cleanup
// 
// For serverless/edge environments (Vercel, AWS Lambda, CloudFlare Workers):
//   - On-demand cleanup during rate limit checks is preferred (current implementation)
//   - Avoids duplicate timers across cold starts and hot reloads
//   - More memory-efficient as cleanup happens only when needed
//
// For long-running server environments (traditional Node.js servers):
//   - Uncomment the periodic cleanup timer below
//   - Provides automatic background cleanup every 30 seconds
//   - Better for high-traffic scenarios with many unique IPs
//
// For production at scale, replace this in-memory solution with:
//   - Redis with built-in TTL (recommended)
//   - Upstash Rate Limit (https://upstash.com/docs/redis/features/ratelimiting)
//   - Vercel KV or Edge Config
// ==================================================================================

// Module-level guard to prevent duplicate interval timers across hot reloads/cold starts
let cleanupIntervalId: NodeJS.Timeout | null = null;

// Periodic cleanup (disabled by default for serverless - see note above)
// Uncomment for traditional server deployments:
// const CLEANUP_INTERVAL_MS = RATE_LIMIT_WINDOW_MS / 2; // Run cleanup every 30 seconds
// if (typeof setInterval !== 'undefined' && cleanupIntervalId === null) {
//   cleanupIntervalId = setInterval(() => {
//     const now = Date.now();
//     let removedCount = 0;
//     
//     for (const [ip, record] of rateLimitMap.entries()) {
//       if (now > record.resetAt) {
//         rateLimitMap.delete(ip);
//         removedCount++;
//       }
//     }
//     
//     if (removedCount > 0) {
//       console.log(`[RATE_LIMIT] Cleanup: removed ${removedCount} expired entries. Current size: ${rateLimitMap.size}`);
//     }
//   }, CLEANUP_INTERVAL_MS);
// }

/**
 * On-demand cleanup: Remove expired entries opportunistically during rate limit checks
 * This approach is more suitable for serverless environments where:
 *   - Function instances may be short-lived
 *   - Background timers can cause issues with hot reloads
 *   - Memory pressure requires efficient cleanup
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  const CLEANUP_THRESHOLD = 100; // Only run cleanup if map has at least this many entries
  
  // Skip cleanup if map is small (optimization)
  if (rateLimitMap.size < CLEANUP_THRESHOLD) {
    return;
  }
  
  let removedCount = 0;
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(ip);
      removedCount++;
    }
  }
  
  if (removedCount > 0) {
    console.log(`[RATE_LIMIT] On-demand cleanup: removed ${removedCount} expired entries. Current size: ${rateLimitMap.size}`);
  }
}

function checkRateLimit(ip: string): boolean {
  // Perform on-demand cleanup periodically (every ~10 checks when map is large)
  if (rateLimitMap.size >= 100 && Math.random() < 0.1) {
    cleanupExpiredEntries();
  }
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  // Clean up expired record before processing
  if (record && now > record.resetAt) {
    rateLimitMap.delete(ip);
    // Fall through to create new record
  }

  // No record or expired - create new entry
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication - REQUIRED: Check for API key
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.KITCHEN_API_TOKEN;

    // SECURITY: Always require authentication - fail if KITCHEN_API_TOKEN not configured
    if (!expectedToken) {
      console.error('[SECURITY] KITCHEN_API_TOKEN not configured - endpoint is disabled');
      return NextResponse.json(
        { error: 'Service temporarily unavailable - authentication not configured' },
        { status: 503 }
      );
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    if (token !== expectedToken) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // 2. Rate limiting - Get client IP with security considerations
    // ==================================================================================
    // SECURITY: IP address extraction for rate limiting
    // 
    // ⚠️ IMPORTANT: Proxy/Deployment Configuration Required
    // This endpoint requires a trusted reverse proxy (e.g., Vercel, CloudFlare, nginx)
    // to set verified client IP headers. Configure your deployment to:
    //   - Vercel: Automatically sets x-forwarded-for and x-real-ip (trusted)
    //   - CloudFlare: Use CF-Connecting-IP header (most reliable)
    //   - nginx: Configure proxy_set_header X-Real-IP $remote_addr;
    //   - AWS ALB: Use X-Forwarded-For (first IP is client)
    //
    // Security Considerations:
    //   1. x-forwarded-for can be spoofed by clients - only trust when set by YOUR proxy
    //   2. Never use a shared 'unknown' bucket - attackers could DoS all unidentified users
    //   3. In production, reject requests without verifiable IP to prevent rate limit bypass
    //
    // For production hardening:
    //   - Set REQUIRE_VERIFIED_IP=true to reject requests without trusted IP headers
    //   - Use TRUSTED_PROXY_SECRET to validate requests come from your infrastructure
    //   - Consider adding CF-Connecting-IP or True-Client-IP for CloudFlare
    // ==================================================================================
    
    const xForwardedFor = request.headers.get('x-forwarded-for');
    const xRealIp = request.headers.get('x-real-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip'); // CloudFlare
    
    // Prefer CloudFlare's CF-Connecting-IP (most reliable), then x-real-ip, then x-forwarded-for
    let clientIp: string | null = null;
    
    if (cfConnectingIp) {
      // CloudFlare sets this to the actual client IP
      clientIp = cfConnectingIp.trim();
    } else if (xRealIp) {
      // x-real-ip is set by nginx and similar proxies
      clientIp = xRealIp.trim();
    } else if (xForwardedFor) {
      // x-forwarded-for contains chain: "client, proxy1, proxy2"
      // Take the first IP (leftmost) as the client
      clientIp = xForwardedFor.split(',')[0].trim();
    }

    // Validate IP address format to prevent injection/spoofing
    const isValidIp = (ip: string): boolean => {
      // Simple IPv4 and IPv6 validation
      const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
      const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
      return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
    };

    if (!clientIp || !isValidIp(clientIp)) {
      // No valid IP found - determine action based on environment
      const requireVerifiedIp = process.env.REQUIRE_VERIFIED_IP === 'true';
      
      if (requireVerifiedIp) {
        // Production mode: reject requests without verifiable IP
        console.error('[RATE_LIMIT] Request rejected - No verifiable client IP', {
          xForwardedFor,
          xRealIp,
          cfConnectingIp,
          timestamp: new Date().toISOString()
        });
        return NextResponse.json(
          { 
            error: 'Bad request - Client identification required. ' +
                   'Ensure your request is routed through the proper proxy infrastructure.'
          },
          { status: 400 }
        );
      } else {
        // Development/test mode: Use token hash as rate limit key to avoid shared bucket
        // This ensures each authenticated user gets their own rate limit bucket
        const crypto = await import('crypto');
        clientIp = `token-${crypto.createHash('sha256').update(token).digest('hex').substring(0, 16)}`;
        
        console.warn('[RATE_LIMIT] No verifiable IP - using token hash for rate limiting', {
          rateLimitKey: clientIp,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Apply rate limiting with the verified client identifier
    if (!checkRateLimit(clientIp)) {
      console.warn('[RATE_LIMIT] Rate limit exceeded', {
        clientIp: clientIp.startsWith('token-') ? clientIp : clientIp.substring(0, 8) + '...',
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { error: 'Too many requests - Please try again later' },
        { status: 429 }
      );
    }

    // 3. Parse and validate request body
    const { orderId, newStatus } = await request.json();

    if (!orderId || !newStatus) {
      return NextResponse.json(
        { error: 'Missing orderId or newStatus' },
        { status: 400 }
      );
    }

    // Validate orderId format
    const trimmedOrderId = String(orderId).trim();

    // Sanity document IDs can contain letters, numbers, dots, hyphens, and underscores
    // Enforce reasonable length limits to prevent abuse
    const orderIdPattern = /^[A-Za-z0-9._-]+$/;
    if (!orderIdPattern.test(trimmedOrderId) || trimmedOrderId.length < 1 || trimmedOrderId.length > 200) {
      return NextResponse.json(
        { error: 'Invalid orderId format' },
        { status: 400 }
      );
    }

    // Validate status value
    const validStatuses = ['confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // 4. Verify order exists in Sanity and get current status
    const existingOrder = await sanityClient.fetch(
      `*[_type == "order" && _id == $orderId][0]{ _id, status, location }`,
      { orderId: trimmedOrderId }
    );

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // 5. Validate state machine transitions
    // ==================================================================================
    // Order Status State Machine:
    //   - confirmed  → [preparing, cancelled]
    //   - preparing  → [ready, cancelled]
    //   - ready      → [completed]
    //   - completed  → [] (terminal state)
    //   - cancelled  → [] (terminal state)
    //
    // This prevents invalid transitions like:
    //   - Moving backwards (ready → preparing)
    //   - Skipping states (confirmed → completed)
    //   - Changing terminal states (completed → preparing)
    // ==================================================================================
    
    type OrderStatus = 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
    
    const stateTransitions: Record<OrderStatus, OrderStatus[]> = {
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['completed'],
      completed: [], // Terminal state - no transitions allowed
      cancelled: [], // Terminal state - no transitions allowed
    };

    const currentStatus = existingOrder.status as OrderStatus;
    const allowedNextStates = stateTransitions[currentStatus];

    if (!allowedNextStates || !allowedNextStates.includes(newStatus as OrderStatus)) {
      const allowedStatesText = allowedNextStates && allowedNextStates.length > 0
        ? allowedNextStates.map(s => `'${s}'`).join(' or ')
        : 'none (terminal state)';
      
      console.warn('[STATE_MACHINE] Invalid transition attempted', {
        orderId: trimmedOrderId,
        currentStatus,
        attemptedStatus: newStatus,
        allowedStates: allowedNextStates,
        clientIp,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json(
        { 
          error: `Cannot transition from '${currentStatus}' to '${newStatus}'. ` +
                 `Allowed transitions: ${allowedStatesText}.`,
          currentStatus,
          requestedStatus: newStatus,
          allowedStates: allowedNextStates
        },
        { status: 422 } // 422 Unprocessable Entity - semantically valid but logically invalid
      );
    }

    // 6. Location-based Authorization - Verify user has access to this order's location
    // ==================================================================================
    // This section implements location-based access control using JWT tokens.
    //
    // JWT Token Format: "Bearer <jwt>"
    // 
    // Required JWT Claims:
    //   - sub: User ID (subject)
    //   - locations: Array of authorized location slugs
    //   - role: User role (must be 'kitchen_staff' or 'admin')
    //   - iat: Issued at timestamp
    //   - exp: Expiration timestamp
    //
    // Example JWT payload:
    //   {
    //     "sub": "user123",
    //     "locations": ["post-oak", "conroe"],
    //     "role": "kitchen_staff",
    //     "iat": 1700000000,
    //     "exp": 1700086400
    //   }
    //
    // Security Features:
    //   ✅ Cryptographic signature verification (HMAC SHA-256)
    //   ✅ Expiration validation (tokens expire)
    //   ✅ Replay protection via expiration
    //   ✅ Integrity protection (tampering detected)
    //   ✅ Structured claims validation
    //
    // Token Generation Example (for your auth system):
    //   ```typescript
    //   import jwt from 'jsonwebtoken';
    //   
    //   const token = jwt.sign(
    //     {
    //       sub: user.id,
    //       locations: user.authorizedLocations,
    //       role: user.role
    //     },
    //     process.env.KITCHEN_JWT_SECRET!,
    //     { expiresIn: '24h' }
    //   );
    //   ```
    // ==================================================================================
    try {
      // JWT secret for token verification
      const jwtSecret = process.env.KITCHEN_JWT_SECRET;
      
      if (!jwtSecret) {
        console.error('[AUTHORIZATION] KITCHEN_JWT_SECRET not configured');
        return NextResponse.json(
          { error: 'Service configuration error - JWT secret missing' },
          { status: 503 }
        );
      }

      // Verify and decode JWT token
      let decoded: any;
      try {
        const jwt = await import('jsonwebtoken');
        decoded = jwt.verify(token, jwtSecret, {
          algorithms: ['HS256'], // Only allow HMAC SHA-256
          clockTolerance: 10, // Allow 10 seconds clock skew
        });
      } catch (jwtError: any) {
        console.error('[AUTHORIZATION] JWT verification failed', {
          error: jwtError.message,
          orderId: trimmedOrderId,
          clientIp,
          timestamp: new Date().toISOString()
        });
        
        // Provide specific error messages for different JWT failures
        if (jwtError.name === 'TokenExpiredError') {
          return NextResponse.json(
            { error: 'Token expired - Please sign in again' },
            { status: 401 }
          );
        } else if (jwtError.name === 'JsonWebTokenError') {
          return NextResponse.json(
            { error: 'Invalid token - Authentication failed' },
            { status: 401 }
          );
        } else if (jwtError.name === 'NotBeforeError') {
          return NextResponse.json(
            { error: 'Token not yet valid' },
            { status: 401 }
          );
        }
        
        return NextResponse.json(
          { error: 'Token verification failed' },
          { status: 401 }
        );
      }

      // Validate required JWT claims
      if (!decoded.sub || typeof decoded.sub !== 'string') {
        console.error('[AUTHORIZATION] JWT missing or invalid "sub" claim', {
          orderId: trimmedOrderId,
          clientIp
        });
        return NextResponse.json(
          { error: 'Invalid token claims - missing user ID' },
          { status: 401 }
        );
      }

      if (!decoded.role || typeof decoded.role !== 'string') {
        console.error('[AUTHORIZATION] JWT missing or invalid "role" claim', {
          orderId: trimmedOrderId,
          userId: decoded.sub,
          clientIp
        });
        return NextResponse.json(
          { error: 'Invalid token claims - missing role' },
          { status: 401 }
        );
      }

      // Verify user has kitchen staff or admin role
      const allowedRoles = ['kitchen_staff', 'admin'];
      if (!allowedRoles.includes(decoded.role)) {
        console.warn('[AUTHORIZATION] User does not have required role', {
          orderId: trimmedOrderId,
          userId: decoded.sub,
          role: decoded.role,
          clientIp,
          timestamp: new Date().toISOString()
        });
        return NextResponse.json(
          { error: 'Insufficient permissions - Kitchen staff access required' },
          { status: 403 }
        );
      }

      // Extract authorized locations from JWT claims
      let authorizedLocations: string[] = [];
      
      if (!decoded.locations || !Array.isArray(decoded.locations)) {
        console.error('[AUTHORIZATION] JWT missing or invalid "locations" claim', {
          orderId: trimmedOrderId,
          userId: decoded.sub,
          clientIp
        });
        return NextResponse.json(
          { error: 'Invalid token claims - missing authorized locations' },
          { status: 401 }
        );
      }
      
      authorizedLocations = decoded.locations
        .filter((loc: any) => typeof loc === 'string')
        .map((loc: string) => loc.trim())
        .filter(Boolean);

      if (authorizedLocations.length === 0) {
        console.error('[AUTHORIZATION] No authorized locations found for user', {
          orderId: trimmedOrderId,
          clientIp
        });
        return NextResponse.json(
          { error: 'Forbidden - No location authorization' },
          { status: 403 }
        );
      }

      // Fetch the full location details to get the slug
      const orderLocation = await sanityClient.fetch(
        `*[_type == "location" && _id == $locationId][0]{ _id, "slug": slug.current, name }`,
        { locationId: existingOrder.location._ref }
      );

      if (!orderLocation) {
        console.error('[AUTHORIZATION] Order location not found in database', {
          orderId: trimmedOrderId,
          locationRef: existingOrder.location._ref,
          clientIp
        });
        return NextResponse.json(
          { error: 'Internal server error - Location data unavailable' },
          { status: 500 }
        );
      }

      // Check if user is authorized for this order's location
      const locationSlug = orderLocation.slug;
      const isAuthorized = authorizedLocations.includes(locationSlug);

      if (!isAuthorized) {
        console.warn('[AUTHORIZATION] Access denied - User not authorized for order location', {
          orderId: trimmedOrderId,
          orderLocation: locationSlug,
          authorizedLocations,
          clientIp,
          timestamp: new Date().toISOString()
        });
        return NextResponse.json(
          { error: 'Forbidden - Not authorized to update orders at this location' },
          { status: 403 }
        );
      }

      // Log successful authorization with JWT context
      console.log('[AUTHORIZATION] Access granted', {
        orderId: trimmedOrderId,
        userId: decoded.sub,
        role: decoded.role,
        location: locationSlug,
        authorizedLocations: authorizedLocations.length,
        tokenExp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'none',
        clientIp,
        timestamp: new Date().toISOString()
      });

    } catch (authError) {
      console.error('[AUTHORIZATION] Error checking location authorization:', {
        error: authError instanceof Error ? authError.message : String(authError),
        orderId: trimmedOrderId,
        clientIp,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { error: 'Internal server error - Authorization check failed' },
        { status: 500 }
      );
    }

    // 7. Build timestamp field based on status
    const timestampField = `${newStatus}At`;
    const timestamp = new Date().toISOString();

    // 8. Update order in Sanity
    const updatedOrder = await sanityClient
      .patch(trimmedOrderId)
      .set({
        status: newStatus,
        [timestampField]: timestamp,
      })
      .commit();

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error updating order status:', error);

    // Don't expose internal error details in production
    const message = process.env.NODE_ENV === 'development'
      ? `Failed to update order status: ${error instanceof Error ? error.message : String(error)}`
      : 'Failed to update order status';

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
