import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SanityClient } from '@sanity/client';
import { timingSafeEqual } from 'crypto';

// Lazy-load Sanity client to avoid build-time errors when env vars aren't set
let sanityClient: SanityClient | null = null;

function getSanityClient(): SanityClient {
  if (sanityClient) {
    return sanityClient;
  }

  const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const SANITY_WRITE_TOKEN = process.env.SANITY_WRITE_TOKEN;

  if (!SANITY_PROJECT_ID || !SANITY_DATASET || !SANITY_WRITE_TOKEN) {
    const missing: string[] = [];
    if (!SANITY_PROJECT_ID) missing.push('NEXT_PUBLIC_SANITY_PROJECT_ID');
    if (!SANITY_DATASET) missing.push('NEXT_PUBLIC_SANITY_DATASET');
    if (!SANITY_WRITE_TOKEN) missing.push('SANITY_WRITE_TOKEN');

    throw new Error(
      `Missing required environment variables for order status API: ${missing.join(', ')}. ` +
      'Please ensure these are set in your environment configuration.'
    );
  }

  sanityClient = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    useCdn: false,
    apiVersion: 'v2024-06-24',
    token: SANITY_WRITE_TOKEN,
  });

  return sanityClient;
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
    // Authentication: Require internal API key for order updates
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.INTERNAL_API_KEY;

    if (!apiKey) {
      console.error('INTERNAL_API_KEY not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

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

    const { orderId, newStatus } = await request.json();

    // Validate inputs
    if (!orderId || !newStatus) {
      return NextResponse.json(
        { error: 'Missing orderId or newStatus' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Get Sanity client (validates env vars at runtime, not build time)
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