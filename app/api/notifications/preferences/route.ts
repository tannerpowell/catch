import { createClient } from '@sanity/client';
import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { SANITY_API_VERSION, withTimeout } from '@/lib/sanity/constants';

// Create Sanity client with write access for preferences
function getSanityClient() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const token = process.env.SANITY_WRITE_TOKEN;

  if (!projectId || !dataset) {
    throw new Error('Sanity configuration missing');
  }

  return createClient({
    projectId,
    dataset,
    apiVersion: SANITY_API_VERSION,
    useCdn: false,
    token,
  });
}

interface NotificationPreferences {
  email: {
    orderConfirmation: boolean;
    orderReady: boolean;
    promotions: boolean;
  };
  sms: {
    orderConfirmation: boolean;
    orderReady: boolean;
    promotions: boolean;
  };
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  email: {
    orderConfirmation: true,
    orderReady: true,
    promotions: false,
  },
  sms: {
    orderConfirmation: true,
    orderReady: true,
    promotions: false,
  },
};

// GET - Fetch user's notification preferences
export async function GET() {
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

    const client = getSanityClient();

    // Try to fetch existing preferences (with timeout)
    const existingPrefs = await withTimeout(
      client.fetch(
        `*[_type == "notificationPreferences" && email == $email][0]`,
        { email }
      )
    );

    if (existingPrefs) {
      return NextResponse.json({
        preferences: existingPrefs.preferences,
      });
    }

    // Return defaults if no preferences exist
    return NextResponse.json({
      preferences: DEFAULT_PREFERENCES,
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

// PUT - Update user's notification preferences
export async function PUT(request: NextRequest) {
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
    const phone = user?.phoneNumbers?.[0]?.phoneNumber;

    if (!email) {
      return NextResponse.json(
        { error: 'No email associated with account' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { preferences } = body as { preferences: NotificationPreferences };

    if (!preferences) {
      return NextResponse.json(
        { error: 'Preferences required' },
        { status: 400 }
      );
    }

    const client = getSanityClient();

    // Check for existing preferences document (with timeout)
    const existing = await withTimeout(
      client.fetch(
        `*[_type == "notificationPreferences" && email == $email][0]._id`,
        { email }
      )
    );

    if (existing) {
      // Update existing document
      await client
        .patch(existing)
        .set({
          preferences,
          phone: phone || null,
          updatedAt: new Date().toISOString(),
        })
        .commit();
    } else {
      // Create new preferences document
      await client.create({
        _type: 'notificationPreferences',
        email,
        phone: phone || null,
        clerkUserId: userId,
        preferences,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
