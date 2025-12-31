import twilio from 'twilio';
import { withRetry, isTransientError } from '@/lib/utils/retry';

// Initialize Twilio client
function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured');
  }

  return twilio(accountSid, authToken);
}

function getFromNumber(): string {
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!phoneNumber) {
    throw new Error('TWILIO_PHONE_NUMBER not configured');
  }
  return phoneNumber;
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || 'https://thecatchseafood.com';
}

export interface OrderNotificationData {
  orderNumber: string;
  customerPhone: string;
  customerName: string;
  locationName: string;
  estimatedReadyTime?: string;
  total?: number;
}

// Format phone number to E.164 format
function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  // Add US country code if not present
  if (digits.length === 10) {
    return `+1${digits}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  // Already has country code or international format
  if (phone.startsWith('+')) {
    return phone;
  }

  return `+${digits}`;
}

// Format time for display
function formatTime(isoString?: string): string {
  if (!isoString) return '';

  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Send SMS notification with retry
async function sendSms(to: string, body: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  try {
    const client = getTwilioClient();

    const message = await withRetry(
      async () => client.messages.create({
        body,
        to: formatPhoneNumber(to),
        from: getFromNumber(),
      }),
      {
        maxRetries: 3,
        baseDelay: 1000,
        onRetry: (error, attempt) => {
          console.warn(`SMS retry attempt ${attempt}:`, error.message);
        },
        noRetryOn: (error) => !isTransientError(error),
      }
    );

    return { success: true, sid: message.sid };
  } catch (error) {
    console.error('Failed to send SMS after retries:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Order Confirmed SMS
export async function sendOrderConfirmedSms(data: OrderNotificationData) {
  const trackingUrl = `${getBaseUrl()}/orders/${data.orderNumber}`;
  const etaText = data.estimatedReadyTime
    ? ` ETA: ${formatTime(data.estimatedReadyTime)}.`
    : '';

  const message = `The Catch: Order #${data.orderNumber} confirmed!${etaText} Track your order: ${trackingUrl}`;

  return sendSms(data.customerPhone, message);
}

// Order Preparing SMS
export async function sendOrderPreparingSms(data: OrderNotificationData) {
  const message = `The Catch: Kitchen has started preparing your order #${data.orderNumber}. We'll text you when it's ready!`;

  return sendSms(data.customerPhone, message);
}

// Order Ready SMS
export async function sendOrderReadySms(data: OrderNotificationData) {
  const message = `The Catch: Your order #${data.orderNumber} is READY for pickup at ${data.locationName}! Show this text at the counter.`;

  return sendSms(data.customerPhone, message);
}

// Export all SMS functions
export const twilioSms = {
  sendOrderConfirmed: sendOrderConfirmedSms,
  sendOrderPreparing: sendOrderPreparingSms,
  sendOrderReady: sendOrderReadySms,
};
