import { Resend } from 'resend';
import { OrderConfirmationEmail } from '@/emails/OrderConfirmation';
import { OrderReadyEmail } from '@/emails/OrderReady';
import { withRetry, isTransientError } from '@/lib/utils/retry';

// Initialize Resend client
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('RESEND_API_KEY not configured');
  }

  return new Resend(apiKey);
}

function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL || 'orders@thecatchseafood.com';
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || 'https://thecatchseafood.com';
}

export interface OrderEmailData {
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  locationName: string;
  locationAddress: string;
  locationPhone: string;
  orderType: string;
  estimatedReadyTime?: string;
  total: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    modifiers?: string[];
  }>;
}

// Send Order Confirmation Email with retry
export async function sendOrderConfirmationEmail(data: OrderEmailData) {
  try {
    const resend = getResendClient();
    const trackingUrl = `${getBaseUrl()}/orders/${data.orderNumber}`;

    const result = await withRetry(
      async () => resend.emails.send({
        from: getFromEmail(),
        to: data.customerEmail,
        subject: `Order Confirmed - #${data.orderNumber}`,
        react: OrderConfirmationEmail({
          orderNumber: data.orderNumber,
          customerName: data.customerName,
          locationName: data.locationName,
          locationAddress: data.locationAddress,
          locationPhone: data.locationPhone,
          orderType: data.orderType,
          estimatedReadyTime: data.estimatedReadyTime,
          total: data.total,
          items: data.items,
          trackingUrl,
        }),
      }),
      {
        maxRetries: 3,
        baseDelay: 1000,
        onRetry: (error, attempt) => {
          console.warn(`Email retry attempt ${attempt}:`, error.message);
        },
        noRetryOn: (error) => !isTransientError(error),
      }
    );

    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error('Failed to send confirmation email after retries:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Send Order Ready Email with retry
export async function sendOrderReadyEmail(data: Omit<OrderEmailData, 'items'>) {
  try {
    const resend = getResendClient();

    const result = await withRetry(
      async () => resend.emails.send({
        from: getFromEmail(),
        to: data.customerEmail,
        subject: `Your Order is Ready! - #${data.orderNumber}`,
        react: OrderReadyEmail({
          orderNumber: data.orderNumber,
          customerName: data.customerName,
          locationName: data.locationName,
          locationAddress: data.locationAddress,
          locationPhone: data.locationPhone,
        }),
      }),
      {
        maxRetries: 3,
        baseDelay: 1000,
        onRetry: (error, attempt) => {
          console.warn(`Email retry attempt ${attempt}:`, error.message);
        },
        noRetryOn: (error) => !isTransientError(error),
      }
    );

    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error('Failed to send ready email after retries:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Export all email functions
export const resendEmail = {
  sendOrderConfirmation: sendOrderConfirmationEmail,
  sendOrderReady: sendOrderReadyEmail,
};
