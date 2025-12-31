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

// Fetch the original order
const ORDER_QUERY = `
  *[_type == "order" && _id == $orderId && customer.email == $email][0] {
    _id,
    orderNumber,
    "locationId": locationSnapshot._ref,
    "locationName": locationSnapshot.name,
    items[] {
      _key,
      "menuItemId": menuItemSnapshot._ref,
      "name": menuItemSnapshot.name,
      "originalPrice": price,
      quantity,
      modifiers[] {
        name,
        option,
        priceDelta
      },
      specialInstructions
    }
  }
`;

// Check if menu items are still available at a location
const MENU_ITEMS_QUERY = `
  *[_type == "menuItem" && _id in $menuItemIds] {
    _id,
    name,
    "slug": slug.current,
    price,
    isAvailable,
    description,
    "image": image.asset->url,
    "categorySlug": *[_type == "menuCategory" && references(^._id)][0].slug.current,
    "categories": *[_type == "menuCategory" && references(^._id)] {
      _id,
      name
    }
  }
`;

// Check location availability for items
const LOCATION_ITEMS_QUERY = `
  *[_type == "location" && _id == $locationId][0] {
    _id,
    name,
    "unavailableItems": unavailableMenuItems[]->_id
  }
`;

interface MenuItemData {
  _id: string;
  name: string;
  slug: string;
  price: number;
  description?: string;
  image?: string;
  categorySlug: string;
  isAvailable: boolean;
}

interface ReorderItem {
  _key: string;
  menuItemId: string;
  name: string;
  originalPrice: number;
  quantity: number;
  modifiers?: Array<{
    name: string;
    option: string;
    priceDelta: number;
  }>;
  specialInstructions?: string;
  // Added after availability check
  isAvailable?: boolean;
  currentPrice?: number;
  priceChanged?: boolean;
  unavailableReason?: string;
  menuItem?: MenuItemData;
}

export async function POST(request: NextRequest) {
  try {
    const isClerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

    if (!isClerkConfigured) {
      return NextResponse.json(
        { error: 'Authentication not configured' },
        { status: 503 }
      );
    }

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;

    if (!email) {
      return NextResponse.json(
        { error: 'No email associated with account' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { orderId, targetLocationId } = body as {
      orderId: string;
      targetLocationId?: string;
    };

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID required' },
        { status: 400 }
      );
    }

    const client = getReadOnlyClient();

    // Fetch the original order (with timeout)
    const order = await withTimeout(client.fetch(ORDER_QUERY, { orderId, email }));

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or access denied' },
        { status: 404 }
      );
    }

    // Use target location if provided, otherwise use original order location
    const locationId = targetLocationId || order.locationId;

    // Get all menu item IDs from the order
    const menuItemIds = order.items
      .map((item: ReorderItem) => item.menuItemId)
      .filter(Boolean);

    // Fetch current menu item data and location availability in parallel (with timeout)
    const [currentItems, locationData] = await withTimeout(
      Promise.all([
        client.fetch(MENU_ITEMS_QUERY, { menuItemIds }),
        client.fetch(LOCATION_ITEMS_QUERY, { locationId }),
      ])
    );

    // Build a map of current item data
    const currentItemMap = new Map<string, MenuItemData>(
      currentItems.map((item: MenuItemData) => [item._id, item])
    );

    // Get unavailable items at the location
    const unavailableAtLocation = new Set(locationData?.unavailableItems || []);

    // Process each order item
    const processedItems: ReorderItem[] = order.items.map((item: ReorderItem) => {
      const currentData = currentItemMap.get(item.menuItemId);

      // Determine availability
      let isAvailable = true;
      let unavailableReason: string | undefined;

      if (!currentData) {
        isAvailable = false;
        unavailableReason = 'Item no longer exists on menu';
      } else if (!currentData.isAvailable) {
        isAvailable = false;
        unavailableReason = 'Item is currently unavailable';
      } else if (unavailableAtLocation.has(item.menuItemId)) {
        isAvailable = false;
        unavailableReason = 'Item not available at this location';
      }

      const currentPrice = currentData?.price ?? item.originalPrice;
      const priceChanged = currentData && currentData.price !== item.originalPrice;

      return {
        ...item,
        isAvailable,
        currentPrice,
        priceChanged,
        unavailableReason,
        menuItem: currentData,
      };
    });

    // Separate available and unavailable items
    const availableItems = processedItems.filter((item) => item.isAvailable);
    const unavailableItems = processedItems.filter((item) => !item.isAvailable);

    // Check if we're using a different location
    const locationChanged = targetLocationId && targetLocationId !== order.locationId;

    return NextResponse.json({
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        originalLocation: order.locationName,
      },
      targetLocation: locationData?.name || order.locationName,
      locationChanged,
      availableItems,
      unavailableItems,
      summary: {
        totalItems: processedItems.length,
        availableCount: availableItems.length,
        unavailableCount: unavailableItems.length,
        hasChanges:
          unavailableItems.length > 0 ||
          availableItems.some((item) => item.priceChanged),
      },
    });
  } catch (error) {
    console.error('Error processing reorder:', error);
    return NextResponse.json(
      { error: 'Failed to process reorder request' },
      { status: 500 }
    );
  }
}
