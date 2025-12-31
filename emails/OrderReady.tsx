import {
  Body,
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

interface OrderReadyEmailProps {
  orderNumber: string;
  customerName: string;
  locationName: string;
  locationAddress: string;
  locationPhone: string;
}

export function OrderReadyEmail({
  orderNumber,
  customerName,
  locationName,
  locationAddress,
  locationPhone,
}: OrderReadyEmailProps) {
  const previewText = `Your order #${orderNumber} is ready for pickup!`;

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

          {/* Ready Badge */}
          <Section style={readyBadge}>
            <Text style={bellIcon}>🔔</Text>
            <Heading style={readyTitle}>Your Order is Ready!</Heading>
          </Section>

          <Text style={greeting}>Hi {customerName},</Text>
          <Text style={paragraph}>
            Great news! Your order is ready and waiting for you. Head over to pick it up!
          </Text>

          {/* Order Details Box */}
          <Section style={orderBox}>
            <Text style={orderLabel}>Order Number</Text>
            <Text style={orderNumberStyle}>#{orderNumber}</Text>

            <Hr style={divider} />

            <Text style={orderLabel}>Pickup Location</Text>
            <Text style={locationNameStyle}>{locationName}</Text>
            <Text style={addressStyle}>{locationAddress}</Text>

            <Hr style={divider} />

            <Section style={instructionBox}>
              <Text style={instructionIcon}>📱</Text>
              <Text style={instructionText}>
                Show this email or your order number at the counter
              </Text>
            </Section>
          </Section>

          {/* Contact Section */}
          <Section style={contactSection}>
            <Text style={contactText}>
              Running late or have questions? Give us a call:
            </Text>
            <Link href={`tel:${locationPhone}`} style={phoneButton}>
              📞 {locationPhone}
            </Link>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Text style={footer}>
            Thank you for choosing The Catch!
          </Text>
          <Text style={footer}>
            Fresh Seafood, Served with Soul
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

const readyBadge = {
  textAlign: 'center' as const,
  padding: '32px',
  backgroundColor: '#2B7A9B',
  borderRadius: '12px',
  marginBottom: '24px',
};

const bellIcon = {
  fontSize: '48px',
  margin: '0 0 8px 0',
};

const readyTitle = {
  color: '#fff',
  fontSize: '28px',
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
  border: '2px solid #2B7A9B',
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

const orderNumberStyle = {
  fontSize: '32px',
  color: '#2B7A9B',
  fontWeight: 'bold',
  margin: '0',
};

const locationNameStyle = {
  fontSize: '18px',
  color: '#333',
  fontWeight: '600',
  margin: '0',
};

const addressStyle = {
  fontSize: '14px',
  color: '#666',
  margin: '4px 0 0 0',
};

const divider = {
  borderColor: '#e0e0e0',
  margin: '16px 0',
};

const instructionBox = {
  backgroundColor: '#fff9e6',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center' as const,
};

const instructionIcon = {
  fontSize: '24px',
  margin: '0 0 8px 0',
};

const instructionText = {
  fontSize: '14px',
  color: '#333',
  margin: '0',
  fontWeight: '500',
};

const contactSection = {
  textAlign: 'center' as const,
  marginBottom: '24px',
};

const contactText = {
  fontSize: '14px',
  color: '#666',
  marginBottom: '12px',
};

const phoneButton = {
  backgroundColor: '#fff',
  border: '2px solid #2B7A9B',
  borderRadius: '8px',
  color: '#2B7A9B',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const footer = {
  fontSize: '12px',
  color: '#888',
  textAlign: 'center' as const,
  marginTop: '8px',
};
