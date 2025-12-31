import { NextRequest, NextResponse } from 'next/server';
import { twilioSms, OrderNotificationData } from '@/lib/notifications/twilio';
import { resendEmail, OrderEmailData } from '@/lib/notifications/resend';
import { createClient } from '@sanity/client';
import { SANITY_API_VERSION, withTimeout } from '@/lib/sanity/constants';

// Create Sanity client for fetching notification preferences
function getSanityClient() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

  if (!projectId || !dataset) {
    throw new Error('Sanity configuration missing');
  }

  return createClient({
    projectId,
    dataset,
    apiVersion: SANITY_API_VERSION,
    useCdn: false,
    perspective: 'published',
  });
}

// Verify internal API key for security
function verifyApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  const expectedKey = process.env.INTERNAL_API_KEY;

  if (!expectedKey) {
    console.warn('INTERNAL_API_KEY not configured - notifications API is unprotected');
    return true; // Allow if no key configured (development)
  }

  return apiKey === expectedKey;
}

// Notification types
type NotificationType = 'order_confirmed' | 'order_preparing' | 'order_ready';

interface SendNotificationRequest {
  type: NotificationType;
  orderId: string;
  // Optional overrides
  channels?: {
    sms?: boolean;
    email?: boolean;
  };
}

// Fetch order data for notification
async function fetchOrderData(orderId: string) {
  const client = getSanityClient();

  const query = `
    *[_type == "order" && _id == $orderId][0] {
      _id,
      orderNumber,
      status,
      orderType,
      customer {
        name,
        email,
        phone
      },
      "location": locationSnapshot {
        name,
        address,
        phone
      },
      items[] {
        "name": menuItemSnapshot.name,
        quantity,
        price,
        modifiers[] {
          name,
          option
        }
      },
      subtotal,
      tax,
      tip,
      total,
      estimatedReadyTime
    }
  `;

  return withTimeout(client.fetch(query, { orderId }));
}

// Fetch user notification preferences
async function fetchNotificationPreferences(email: string) {
  const client = getSanityClient();

  const query = `
    *[_type == "notificationPreferences" && email == $email][0].preferences
  `;

  const prefs = await withTimeout(client.fetch(query, { email }));

  // Default preferences if none set
  return prefs || {
    email: { orderConfirmation: true, orderReady: true, promotions: false },
    sms: { orderConfirmation: true, orderReady: true, promotions: false },
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verify API key
    if (!verifyApiKey(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, orderId, channels } = body as SendNotificationRequest;

    if (!type || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields: type, orderId' },
        { status: 400 }
      );
    }

    // Fetch order data
    const order = await fetchOrderData(orderId);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Fetch user preferences
    const prefs = await fetchNotificationPreferences(order.customer.email);

    // Determine which channels to use
    const sendSms = channels?.sms ?? true;
    const sendEmailFlag = channels?.email ?? true;

    const results = {
      sms: { sent: false, success: false, error: null as string | null },
      email: { sent: false, success: false, error: null as string | null },
    };

    // Prepare notification data
    const smsData: OrderNotificationData = {
      orderNumber: order.orderNumber,
      customerPhone: order.customer.phone,
      customerName: order.customer.name,
      locationName: order.location.name,
      estimatedReadyTime: order.estimatedReadyTime,
      total: order.total,
    };

    const emailData: OrderEmailData = {
      orderNumber: order.orderNumber,
      customerEmail: order.customer.email,
      customerName: order.customer.name,
      locationName: order.location.name,
      locationAddress: order.location.address,
      locationPhone: order.location.phone,
      orderType: order.orderType,
      estimatedReadyTime: order.estimatedReadyTime,
      total: order.total,
      items: order.items.map((item: {
        name: string;
        quantity: number;
        price: number;
        modifiers?: Array<{ name: string; option: string }>;
      }) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        modifiers: item.modifiers?.map((m) => `${m.name}: ${m.option}`) || [],
      })),
    };

    // Send notifications based on type
    switch (type) {
      case 'order_confirmed':
        // Check preferences
        if (sendSms && prefs.sms.orderConfirmation && order.customer.phone) {
          results.sms.sent = true;
          const smsResult = await twilioSms.sendOrderConfirmed(smsData);
          results.sms.success = smsResult.success;
          results.sms.error = smsResult.error || null;
        }

        if (sendEmailFlag && prefs.email.orderConfirmation && order.customer.email) {
          results.email.sent = true;
          const emailResult = await resendEmail.sendOrderConfirmation(emailData);
          results.email.success = emailResult.success;
          results.email.error = emailResult.error || null;
        }
        break;

      case 'order_preparing':
        // Only send SMS for preparing (no email)
        if (sendSms && prefs.sms.orderConfirmation && order.customer.phone) {
          results.sms.sent = true;
          const smsResult = await twilioSms.sendOrderPreparing(smsData);
          results.sms.success = smsResult.success;
          results.sms.error = smsResult.error || null;
        }
        break;

      case 'order_ready':
        if (sendSms && prefs.sms.orderReady && order.customer.phone) {
          results.sms.sent = true;
          const smsResult = await twilioSms.sendOrderReady(smsData);
          results.sms.success = smsResult.success;
          results.sms.error = smsResult.error || null;
        }

        if (sendEmailFlag && prefs.email.orderReady && order.customer.email) {
          results.email.sent = true;
          const emailResult = await resendEmail.sendOrderReady(emailData);
          results.email.success = emailResult.success;
          results.email.error = emailResult.error || null;
        }
        break;

      default:
        return NextResponse.json(
          { error: `Unknown notification type: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      orderId,
      type,
      results,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
