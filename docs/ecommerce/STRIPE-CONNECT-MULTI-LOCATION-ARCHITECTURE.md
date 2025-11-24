# Stripe Connect Multi-Location Architecture

## Overview

This document details the Stripe Connect implementation for The Catch's 7 restaurant locations, ensuring each location's payments are properly routed to their respective Stripe accounts while maintaining a unified ordering system.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Stripe Connect Setup](#stripe-connect-setup)
3. [Sanity Backend Configuration](#sanity-backend-configuration)
4. [Payment Flow](#payment-flow)
5. [Cart Logic](#cart-logic)
6. [Implementation Guide](#implementation-guide)
7. [Testing Strategy](#testing-strategy)
8. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### The Problem

The Catch has 7 restaurant locations. Each location may need:
- Its own Stripe account (separate banking, separate tax reporting)
- Independent financial management
- Unified customer experience across all locations

### The Solution: Stripe Connect

**Stripe Connect** allows you to create a **Platform Account** (The Catch corporate) that manages multiple **Connected Accounts** (each restaurant location).

```
                    ┌─────────────────────────┐
                    │  The Catch Platform     │
                    │  (Main Stripe Account)  │
                    └───────────┬─────────────┘
                                │
                    ┌───────────┴───────────┐
                    │   Stripe Connect      │
                    │   Routes Payments     │
                    └───────────┬───────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
   ┌────▼─────┐         ┌──────▼──────┐         ┌─────▼─────┐
   │ Catch DFW│         │ Catch HTX   │   ...   │ Catch AUS │
   │ (acct_1) │         │ (acct_2)    │         │ (acct_7)  │
   └──────────┘         └─────────────┘         └───────────┘
```

### Key Benefits

1. **Single Integration**: One codebase, one API integration
2. **Automatic Routing**: Payments automatically go to correct location
3. **Unified Reporting**: View all transactions in platform dashboard
4. **Optional Platform Fees**: Take a % if desired (e.g., 2% for marketing)
5. **Easy Onboarding**: Add new locations without code changes
6. **Refund Management**: Programmatic refunds from any location

---

## Stripe Connect Setup

### Step 1: Create Platform Account

1. **Sign up for Stripe** (if you don't have an account)
   - Go to https://dashboard.stripe.com/register
   - Use The Catch corporate email/details
   - Complete business verification

2. **Enable Stripe Connect**
   - Dashboard → Settings → Connect
   - Fill out platform profile
   - Choose "Platform or Marketplace"

### Step 2: Choose Connected Account Type

Stripe offers three types of Connected Accounts:

| Type | Best For | Complexity | Dashboard Access |
|------|----------|------------|------------------|
| **Express** | Simple setup, Stripe handles onboarding | Low | Limited (via Express Dashboard) |
| **Standard** | Locations want full Stripe dashboard access | Medium | Full independent dashboard |
| **Custom** | Complete white-label control | High | None (you build everything) |

**Recommendation for The Catch: Express Accounts**

- Quick setup (~5 minutes per location)
- Stripe handles compliance and onboarding
- Each location gets a simplified dashboard
- You control the integration
- Easier for non-technical location managers

### Step 3: Create Connected Accounts for Each Location

You'll create 7 Connected Accounts (one per location). For each location:

#### Option A: Via Stripe Dashboard (Manual)

1. Dashboard → Connect → Accounts
2. Click "Add Account"
3. Fill in:
   - Business type: Individual or Company
   - Email: location manager's email
   - Country: United States
4. Copy the `acct_xxxxx` ID
5. Send onboarding link to location manager

#### Option B: Via API (Automated - Recommended)

Create a one-time setup script:

```typescript
// scripts/setup-stripe-locations.ts
import Stripe from 'stripe';
import { sanityClient } from '../lib/sanity';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

async function createConnectedAccounts() {
  // Fetch all locations from Sanity
  const locations = await sanityClient.fetch(`
    *[_type == "location"]{
      _id,
      name,
      email,
      address
    }
  `);

  for (const location of locations) {
    console.log(`Creating connected account for ${location.name}...`);

    // Create Express connected account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: location.email,
      business_type: 'company',
      company: {
        name: location.name,
        address: {
          line1: location.address.street,
          city: location.address.city,
          state: location.address.state,
          postal_code: location.address.zip,
          country: 'US',
        },
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      settings: {
        payouts: {
          schedule: {
            // Daily automatic payouts
            interval: 'daily',
          },
        },
      },
    });

    console.log(`✓ Created account ${account.id} for ${location.name}`);

    // Generate onboarding link
    const refreshUrl = process.env.STRIPE_REFRESH_URL || `https://thecatch.com/admin/stripe-connect/refresh`;
    const returnUrl = process.env.STRIPE_RETURN_URL || `https://thecatch.com/admin/stripe-connect/success`;
    
    if (!process.env.STRIPE_REFRESH_URL || !process.env.STRIPE_RETURN_URL) {
      console.warn('⚠️  STRIPE_REFRESH_URL or STRIPE_RETURN_URL not set in environment, using default values');
    }

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    // Update Sanity with Stripe account ID
    await sanityClient
      .patch(location._id)
      .set({
        stripeAccountId: account.id,
        stripeOnboardingLink: accountLink.url,
        stripeOnboardingComplete: false,
      })
      .commit();

    console.log(`✓ Updated Sanity for ${location.name}`);
    console.log(`  Onboarding link: ${accountLink.url}\n`);
  }

  console.log('✅ All connected accounts created!');
  console.log('Next: Send onboarding links to location managers');
}

createConnectedAccounts();
```

Run with:
```bash
npx tsx scripts/setup-stripe-locations.ts
```

### Step 4: Complete Onboarding for Each Location

Each location manager needs to:

1. Click their onboarding link
2. Provide:
   - Tax ID (EIN or SSN)
   - Bank account details
   - Verify email
   - Accept Stripe ToS
3. Process takes 5-10 minutes
4. Stripe verifies information (1-2 days)

### Step 5: Verify Accounts Are Ready

```typescript
// scripts/check-stripe-status.ts
async function checkAccountStatus(accountId: string) {
  const account = await stripe.accounts.retrieve(accountId);

  console.log(`Account: ${account.id}`);
  console.log(`Charges enabled: ${account.charges_enabled}`);
  console.log(`Payouts enabled: ${account.payouts_enabled}`);
  console.log(`Requirements: ${JSON.stringify(account.requirements)}`);
}
```

Look for:
- `charges_enabled: true` - Can accept payments
- `payouts_enabled: true` - Can receive money
- `requirements.currently_due: []` - No pending info needed

---

## Sanity Backend Configuration

### Schema Changes Required

You need to update two schemas:

1. **Location Schema** - Add Stripe Connect fields
2. **Order Schema** - Add location payment tracking

### 1. Update Location Schema

File: `sanity/schemas/location.ts`

```typescript
import { defineType, defineField } from 'sanity';
import { MapPinIcon } from '@sanity/icons';

export default defineType({
  name: 'location',
  title: 'Location',
  type: 'document',
  icon: MapPinIcon,
  fields: [
    // === EXISTING FIELDS ===
    defineField({
      name: 'name',
      title: 'Location Name',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'object',
      fields: [
        { name: 'street', type: 'string', title: 'Street Address' },
        { name: 'city', type: 'string', title: 'City' },
        { name: 'state', type: 'string', title: 'State' },
        { name: 'zip', type: 'string', title: 'ZIP Code' },
      ],
    }),
    defineField({
      name: 'phone',
      title: 'Phone Number',
      type: 'string',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      description: 'Location manager email (used for Stripe notifications)',
    }),
    defineField({
      name: 'hours',
      title: 'Operating Hours',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'day', type: 'string', title: 'Day' },
            { name: 'open', type: 'string', title: 'Open Time' },
            { name: 'close', type: 'string', title: 'Close Time' },
            { name: 'closed', type: 'boolean', title: 'Closed?' },
          ],
        },
      ],
    }),

    // === NEW STRIPE CONNECT FIELDS ===
    defineField({
      name: 'stripeAccountId',
      title: 'Stripe Connected Account ID',
      type: 'string',
      description: 'Stripe Connect account ID (e.g., acct_1234567890)',
      readOnly: true, // Set by script, not manually
      validation: Rule => Rule.regex(/^acct_[a-zA-Z0-9]+$/).warning('Must be a valid Stripe account ID'),
    }),
    defineField({
      name: 'stripeOnboardingComplete',
      title: 'Stripe Onboarding Complete',
      type: 'boolean',
      description: 'Has this location completed Stripe onboarding?',
      initialValue: false,
    }),
    defineField({
      name: 'stripeChargesEnabled',
      title: 'Stripe Charges Enabled',
      type: 'boolean',
      description: 'Can this location accept payments?',
      readOnly: true,
      initialValue: false,
    }),
    defineField({
      name: 'stripePayoutsEnabled',
      title: 'Stripe Payouts Enabled',
      type: 'boolean',
      description: 'Can this location receive payouts?',
      readOnly: true,
      initialValue: false,
    }),
    defineField({
      name: 'stripeOnboardingLink',
      title: 'Stripe Onboarding Link',
      type: 'url',
      description: 'Link for location manager to complete onboarding (expires after 24hrs)',
      readOnly: true,
    }),
    defineField({
      name: 'stripeDashboardLink',
      title: 'Stripe Express Dashboard Link',
      type: 'url',
      description: 'Link for location manager to view their Stripe dashboard',
      readOnly: true,
    }),

    // === REVEL POS FIELDS ===
    defineField({
      name: 'revelEstablishmentId',
      title: 'Revel Establishment ID',
      type: 'string',
      description: 'Revel POS establishment ID for this location',
    }),

    // === ONLINE ORDERING SETTINGS ===
    defineField({
      name: 'onlineOrderingEnabled',
      title: 'Online Ordering Enabled',
      type: 'boolean',
      description: 'Enable/disable online ordering for this location',
      initialValue: false,
    }),
    defineField({
      name: 'acceptingOrders',
      title: 'Currently Accepting Orders',
      type: 'boolean',
      description: 'Temporarily enable/disable orders (for busy times, etc)',
      initialValue: true,
    }),
    defineField({
      name: 'orderTypes',
      title: 'Supported Order Types',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Pickup', value: 'pickup' },
          { title: 'Delivery', value: 'delivery' },
          { title: 'Dine-In', value: 'dine-in' },
        ],
      },
      initialValue: ['pickup'],
    }),
    defineField({
      name: 'minimumOrderAmount',
      title: 'Minimum Order Amount',
      type: 'number',
      description: 'Minimum order total (in dollars)',
      initialValue: 0,
    }),
    defineField({
      name: 'deliveryFee',
      title: 'Delivery Fee',
      type: 'number',
      description: 'Flat delivery fee (in dollars)',
      initialValue: 0,
    }),
    defineField({
      name: 'taxRate',
      title: 'Tax Rate',
      type: 'number',
      description: 'Sales tax rate as decimal (e.g., 0.0825 for 8.25%)',
      validation: Rule => Rule.min(0).max(1),
    }),
  ],

  preview: {
    select: {
      title: 'name',
      subtitle: 'address.city',
      onlineEnabled: 'onlineOrderingEnabled',
      stripeEnabled: 'stripeChargesEnabled',
    },
    prepare({ title, subtitle, onlineEnabled, stripeEnabled }) {
      return {
        title,
        subtitle: `${subtitle} ${onlineEnabled ? '🛒' : ''}${stripeEnabled ? '💳' : ''}`,
      };
    },
  },
});
```

### 2. Update Order Schema

File: `sanity/schemas/order.ts`

```typescript
import { defineType, defineField } from 'sanity';
import { BasketIcon } from '@sanity/icons';

export default defineType({
  name: 'order',
  title: 'Order',
  type: 'document',
  icon: BasketIcon,
  fields: [
    // === ORDER IDENTIFICATION ===
    defineField({
      name: 'orderNumber',
      title: 'Order Number',
      type: 'string',
      description: 'Human-readable order number (e.g., ORD-20250123-001)',
      readOnly: true,
    }),
    defineField({
      name: 'status',
      title: 'Order Status',
      type: 'string',
      options: {
        list: [
          { title: '⏳ Pending Payment', value: 'pending' },
          { title: '✅ Confirmed', value: 'confirmed' },
          { title: '👨‍🍳 Preparing', value: 'preparing' },
          { title: '🔔 Ready for Pickup', value: 'ready' },
          { title: '✅ Completed', value: 'completed' },
          { title: '❌ Cancelled', value: 'cancelled' },
        ],
      },
      initialValue: 'pending',
      validation: Rule => Rule.required(),
    }),

    // === LOCATION & ROUTING ===
    defineField({
      name: 'location',
      title: 'Location',
      type: 'reference',
      to: [{ type: 'location' }],
      description: 'Which restaurant location this order is for',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'locationSnapshot',
      title: 'Location Snapshot',
      type: 'object',
      description: 'Snapshot of location details at time of order',
      fields: [
        { name: 'name', type: 'string', title: 'Name' },
        { name: 'address', type: 'string', title: 'Address' },
        { name: 'phone', type: 'string', title: 'Phone' },
      ],
    }),

    // === CUSTOMER INFORMATION ===
    defineField({
      name: 'customer',
      title: 'Customer',
      type: 'object',
      fields: [
        { name: 'name', type: 'string', title: 'Name' },
        { name: 'email', type: 'string', title: 'Email' },
        { name: 'phone', type: 'string', title: 'Phone' },
        { name: 'marketingOptIn', type: 'boolean', title: 'Marketing Opt-In' },
      ],
      validation: Rule => Rule.required(),
    }),

    // === ORDER DETAILS ===
    defineField({
      name: 'orderType',
      title: 'Order Type',
      type: 'string',
      options: {
        list: [
          { title: 'Pickup', value: 'pickup' },
          { title: 'Delivery', value: 'delivery' },
          { title: 'Dine-In', value: 'dine-in' },
        ],
      },
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'items',
      title: 'Order Items',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'menuItem',
              type: 'reference',
              to: [{ type: 'menuItem' }],
              title: 'Menu Item',
            },
            {
              name: 'menuItemSnapshot',
              type: 'object',
              title: 'Menu Item Snapshot',
              description: 'Snapshot at time of order',
              fields: [
                { name: 'name', type: 'string' },
                { name: 'description', type: 'text' },
                { name: 'basePrice', type: 'number' },
              ],
            },
            { name: 'quantity', type: 'number', title: 'Quantity' },
            { name: 'price', type: 'number', title: 'Price Per Item' },
            { name: 'totalPrice', type: 'number', title: 'Total Price' },
            {
              name: 'modifiers',
              type: 'array',
              title: 'Modifiers',
              of: [
                {
                  type: 'object',
                  fields: [
                    { name: 'name', type: 'string', title: 'Modifier Name' },
                    { name: 'option', type: 'string', title: 'Selected Option' },
                    { name: 'priceDelta', type: 'number', title: 'Price Change' },
                  ],
                },
              ],
            },
            { name: 'specialInstructions', type: 'text', title: 'Special Instructions' },
          ],
          preview: {
            select: {
              title: 'menuItemSnapshot.name',
              quantity: 'quantity',
              price: 'totalPrice',
            },
            prepare({ title, quantity, price }) {
              return {
                title: `${quantity}x ${title}`,
                subtitle: `$${price?.toFixed(2)}`,
              };
            },
          },
        },
      ],
      validation: Rule => Rule.required().min(1),
    }),

    // === PRICING ===
    defineField({
      name: 'subtotal',
      title: 'Subtotal',
      type: 'number',
      description: 'Sum of all items before tax/fees',
      validation: Rule => Rule.required().min(0),
    }),
    defineField({
      name: 'tax',
      title: 'Tax',
      type: 'number',
      description: 'Sales tax amount',
      validation: Rule => Rule.required().min(0),
    }),
    defineField({
      name: 'taxRate',
      title: 'Tax Rate',
      type: 'number',
      description: 'Tax rate used (snapshot)',
    }),
    defineField({
      name: 'tip',
      title: 'Tip',
      type: 'number',
      description: 'Tip amount',
      initialValue: 0,
    }),
    defineField({
      name: 'deliveryFee',
      title: 'Delivery Fee',
      type: 'number',
      description: 'Delivery fee (if applicable)',
      initialValue: 0,
    }),
    defineField({
      name: 'platformFee',
      title: 'Platform Fee',
      type: 'number',
      description: 'Fee kept by platform (if using Stripe Connect application_fee)',
      initialValue: 0,
    }),
    defineField({
      name: 'total',
      title: 'Total',
      type: 'number',
      description: 'Final total charged to customer',
      validation: Rule => Rule.required().min(0),
    }),
    defineField({
      name: 'locationPayout',
      title: 'Location Payout',
      type: 'number',
      description: 'Amount transferred to location (total - platformFee)',
    }),

    // === STRIPE PAYMENT INFO ===
    defineField({
      name: 'stripePaymentIntentId',
      title: 'Stripe Payment Intent ID',
      type: 'string',
      description: 'Stripe PaymentIntent ID (pi_xxxxx)',
      readOnly: true,
    }),
    defineField({
      name: 'stripeAccountId',
      title: 'Stripe Connected Account ID',
      type: 'string',
      description: 'Location\'s Stripe account that received payment',
      readOnly: true,
    }),
    defineField({
      name: 'stripeChargeId',
      title: 'Stripe Charge ID',
      type: 'string',
      description: 'Stripe Charge ID (ch_xxxxx)',
      readOnly: true,
    }),
    defineField({
      name: 'paymentStatus',
      title: 'Payment Status',
      type: 'string',
      options: {
        list: [
          { title: 'Pending', value: 'pending' },
          { title: 'Processing', value: 'processing' },
          { title: 'Paid', value: 'paid' },
          { title: 'Failed', value: 'failed' },
          { title: 'Refunded', value: 'refunded' },
          { title: 'Partially Refunded', value: 'partially_refunded' },
        ],
      },
      initialValue: 'pending',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'paymentMethod',
      title: 'Payment Method',
      type: 'object',
      description: 'Payment method details from Stripe',
      fields: [
        { name: 'brand', type: 'string', title: 'Card Brand' },
        { name: 'last4', type: 'string', title: 'Last 4 Digits' },
        { name: 'type', type: 'string', title: 'Type' },
      ],
    }),
    defineField({
      name: 'refundAmount',
      title: 'Refund Amount',
      type: 'number',
      description: 'Total amount refunded',
      initialValue: 0,
    }),
    defineField({
      name: 'refundReason',
      title: 'Refund Reason',
      type: 'text',
      description: 'Reason for refund',
    }),

    // === FULFILLMENT ===
    defineField({
      name: 'scheduledFor',
      title: 'Scheduled For',
      type: 'datetime',
      description: 'When customer wants order ready (null = ASAP)',
    }),
    defineField({
      name: 'estimatedReadyTime',
      title: 'Estimated Ready Time',
      type: 'datetime',
      description: 'When we estimate order will be ready',
    }),
    defineField({
      name: 'deliveryAddress',
      title: 'Delivery Address',
      type: 'object',
      hidden: ({ parent }) => parent?.orderType !== 'delivery',
      fields: [
        { name: 'street', type: 'string', title: 'Street' },
        { name: 'unit', type: 'string', title: 'Unit/Apt' },
        { name: 'city', type: 'string', title: 'City' },
        { name: 'state', type: 'string', title: 'State' },
        { name: 'zip', type: 'string', title: 'ZIP' },
        { name: 'instructions', type: 'text', title: 'Delivery Instructions' },
      ],
    }),
    defineField({
      name: 'specialInstructions',
      title: 'Special Instructions',
      type: 'text',
      description: 'Customer notes for entire order',
    }),

    // === REVEL POS INTEGRATION ===
    defineField({
      name: 'revelOrderId',
      title: 'Revel Order ID',
      type: 'string',
      description: 'Order ID in Revel POS system',
      readOnly: true,
    }),
    defineField({
      name: 'revelSynced',
      title: 'Synced to Revel',
      type: 'boolean',
      description: 'Has this order been sent to Revel POS?',
      initialValue: false,
    }),
    defineField({
      name: 'revelSyncedAt',
      title: 'Revel Sync Time',
      type: 'datetime',
      description: 'When order was synced to Revel',
    }),
    defineField({
      name: 'revelSyncError',
      title: 'Revel Sync Error',
      type: 'text',
      description: 'Error message if Revel sync failed',
    }),

    // === TIMESTAMPS ===
    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      readOnly: true,
    }),
    defineField({
      name: 'updatedAt',
      title: 'Updated At',
      type: 'datetime',
    }),
    defineField({
      name: 'confirmedAt',
      title: 'Confirmed At',
      type: 'datetime',
      description: 'When payment was confirmed',
    }),
    defineField({
      name: 'preparingAt',
      title: 'Started Preparing At',
      type: 'datetime',
    }),
    defineField({
      name: 'readyAt',
      title: 'Ready At',
      type: 'datetime',
    }),
    defineField({
      name: 'completedAt',
      title: 'Completed At',
      type: 'datetime',
    }),
    defineField({
      name: 'cancelledAt',
      title: 'Cancelled At',
      type: 'datetime',
    }),

    // === INTERNAL NOTES ===
    defineField({
      name: 'internalNotes',
      title: 'Internal Notes',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'note', type: 'text', title: 'Note' },
            { name: 'author', type: 'string', title: 'Author' },
            { name: 'timestamp', type: 'datetime', title: 'Time' },
          ],
        },
      ],
    }),
  ],

  preview: {
    select: {
      orderNumber: 'orderNumber',
      customerName: 'customer.name',
      total: 'total',
      status: 'status',
      locationName: 'location.name',
    },
    prepare({ orderNumber, customerName, total, status, locationName }) {
      const statusEmoji = {
        pending: '⏳',
        confirmed: '✅',
        preparing: '👨‍🍳',
        ready: '🔔',
        completed: '✅',
        cancelled: '❌',
      }[status] || '📝';

      return {
        title: `${orderNumber} - ${customerName}`,
        subtitle: `${statusEmoji} ${status} | $${total?.toFixed(2)} | ${locationName}`,
      };
    },
  },

  orderings: [
    {
      title: 'Created Date, New',
      name: 'createdAtDesc',
      by: [{ field: 'createdAt', direction: 'desc' }],
    },
    {
      title: 'Order Number',
      name: 'orderNumberAsc',
      by: [{ field: 'orderNumber', direction: 'asc' }],
    },
  ],
});
```

### 3. Add Schema to Index

File: `sanity/schemas/index.ts`

```typescript
import location from './location';
import order from './order';
import menuItem from './menuItem';
// ... other schemas

export const schemaTypes = [
  location,
  order,
  menuItem,
  // ... other schemas
];
```

### 4. Deploy Schema to Sanity

After updating the schemas:

```bash
# If using Sanity CLI
cd sanity
npm run build

# Deploy to Sanity Studio
npx sanity deploy

# Or if running locally
npm run dev
```

### 5. Migration Script (If You Have Existing Locations)

If you already have location documents in Sanity, create a migration script:

```typescript
// scripts/migrate-locations.ts
import { sanityClient } from '../lib/sanity';

async function migrateLocations() {
  const locations = await sanityClient.fetch(`*[_type == "location"]`);

  console.log(`Found ${locations.length} locations to migrate`);

  for (const location of locations) {
    console.log(`Migrating ${location.name}...`);

    await sanityClient
      .patch(location._id)
      .set({
        // Set defaults for new fields
        onlineOrderingEnabled: false,
        acceptingOrders: true,
        orderTypes: ['pickup'],
        minimumOrderAmount: 0,
        deliveryFee: 0,
        stripeOnboardingComplete: false,
        stripeChargesEnabled: false,
        stripePayoutsEnabled: false,
        // Adjust tax rate per location
        taxRate: 0.0825, // 8.25% - update per location
      })
      .commit();

    console.log(`✓ Migrated ${location.name}`);
  }

  console.log('✅ Migration complete!');
}

migrateLocations();
```

Run with:
```bash
npx tsx scripts/migrate-locations.ts
```

---

## Payment Flow

### Complete Payment Flow Diagram

```
┌─────────────┐
│  Customer   │
│   Browses   │
│    Menu     │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Selects Location    │ ◄── Cart locked to this location
│ (Catch DFW)         │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Adds Items to Cart  │
│ (All from DFW menu) │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Click "Checkout"    │
└──────┬──────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Frontend: Calculate Total         │
│ - Subtotal: $45.00               │
│ - Tax (8.25%): $3.71             │
│ - Tip: $9.00                     │
│ - Total: $57.71                  │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ POST /api/stripe/payment-intent  │
│ Body: {                          │
│   locationId: "loc_dfw_123",     │
│   amount: 5771, // cents         │
│   cartItems: [...],              │
│   tip: 900                       │
│ }                                │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Backend: Fetch Location          │
│ - Get stripeAccountId from Sanity│
│ - Get taxRate, fees              │
│ - Validate location is active    │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Backend: Create Payment Intent   │
│                                  │
│ stripe.paymentIntents.create({   │
│   amount: 5771,                  │
│   currency: 'usd',               │
│   transfer_data: {               │
│     destination: 'acct_DFW123'   │
│   },                             │
│   metadata: {                    │
│     locationId: 'loc_dfw_123',   │
│     orderType: 'pickup'          │
│   }                              │
│ })                               │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Return clientSecret to Frontend  │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Frontend: Stripe Elements        │
│ Customer enters card info        │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Customer clicks "Pay $57.71"     │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Stripe Processes Payment         │
│ - Charges customer card          │
│ - Transfers to acct_DFW123       │
│ - Triggers webhook               │
└──────┬───────────────────────────┘
       │
       ├─────────────────────┬─────────────────────┐
       ▼                     ▼                     ▼
┌──────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   Webhook    │   │    Customer     │   │  Platform Gets  │
│  Confirms    │   │  Gets Charged   │   │  (Optional Fee) │
│  Payment     │   │    $57.71       │   │                 │
└──────┬───────┘   └─────────────────┘   └─────────────────┘
       │                                   ┌─────────────────┐
       │                                   │  Location Gets  │
       │                                   │     $57.71      │
       │                                   │  (or minus fee) │
       │                                   └─────────────────┘
       ▼
┌──────────────────────────────────┐
│ POST /api/stripe/webhook         │
│ Event: payment_intent.succeeded  │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Create Order in Sanity           │
│ - paymentStatus: 'paid'          │
│ - stripePaymentIntentId          │
│ - stripeAccountId: acct_DFW123   │
│ - location: ref to DFW           │
│ - status: 'confirmed'            │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Push Order to Revel POS          │
│ (DFW's Revel establishment)      │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Send Confirmation Email          │
│ Display Order Tracking Page      │
└──────────────────────────────────┘
```

### Key Points in Flow

1. **Cart is location-locked** - Once first item is added, cart belongs to that location
2. **Payment Intent uses `transfer_data`** - Automatically routes money to location's account
3. **Webhook creates order** - Order only created after payment succeeds
4. **Order stored with location reference** - Links order to specific location & Stripe account
5. **Revel receives order** - Sent to correct establishment ID

---

## Cart Logic

### Cart State Management

File: `lib/contexts/CartContext.tsx`

```typescript
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Location } from '@/types/location';
import type { MenuItem } from '@/types/menuItem';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  price: number;
  modifiers: Array<{
    name: string;
    option: string;
    priceDelta: number;
  }>;
  specialInstructions?: string;
}

interface Cart {
  location: Location | null;
  locationId: string | null;
  items: CartItem[];
  subtotal: number;
  tax: number;
  tip: number;
  deliveryFee: number;
  total: number;
}

interface CartContextType {
  cart: Cart;
  addToCart: (item: CartItem, location: Location) => void;
  removeFromCart: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  setTip: (amount: number) => void;
  clearCart: () => void;
  isLocationLocked: boolean;
  canAddFromLocation: (locationId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>({
    location: null,
    locationId: null,
    items: [],
    subtotal: 0,
    tax: 0,
    tip: 0,
    deliveryFee: 0,
    total: 0,
  });

  // Calculate totals whenever cart changes
  useEffect(() => {
    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const taxRate = cart.location?.taxRate || 0;
    const tax = subtotal * taxRate;
    const total = subtotal + tax + cart.tip + cart.deliveryFee;

    // Only update if values actually changed to prevent infinite loop
    if (cart.subtotal !== subtotal || cart.tax !== tax || cart.total !== total) {
      setCart((prev) => ({
        ...prev,
        subtotal,
        tax,
        total,
      }));
    }
  }, [cart.items, cart.tip, cart.deliveryFee, cart.location]);

  // Persist cart to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart]);

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (e) {
          console.error('Failed to parse saved cart:', e);
        }
      }
    }
  }, []);

  const addToCart = (item: CartItem, location: Location) => {
    setCart((prev) => {
      // If cart is empty or same location, add item
      if (!prev.locationId || prev.locationId === location._id) {
        return {
          ...prev,
          location,
          locationId: location._id,
          items: [...prev.items, item],
        };
      }

      // Different location - this should be prevented by UI, but handle gracefully
      console.warn('Attempted to add item from different location');
      return prev;
    });
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => {
      const newItems = prev.items.filter((_, i) => i !== index);

      // If cart is now empty, clear location lock
      if (newItems.length === 0) {
        return {
          ...prev,
          items: newItems,
          location: null,
          locationId: null,
        };
      }

      return {
        ...prev,
        items: newItems,
      };
    });
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }

    setCart((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, quantity } : item)),
    }));
  };

  const setTip = (amount: number) => {
    setCart((prev) => ({ ...prev, tip: amount }));
  };

  const clearCart = () => {
    setCart({
      location: null,
      locationId: null,
      items: [],
      subtotal: 0,
      tax: 0,
      tip: 0,
      deliveryFee: 0,
      total: 0,
    });
  };

  const isLocationLocked = cart.locationId !== null;

  const canAddFromLocation = (locationId: string) => {
    return !cart.locationId || cart.locationId === locationId;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        setTip,
        clearCart,
        isLocationLocked,
        canAddFromLocation,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
```

### Location Lock UI Component

File: `components/cart/LocationSwitchModal.tsx`

```typescript
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import type { Location } from '@/types/location';

interface LocationSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: Location;
  newLocation: Location;
  onConfirm: () => void;
}

export function LocationSwitchModal({
  isOpen,
  onClose,
  currentLocation,
  newLocation,
  onConfirm,
}: LocationSwitchModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Switch Location?
          </DialogTitle>
          <DialogDescription className="space-y-4 pt-4">
            <p>
              Your cart contains items from <strong>{currentLocation.name}</strong>.
            </p>
            <p>
              Switching to <strong>{newLocation.name}</strong> will clear your current cart.
            </p>
            <p className="text-sm text-muted-foreground">
              You can only order from one location at a time.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm} variant="default">
            Switch to {newLocation.name}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Add to Cart with Location Check

File: `components/menu/AddToCartButton.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/contexts/CartContext';
import { LocationSwitchModal } from '@/components/cart/LocationSwitchModal';
import type { MenuItem } from '@/types/menuItem';
import type { Location } from '@/types/location';
import { ShoppingCart } from 'lucide-react';

interface AddToCartButtonProps {
  menuItem: MenuItem;
  location: Location;
}

export function AddToCartButton({ menuItem, location }: AddToCartButtonProps) {
  const { cart, addToCart, clearCart, canAddFromLocation } = useCart();
  const [showLocationModal, setShowLocationModal] = useState(false);

  const handleAddToCart = () => {
    // Check if we can add from this location
    if (!canAddFromLocation(location._id)) {
      // Show modal to confirm location switch
      setShowLocationModal(true);
      return;
    }

    // Add to cart
    addToCart(
      {
        menuItem,
        quantity: 1,
        price: menuItem.price,
        modifiers: [],
      },
      location
    );
  };

  const handleConfirmSwitch = () => {
    clearCart();
    addToCart(
      {
        menuItem,
        quantity: 1,
        price: menuItem.price,
        modifiers: [],
      },
      location
    );
    setShowLocationModal(false);
  };

  return (
    <>
      <Button onClick={handleAddToCart} size="sm">
        <ShoppingCart className="h-4 w-4 mr-2" />
        Add to Cart
      </Button>

      {cart.location && (
        <LocationSwitchModal
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          currentLocation={cart.location}
          newLocation={location}
          onConfirm={handleConfirmSwitch}
        />
      )}
    </>
  );
}
```

---

## Implementation Guide

### Phase 1: Sanity Setup (Day 1)

✅ **Tasks:**
1. Update `location.ts` schema with Stripe fields
2. Update `order.ts` schema with payment tracking
3. Deploy schemas to Sanity Studio
4. Run migration script if needed

✅ **Verification:**
- Open Sanity Studio
- Navigate to Locations
- See new Stripe fields
- Navigate to Orders (create test order)
- See new payment fields

### Phase 2: Stripe Connect Setup (Day 2-3)

✅ **Tasks:**
1. Create Stripe platform account
2. Enable Stripe Connect in dashboard
3. Run `setup-stripe-locations.ts` script
4. Send onboarding links to location managers
5. Complete onboarding for at least one test location

✅ **Verification:**
- Check Stripe dashboard → Connect → Accounts
- See all 7 connected accounts
- At least one has `charges_enabled: true`
- Run `check-stripe-status.ts` to verify

### Phase 3: Cart Implementation (Day 4-5)

✅ **Tasks:**
1. Create `CartContext.tsx`
2. Wrap app with `<CartProvider>`
3. Implement location-locking logic
4. Create `LocationSwitchModal`
5. Update `AddToCartButton` component

✅ **Verification:**
- Add item from Location A → works
- Try to add item from Location B → modal appears
- Confirm switch → cart clears, new item added
- Close modal → cart stays with Location A

### Phase 4: Payment API (Day 6-7)

✅ **Tasks:**
1. Install Stripe SDK: `npm install stripe @stripe/stripe-js @stripe/react-stripe-js`
2. Create `/api/stripe/create-payment-intent/route.ts`
3. Implement Stripe Connect payment intent creation
4. Add environment variables
5. Test with Stripe test cards

✅ **Verification:**
- Create payment intent
- Check Stripe dashboard
- Verify payment intent has `transfer_data.destination`
- Verify destination is correct connected account

### Phase 5: Checkout Flow (Day 8-10)

✅ **Tasks:**
1. Create checkout page
2. Integrate Stripe Elements
3. Handle payment confirmation
4. Create order in Sanity after payment
5. Implement webhook handler

✅ **Verification:**
- Complete full checkout
- Payment succeeds
- Order created in Sanity
- Webhook fires
- Order status updated

---

## Testing Strategy

### Test Scenarios

#### 1. Location Lock Testing

| Scenario | Expected Behavior |
|----------|------------------|
| Empty cart + add item | Cart locks to that location |
| Add 2nd item from same location | Item added successfully |
| Add item from different location | Modal appears with warning |
| Confirm location switch | Cart clears, new item added |
| Cancel location switch | Cart unchanged, modal closes |
| Remove all items | Location lock released |

#### 2. Payment Routing Testing

| Location | Stripe Account | Test Amount | Expected Result |
|----------|---------------|-------------|-----------------|
| Catch DFW | acct_DFW123 | $50.00 | Payment to acct_DFW123 |
| Catch HTX | acct_HTX456 | $75.50 | Payment to acct_HTX456 |
| Catch AUS | acct_AUS789 | $30.25 | Payment to acct_AUS789 |

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

#### 3. Webhook Testing

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Test webhook
stripe trigger payment_intent.succeeded
```

#### 4. Multi-Location Testing

```typescript
// Test script: scripts/test-multi-location.ts
import { sanityClient } from '../lib/sanity';

async function testMultiLocation() {
  const locations = await sanityClient.fetch(`*[_type == "location"]{
    _id,
    name,
    stripeAccountId,
    stripeChargesEnabled,
    onlineOrderingEnabled
  }`);

  console.log('Location Status:');
  console.log('─'.repeat(80));

  for (const loc of locations) {
    const status =
      loc.stripeChargesEnabled && loc.onlineOrderingEnabled
        ? '✅ READY'
        : '⚠️  NOT READY';

    console.log(`${status} ${loc.name}`);
    console.log(`  Stripe: ${loc.stripeAccountId || '❌ Not set'}`);
    console.log(`  Charges: ${loc.stripeChargesEnabled ? '✅' : '❌'}`);
    console.log(`  Online Orders: ${loc.onlineOrderingEnabled ? '✅' : '❌'}`);
    console.log('');
  }
}

testMultiLocation();
```

---

## Troubleshooting

### Common Issues

#### Issue: "Account does not have charges enabled"

**Cause:** Connected account hasn't completed onboarding

**Solution:**
1. Check account status:
```bash
curl https://api.stripe.com/v1/accounts/acct_xxxxx \
  -u sk_test_xxxxx:
```

2. Look at `requirements.currently_due`
3. Regenerate onboarding link:
```typescript
const link = await stripe.accountLinks.create({
  account: 'acct_xxxxx',
  refresh_url: 'https://thecatch.com/admin/stripe-refresh',
  return_url: 'https://thecatch.com/admin/stripe-success',
  type: 'account_onboarding',
});
```

4. Send link to location manager

#### Issue: Payment goes to platform, not location

**Cause:** Missing `transfer_data` or `on_behalf_of`

**Solution:**
```typescript
// Correct:
await stripe.paymentIntents.create({
  amount: 5000,
  currency: 'usd',
  transfer_data: {
    destination: 'acct_location123',
  },
});

// Wrong (money stays in platform):
await stripe.paymentIntents.create({
  amount: 5000,
  currency: 'usd',
  // Missing transfer_data!
});
```

#### Issue: Cart not persisting between pages

**Cause:** CartProvider not wrapping app

**Solution:**
```typescript
// app/layout.tsx
import { CartProvider } from '@/lib/contexts/CartContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
```

#### Issue: Tax rate incorrect

**Cause:** Tax rate not stored in location or wrong decimal

**Solution:**
```typescript
// Correct: 8.25% = 0.0825
taxRate: 0.0825

// Wrong:
taxRate: 8.25  // This would be 825% tax!
```

Update in Sanity Studio:
1. Go to Locations
2. Find location
3. Set "Tax Rate" to `0.0825` (for 8.25%)

#### Issue: Webhook signature verification fails

**Cause:** Wrong webhook secret or event not verified

**Solution:**
```typescript
// app/api/stripe/webhook/route.ts
export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Webhook error', { status: 400 });
  }

  // Process event...
}
```

Make sure:
- `STRIPE_WEBHOOK_SECRET` is set correctly
- Using `request.text()` NOT `request.json()`
- Verifying before processing

---

## Security Checklist

### Environment Variables

```bash
# .env.local
# Platform account keys
STRIPE_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Sanity
SANITY_PROJECT_ID=xxxxx
SANITY_DATASET=production
SANITY_API_TOKEN=skxxxxx

# Never commit these!
```

### API Route Security

```typescript
// app/api/stripe/create-payment-intent/route.ts
export async function POST(request: Request) {
  try {
    const { locationId, amount } = await request.json();

    // 1. Validate inputs
    if (!locationId || !amount || amount <= 0) {
      return Response.json({ error: 'Invalid input' }, { status: 400 });
    }

    // 2. Verify location exists and is active
    const location = await sanityClient.fetch(
      `*[_type == "location" && _id == $id && onlineOrderingEnabled == true][0]`,
      { id: locationId }
    );

    if (!location) {
      return Response.json({ error: 'Location not found' }, { status: 404 });
    }

    // 3. Verify Stripe account is ready
    if (!location.stripeAccountId || !location.stripeChargesEnabled) {
      return Response.json({ error: 'Location not ready for payments' }, { status: 400 });
    }

    // 4. Recalculate total on server (never trust client)
    const serverTotal = calculateOrderTotal(cartItems, location);
    if (Math.abs(serverTotal - amount) > 1) {
      // Allow 1 cent difference for rounding
      return Response.json({ error: 'Amount mismatch' }, { status: 400 });
    }

    // 5. Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      transfer_data: {
        destination: location.stripeAccountId,
      },
      metadata: {
        locationId: location._id,
        locationName: location.name,
      },
    });

    return Response.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Payment intent creation failed:', error);
    return Response.json({ error: 'Payment failed' }, { status: 500 });
  }
}
```

### Never Store Card Details

**CORRECT:**
- Use Stripe Elements (Stripe hosts card input)
- Use Payment Intents (Stripe processes payment)
- Store only: `paymentIntentId`, `last4`, `brand`

**WRONG:**
- Never store full card numbers
- Never store CVV
- Never store raw card data in any form

---

## Monitoring & Analytics

### Key Metrics to Track

```typescript
// Track in Sanity or analytics platform
interface Metrics {
  // Revenue
  dailyRevenue: number;
  revenueByLocation: Record<string, number>;
  averageOrderValue: number;

  // Orders
  ordersPerDay: number;
  ordersPerLocation: Record<string, number>;
  ordersByType: { pickup: number; delivery: number; dineIn: number };

  // Performance
  checkoutCompletionRate: number; // Started checkout / completed
  paymentSuccessRate: number; // Attempted / succeeded
  averageOrderPrepTime: number; // minutes

  // Errors
  paymentFailures: number;
  revelSyncFailures: number;
  webhookFailures: number;
}
```

### Sanity Query for Daily Report

```typescript
// Get today's orders by location
const query = `{
  "summary": {
    "totalOrders": count(*[_type == "order" && createdAt > $today]),
    "totalRevenue": sum(*[_type == "order" && createdAt > $today && paymentStatus == "paid"].total),
    "averageOrder": avg(*[_type == "order" && createdAt > $today && paymentStatus == "paid"].total)
  },
  "byLocation": *[_type == "location"]{
    name,
    "orders": count(*[_type == "order" && references(^._id) && createdAt > $today]),
    "revenue": sum(*[_type == "order" && references(^._id) && createdAt > $today && paymentStatus == "paid"].total)
  }
}`;

const today = new Date().toISOString().split('T')[0];
const report = await sanityClient.fetch(query, { today });
```

---

## Next Steps

### Immediate (Day 1-3)
- [ ] Update Sanity schemas
- [ ] Deploy to Sanity Studio
- [ ] Create Stripe platform account
- [ ] Run location setup script
- [ ] Complete onboarding for 1 test location

### Short-term (Week 1-2)
- [ ] Implement CartContext
- [ ] Build checkout flow
- [ ] Create payment API routes
- [ ] Set up webhook handler
- [ ] Test end-to-end with test location

### Medium-term (Week 3-4)
- [ ] Complete onboarding for all 7 locations
- [ ] Test each location's payment routing
- [ ] Implement order management dashboard
- [ ] Add Revel POS integration
- [ ] Soft launch at 1 location

### Long-term (Month 2+)
- [ ] Monitor metrics and fix issues
- [ ] Roll out to all locations
- [ ] Implement loyalty program
- [ ] Add delivery integration
- [ ] Build mobile app

---

## Resources

### Documentation
- [Stripe Connect Docs](https://stripe.com/docs/connect)
- [Payment Intents API](https://stripe.com/docs/payments/payment-intents)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Sanity Schema Types](https://www.sanity.io/docs/schema-types)

### Tools
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Sanity Studio](https://www.sanity.io/studio)

### Support
- Stripe Support: support@stripe.com
- Sanity Support: support@sanity.io
- Revel Support: support@revelsystems.com

---

## Conclusion

This Stripe Connect multi-location architecture provides:

✅ **Unified Experience** - One ordering system for all locations
✅ **Automatic Routing** - Payments go to correct location
✅ **Financial Independence** - Each location manages own account
✅ **Easy Scaling** - Add new locations without code changes
✅ **Full Control** - Own your customer data and experience

The location-locked cart ensures customers only order from one location at a time, simplifying fulfillment and payment routing. With proper Sanity schema configuration, all order and payment data is tracked for reporting and analytics.

**Ready to implement?** Start with Phase 1 (Sanity setup) and work through each phase sequentially. Test thoroughly at each phase before moving to the next.
