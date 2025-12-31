import { createClient } from '@sanity/client';
import { NextRequest, NextResponse } from 'next/server';
import { SANITY_API_VERSION, withTimeout } from '@/lib/sanity/constants';

// Create a read-only Sanity client for order lookups
function getReadOnlyClient() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

  if (!projectId || !dataset) {
    throw new Error('Sanity configuration missing');
  }

  return createClient({
    projectId,
    dataset,
    apiVersion: SANITY_API_VERSION,
    useCdn: true, // Use CDN for faster reads
    perspective: 'published',
  });
}

// Validate order number format (e.g., ORD-20250123-ABC123)
function isValidOrderNumber(orderNumber: string): boolean {
  return /^ORD-\d{8}-[A-Z0-9]+$/i.test(orderNumber);
}

// Mask sensitive customer info for public display
function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return '***@***.***';
  const maskedLocal = localPart.charAt(0) + '***' + localPart.charAt(localPart.length - 1);
  return `${maskedLocal}@${domain}`;
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***-***-****';
  return `***-***-${digits.slice(-4)}`;
}

function maskName(name: string): string {
  const parts = name.split(' ');
  return parts.map(part => {
    if (part.length <= 2) return part;
    return part.charAt(0) + '*'.repeat(part.length - 2) + part.charAt(part.length - 1);
  }).join(' ');
}

// GROQ query for order tracking
const ORDER_TRACKING_QUERY = `
  *[_type == "order" && orderNumber == $orderNumber][0] {
    _id,
    orderNumber,
    status,
    orderType,
    "location": locationSnapshot {
      name,
      address,
      phone
    },
    "customer": {
      "name": customer.name,
      "email": customer.email,
      "phone": customer.phone
    },
    items[] {
      _key,
      "name": menuItemSnapshot.name,
      "description": menuItemSnapshot.description,
      quantity,
      price,
      totalPrice,
      modifiers[] {
        name,
        option,
        priceDelta
      },
      specialInstructions
    },
    subtotal,
    tax,
    tip,
    deliveryFee,
    total,
    specialInstructions,
    scheduledFor,
    estimatedReadyTime,
    createdAt,
    confirmedAt,
    preparingAt,
    readyAt,
    completedAt,
    cancelledAt
  }
`;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;

    // Validate order number format
    if (!isValidOrderNumber(orderNumber)) {
      return NextResponse.json(
        { error: 'Invalid order number format' },
        { status: 400 }
      );
    }

    const client = getReadOnlyClient();

    // Fetch order from Sanity (with timeout)
    const order = await withTimeout(
      client.fetch(ORDER_TRACKING_QUERY, { orderNumber: orderNumber.toUpperCase() })
    );

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Mask sensitive customer information for public display
    const maskedOrder = {
      ...order,
      customer: {
        name: maskName(order.customer.name),
        email: maskEmail(order.customer.email),
        phone: maskPhone(order.customer.phone),
      },
    };

    // Cache headers: private (user-specific), short TTL with stale-while-revalidate
    const cacheMaxAge = order.status === 'completed' || order.status === 'cancelled' ? 300 : 15;

    return NextResponse.json({
      order: maskedOrder,
      // Include metadata for polling
      _meta: {
        fetchedAt: new Date().toISOString(),
        // Suggest polling interval based on status
        suggestedPollInterval: getSuggestedPollInterval(order.status),
      },
    }, {
      headers: {
        'Cache-Control': `private, max-age=${cacheMaxAge}, stale-while-revalidate=30`,
      },
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// Suggest polling interval based on order status
function getSuggestedPollInterval(status: string): number {
  switch (status) {
    case 'pending':
      return 30000; // 30 seconds - waiting for confirmation
    case 'confirmed':
      return 30000; // 30 seconds - kitchen may start soon
    case 'preparing':
      return 15000; // 15 seconds - actively being made
    case 'ready':
      return 60000; // 1 minute - waiting for pickup
    case 'completed':
    case 'cancelled':
      return 0; // No need to poll - final state
    default:
      return 30000;
  }
}
