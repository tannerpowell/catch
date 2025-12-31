import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface OrderConfirmationEmailProps {
  orderNumber: string;
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
  trackingUrl: string;
}

export function OrderConfirmationEmail({
  orderNumber,
  customerName,
  locationName,
  locationAddress,
  locationPhone,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  orderType,
  estimatedReadyTime,
  total,
  items,
  trackingUrl,
}: OrderConfirmationEmailProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const previewText = `Your order #${orderNumber} has been confirmed!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img
              src="https://thecatchseafood.com/logo.png"
              width="150"
              alt="The Catch"
              style={logo}
            />
          </Section>

          {/* Confirmation Badge */}
          <Section style={confirmationBadge}>
            <Text style={checkmark}>✓</Text>
            <Heading style={confirmationTitle}>Order Confirmed!</Heading>
          </Section>

          <Text style={greeting}>Hi {customerName},</Text>
          <Text style={paragraph}>
            Thank you for your order! We&apos;ve received your order and are getting it ready.
          </Text>

          {/* Order Details Box */}
          <Section style={orderBox}>
            <Text style={orderLabel}>Order Number</Text>
            <Text style={orderNumber as React.CSSProperties}>#{orderNumber}</Text>

            <Hr style={divider} />

            <Text style={orderLabel}>Pickup Location</Text>
            <Text style={orderValue}>{locationName}</Text>
            <Text style={orderSubValue}>{locationAddress}</Text>
            <Link href={`tel:${locationPhone}`} style={phoneLink}>
              {locationPhone}
            </Link>

            {estimatedReadyTime && (
              <>
                <Hr style={divider} />
                <Text style={orderLabel}>Estimated Ready Time</Text>
                <Text style={estimatedTime}>{formatTime(estimatedReadyTime)}</Text>
              </>
            )}
          </Section>

          {/* Order Items */}
          <Section style={itemsSection}>
            <Heading as="h2" style={itemsTitle}>Order Summary</Heading>

            {items.map((item, index) => (
              <Section key={index} style={itemRow}>
                <Text style={itemName}>
                  {item.quantity}x {item.name}
                </Text>
                <Text style={itemPrice}>{formatPrice(item.price * item.quantity)}</Text>
                {item.modifiers && item.modifiers.length > 0 && (
                  <Text style={itemModifiers}>{item.modifiers.join(', ')}</Text>
                )}
              </Section>
            ))}

            <Hr style={divider} />

            <Section style={totalRow}>
              <Text style={totalLabel}>Total</Text>
              <Text style={totalValue}>{formatPrice(total)}</Text>
            </Section>
          </Section>

          {/* Track Order Button */}
          <Section style={buttonSection}>
            <Button href={trackingUrl} style={button}>
              Track Your Order
            </Button>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Text style={footer}>
            Questions about your order? Call us at{' '}
            <Link href={`tel:${locationPhone}`} style={footerLink}>
              {locationPhone}
            </Link>
          </Text>
          <Text style={footer}>
            The Catch - Fresh Seafood, Served with Soul
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#faf7f3',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
};

const header = {
  textAlign: 'center' as const,
  padding: '20px 0',
};

const logo = {
  margin: '0 auto',
};

const confirmationBadge = {
  textAlign: 'center' as const,
  padding: '24px',
  backgroundColor: '#e8f5e9',
  borderRadius: '12px',
  marginBottom: '24px',
};

const checkmark = {
  fontSize: '48px',
  margin: '0 0 8px 0',
};

const confirmationTitle = {
  color: '#2e7d32',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
};

const greeting = {
  fontSize: '16px',
  color: '#333',
  marginBottom: '8px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.5',
  color: '#555',
  marginBottom: '24px',
};

const orderBox = {
  backgroundColor: '#fff',
  border: '1px solid #e0e0e0',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '24px',
};

const orderLabel = {
  fontSize: '12px',
  color: '#888',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 4px 0',
};

const orderValue = {
  fontSize: '16px',
  color: '#333',
  fontWeight: '500',
  margin: '0',
};

const orderSubValue = {
  fontSize: '14px',
  color: '#666',
  margin: '4px 0 0 0',
};

const phoneLink = {
  fontSize: '14px',
  color: '#2B7A9B',
  textDecoration: 'none',
};

const estimatedTime = {
  fontSize: '24px',
  color: '#2B7A9B',
  fontWeight: 'bold',
  margin: '0',
};

const divider = {
  borderColor: '#e0e0e0',
  margin: '16px 0',
};

const itemsSection = {
  backgroundColor: '#fff',
  border: '1px solid #e0e0e0',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '24px',
};

const itemsTitle = {
  fontSize: '18px',
  color: '#333',
  margin: '0 0 16px 0',
};

const itemRow = {
  marginBottom: '12px',
};

const itemName = {
  fontSize: '14px',
  color: '#333',
  margin: '0',
};

const itemPrice = {
  fontSize: '14px',
  color: '#666',
  margin: '0',
};

const itemModifiers = {
  fontSize: '12px',
  color: '#888',
  margin: '4px 0 0 0',
};

const totalRow = {
  display: 'flex' as const,
  justifyContent: 'space-between' as const,
};

const totalLabel = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#333',
};

const totalValue = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#2B7A9B',
};

const buttonSection = {
  textAlign: 'center' as const,
  marginBottom: '24px',
};

const button = {
  backgroundColor: '#2B7A9B',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const footer = {
  fontSize: '12px',
  color: '#888',
  textAlign: 'center' as const,
  marginTop: '16px',
};

const footerLink = {
  color: '#2B7A9B',
  textDecoration: 'none',
};
