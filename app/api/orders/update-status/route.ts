import { NextRequest, NextResponse } from 'next/server';
import { getSanityClient } from '@/lib/sanity-config';
import { timingSafeEqual } from 'crypto';

// Force Node.js runtime (required for crypto.timingSafeEqual)
export const runtime = 'nodejs';

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