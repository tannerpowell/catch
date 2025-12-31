import { createClient } from '@sanity/client';
import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { SANITY_API_VERSION, withTimeout } from '@/lib/sanity/constants';

// Create a read-only Sanity client
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
    useCdn: true,
    perspective: 'published',
  });
}

// GROQ query for order history
const ORDER_HISTORY_QUERY = `
  *[_type == "order" && customer.email == $email] | order(createdAt desc) [$start...$end] {
    _id,
    orderNumber,
    status,
    orderType,
    total,
    createdAt,
    "locationName": locationSnapshot.name,
    "itemCount": count(items),
    "itemSummary": items[0...3] {
      _key,
      "name": menuItemSnapshot.name,
      quantity
    }
  }
`;

// Count query for pagination
const ORDER_COUNT_QUERY = `
  count(*[_type == "order" && customer.email == $email])
`;

const PAGE_SIZE = 10;

export async function GET(request: NextRequest) {
  try {
    // Check if Clerk is configured
    const isClerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

    if (!isClerkConfigured) {
      return NextResponse.json(
        { error: 'Authentication not configured' },
        { status: 503 }
      );
    }

    // Verify authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the user's email from Clerk
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;

    if (!email) {
      return NextResponse.json(
        { error: 'No email address associated with account' },
        { status: 400 }
      );
    }

    // Parse pagination params
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const status = searchParams.get('status'); // 'active', 'completed', or null for all

    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;

    const client = getReadOnlyClient();

    // Modify query based on status filter
    let query = ORDER_HISTORY_QUERY;
    let countQuery = ORDER_COUNT_QUERY;

    if (status === 'active') {
      query = query.replace(
        'customer.email == $email',
        'customer.email == $email && status in ["pending", "confirmed", "preparing", "ready"]'
      );
      countQuery = countQuery.replace(
        'customer.email == $email',
        'customer.email == $email && status in ["pending", "confirmed", "preparing", "ready"]'
      );
    } else if (status === 'completed') {
      query = query.replace(
        'customer.email == $email',
        'customer.email == $email && status in ["completed", "cancelled"]'
      );
      countQuery = countQuery.replace(
        'customer.email == $email',
        'customer.email == $email && status in ["completed", "cancelled"]'
      );
    }

    // Fetch orders and count in parallel (with timeout)
    const [orders, totalCount] = await withTimeout(
      Promise.all([
        client.fetch(query, { email, start, end }),
        client.fetch(countQuery, { email }),
      ])
    );

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching order history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order history' },
      { status: 500 }
    );
  }
}
