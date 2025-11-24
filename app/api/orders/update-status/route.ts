import { NextRequest, NextResponse } from 'next/server';
import { getSanityClient } from '@/lib/sanity-config';
import { timingSafeEqual } from 'crypto';

// Force Node.js runtime (required for crypto.timingSafeEqual)
export const runtime = 'nodejs';

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * Simple in-memory rate limiting (per IP)
 *
 * IMPORTANT: This is a basic in-memory implementation suitable for:
 * - Single-server deployments
 * - Serverless with careful tuning (see cleanup strategy below)
 * - Development and testing
 *
 * For production multi-server deployments, consider:
 * - Redis-based rate limiting (e.g., @upstash/ratelimit)
 * - Edge middleware rate limiting (e.g., Vercel Edge Config)
 * - Database-backed rate limiting
 */

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute

/**
 * Cleanup expired rate limit entries to prevent memory leaks
 *
 * Strategy depends on deployment model:
 * - Traditional server: Use periodic cleanup (setInterval)
 * - Serverless/Edge: Use on-demand cleanup (this function)
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  const CLEANUP_THRESHOLD = 100; // Only cleanup if map grows beyond this size

  // Skip cleanup if map is small (optimization for serverless cold starts)
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

/**
 * Check if IP has exceeded rate limit
 * @returns true if request should be allowed, false if rate limit exceeded
 */
function checkRateLimit(ip: string): boolean {
  // Perform on-demand cleanup periodically (10% of requests)
  // This prevents memory leaks in serverless environments
  if (rateLimitMap.size >= 100 && Math.random() < 0.1) {
    cleanupExpiredEntries();
  }

  const now = Date.now();
  const record = rateLimitMap.get(ip);

  // Clean up expired record
  if (record && now > record.resetAt) {
    rateLimitMap.delete(ip);
  }

  // Create new record if none exists or expired
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  // Check if limit exceeded
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  // Increment counter
  record.count++;
  return true;
}

/**
 * Extract client IP with support for multiple proxy configurations
 *
 * Priority order:
 * 1. CF-Connecting-IP (CloudFlare)
 * 2. X-Real-IP (nginx)
 * 3. X-Forwarded-For (standard proxy header)
 *
 * Security considerations:
 * - These headers can be spoofed if not validated by a trusted proxy
 * - In production, ensure your CDN/proxy is configured to set these headers
 * - Consider using REQUIRE_VERIFIED_IP=true in production
 */
function getClientIp(request: NextRequest): string | null {
  const cfConnectingIp = request.headers.get('cf-connecting-ip'); // CloudFlare
  const xRealIp = request.headers.get('x-real-ip'); // nginx
  const xForwardedFor = request.headers.get('x-forwarded-for'); // Standard proxy

  let clientIp: string | null = null;

  if (cfConnectingIp) {
    clientIp = cfConnectingIp.trim();
  } else if (xRealIp) {
    clientIp = xRealIp.trim();
  } else if (xForwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    clientIp = xForwardedFor.split(',')[0].trim();
  }

  // Validate IP address format (basic IPv4/IPv6 check)
  const isValidIp = (ip: string): boolean => {
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
    return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
  };

  if (!clientIp || !isValidIp(clientIp)) {
    const requireVerifiedIp = process.env.REQUIRE_VERIFIED_IP === 'true';

    if (requireVerifiedIp) {
      console.error('[RATE_LIMIT] Request rejected - No verifiable client IP', {
        cfConnectingIp,
        xRealIp,
        xForwardedFor,
        timestamp: new Date().toISOString()
      });
      return null; // Signal that IP validation failed
    }

    // Fall back to a placeholder IP for development
    console.warn('[RATE_LIMIT] No valid IP found, using fallback (development only)');
    clientIp = 'unknown';
  }

  return clientIp;
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * Validate and return INTERNAL_API_KEY from environment
 * @throws {Error} if INTERNAL_API_KEY is not configured
 */
function getInternalApiKey(): string {
  const apiKey = process.env.INTERNAL_API_KEY;

  if (!apiKey) {
    throw new Error(
      'INTERNAL_API_KEY not configured. This is required for internal API authentication.'
    );
  }

  return apiKey;
}

/**
 * HTTP POST handler that updates an order's status and records a corresponding timestamp in Sanity.
 *
 * @param request - NextRequest whose JSON body must include `orderId` (Sanity document ID) and `newStatus` (one of `'confirmed'`, `'preparing'`, `'ready'`, `'completed'`, `'cancelled'`).
 * @returns A NextResponse containing JSON:
 * - On success: `{ success: true, order: <updated order document> }`.
 * - On client error (missing/invalid input): `{ error: <message> }` with status 400.
 * - On server error: `{ error: 'Failed to update order status' }` with status 500.
 */
export async function POST(request: NextRequest) {
  try {
    // ========================================================================
    // RATE LIMITING CHECK
    // ========================================================================
    const clientIp = getClientIp(request);

    if (!clientIp) {
      // IP validation failed (only in production with REQUIRE_VERIFIED_IP=true)
      return NextResponse.json(
        { error: 'Bad request - Client identification required' },
        { status: 400 }
      );
    }

    if (!checkRateLimit(clientIp)) {
      console.warn(`[RATE_LIMIT] Rate limit exceeded for IP: ${clientIp}`);
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // ========================================================================
    // REQUEST PARSING
    // ========================================================================
    // Parse request body first to distinguish JSON errors from other failures
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Authentication: Require internal API key for order updates
    let apiKey: string;
    try {
      apiKey = getInternalApiKey();
    } catch (configError) {
      console.error('INTERNAL_API_KEY not configured:', configError);
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7).trim(); // Remove 'Bearer ' prefix and trim whitespace

    // Use timing-safe comparison to prevent timing attacks
    try {
      const tokenBuffer = Buffer.from(token, 'utf8');
      const apiKeyBuffer = Buffer.from(apiKey, 'utf8');

      // If lengths differ, treat as invalid (timingSafeEqual requires equal lengths)
      if (tokenBuffer.length !== apiKeyBuffer.length) {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        );
      }

      if (!timingSafeEqual(tokenBuffer, apiKeyBuffer)) {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        );
      }
    } catch (comparisonError) {
      // Handle any buffer conversion errors
      console.error('Error during token comparison:', comparisonError);
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Validate request body structure
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Request body must be a JSON object' },
        { status: 400 }
      );
    }

    const { orderId, newStatus } = body as Record<string, unknown>;

    // Validate inputs with strict type checking
    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid orderId (must be string)' },
        { status: 400 }
      );
    }

    if (!newStatus || typeof newStatus !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid newStatus (must be string)' },
        { status: 400 }
      );
    }

    // Validate status against whitelist
    const validStatuses = ['confirmed', 'preparing', 'ready', 'completed', 'cancelled'] as const;
    if (!validStatuses.includes(newStatus as typeof validStatuses[number])) {
      return NextResponse.json(
        { error: `Invalid status value. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Get Sanity client (validates env vars at runtime, not build time)
    // Uses shared config with centralized apiVersion
    const client = getSanityClient();

    // Verify order exists
    const existingOrder = await client.fetch(
      `*[_type == "order" && _id == $orderId][0]`,
      { orderId }
    );

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Build timestamp field based on status
    const timestampField = `${newStatus}At`;
    const timestamp = new Date().toISOString();

    // Update order in Sanity
    const updatedOrder = await client
      .patch(orderId)
      .set({
        status: newStatus,
        [timestampField]: timestamp,
        updatedAt: timestamp,
      })
      .commit();

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}