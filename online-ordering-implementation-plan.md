# The Catch - Online Ordering System Implementation Plan

## Executive Summary

This document outlines a comprehensive plan for implementing online ordering for The Catch restaurant locations. The system will integrate with existing Revel POS systems, accept payments via Stripe, and use Sanity CMS as the backend for order management.

---

## System Architecture Overview

```
Customer → Next.js Frontend → Stripe Payment → Sanity CMS → Revel POS API
                                    ↓
                            Order Stored in Sanity
                                    ↓
                        Location Kitchen Display
```

---

## Phase 1: Foundation (No External Dependencies)

### 1.1 Sanity Schema Development

**Order Document Schema:**
```typescript
{
  _type: 'order',
  orderNumber: string,           // Auto-generated (e.g., "ORD-20250122-001")
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled',

  // Customer Information
  customer: {
    name: string,
    email: string,
    phone: string,
    marketingOptIn: boolean
  },

  // Order Details
  orderType: 'pickup' | 'delivery' | 'dine-in',
  location: reference to Location document,

  // Items
  items: [
    {
      menuItem: reference to MenuItem,
      quantity: number,
      price: number,
      modifiers: [
        {
          name: string,
          option: string,
          priceDelta: number
        }
      ],
      specialInstructions: string
    }
  ],

  // Pricing
  subtotal: number,
  tax: number,
  tip: number,
  deliveryFee: number,
  total: number,

  // Fulfillment
  scheduledFor: datetime | 'asap',
  estimatedReady: datetime,

  // Payment
  paymentIntent: string,         // Stripe payment intent ID
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded',

  // Special Requests
  specialInstructions: text,

  // Delivery (if applicable)
  deliveryAddress: {
    street: string,
    city: string,
    state: string,
    zip: string,
    instructions: string
  },

  // Timestamps
  createdAt: datetime,
  updatedAt: datetime,
  confirmedAt: datetime,
  readyAt: datetime,
  completedAt: datetime,

  // Integration
  revelOrderId: string,          // Set when pushed to Revel
  revelSynced: boolean
}
```

**Cart Session Schema (Optional):**
```typescript
{
  _type: 'cartSession',
  sessionId: string,
  items: [...],                  // Same structure as order items
  location: reference,
  expiresAt: datetime,
  createdAt: datetime
}
```

### 1.2 Frontend Components

**Cart System:**
- `CartContext.tsx` - React context for cart state management
- `CartDrawer.tsx` - Slide-out cart display
- `CartItem.tsx` - Individual cart item with quantity controls
- `AddToCartButton.tsx` - Add item to cart with modifiers modal

**Ordering Flow:**
- `OrderTypeSelector.tsx` - Pickup/Delivery/Dine-in selection
- `LocationSelector.tsx` - Choose location (with geolocation)
- `TimeSelector.tsx` - ASAP or schedule for later
- `CheckoutForm.tsx` - Customer info, payment
- `OrderSummary.tsx` - Review before payment
- `OrderConfirmation.tsx` - Success page with order number
- `OrderTracking.tsx` - Track order status

**Menu Integration:**
- `MenuItemCard.tsx` - Already exists, add "Order Now" button
- `ModifierModal.tsx` - Select options/customizations
- `QuantitySelector.tsx` - Increment/decrement quantity

### 1.3 API Routes (Next.js App Router)

```
app/api/
  ├── orders/
  │   ├── create/route.ts          # Create order in Sanity
  │   ├── [id]/route.ts            # Get/update specific order
  │   ├── [id]/status/route.ts     # Update order status
  │   └── validate/route.ts        # Validate order before payment
  │
  ├── stripe/
  │   ├── create-payment-intent/route.ts
  │   ├── webhook/route.ts         # Handle Stripe webhooks
  │   └── refund/route.ts
  │
  ├── revel/
  │   ├── push-order/route.ts      # Send order to Revel
  │   ├── webhook/route.ts         # Receive Revel webhooks
  │   └── sync-menu/route.ts       # Sync menu from Revel
  │
  └── cart/
      ├── save/route.ts            # Save cart session
      └── restore/route.ts         # Restore cart from session
```

---

## Phase 2: Payment Integration (Stripe)

### 2.1 Stripe Setup

**Required Stripe Products:**
- Stripe Checkout or Stripe Elements
- Payment Intents API
- Webhooks for payment confirmation

**Environment Variables:**
```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 2.2 Payment Flow

1. **Customer Reviews Order** → Calculate total in frontend
2. **Create Payment Intent** → `POST /api/stripe/create-payment-intent`
   - Amount, currency, metadata (order details)
   - Return client secret to frontend
3. **Stripe Checkout** → Customer enters payment info
4. **Webhook Confirmation** → Stripe calls `/api/stripe/webhook`
   - Verify webhook signature
   - Update order payment status in Sanity
   - Trigger order confirmation email
5. **Order Submitted** → Create order in Sanity with `paymentStatus: 'paid'`

### 2.3 Stripe Components

```tsx
// app/checkout/page.tsx
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '@/components/checkout/CheckoutForm';

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState('');

  // Create payment intent on mount
  useEffect(() => {
    fetch('/api/stripe/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify({ amount: cartTotal })
    })
    .then(res => res.json())
    .then(data => setClientSecret(data.clientSecret));
  }, []);

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm />
    </Elements>
  );
}
```

### 2.4 Testing Strategy

- Use Stripe test mode initially
- Test cards: `4242 4242 4242 4242`
- Test failed payments: `4000 0000 0000 0002`
- Test webhooks with Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

---

## Phase 3: Revel POS Integration

### 3.1 Revel API Authentication

**Setup Required:**
1. Contact Revel to get API credentials
2. Store in environment variables:
   ```bash
   REVEL_API_KEY=...
   REVEL_API_SECRET=...
   REVEL_ESTABLISHMENT_ID=...
   ```
3. Implement Bearer token generation (refreshes every 24 hours)

**Token Management:**
```typescript
// lib/revel/auth.ts
let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getRevelToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  // Generate new token from Revel API
  const response = await fetch('https://api.revelsystems.com/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: process.env.REVEL_API_KEY,
      api_secret: process.env.REVEL_API_SECRET
    })
  });

  const { token, expires_in } = await response.json();

  cachedToken = {
    token,
    expiresAt: Date.now() + (expires_in * 1000)
  };

  return token;
}
```

### 3.2 Order Submission to Revel

**Order Format Conversion:**
```typescript
// lib/revel/orders.ts
export async function pushOrderToRevel(sanityOrder: Order) {
  const token = await getRevelToken();

  // Convert Sanity order to Revel's OrderAllInOne format
  const revelOrder = {
    establishment: process.env.REVEL_ESTABLISHMENT_ID,
    order_type: sanityOrder.orderType === 'pickup' ? 1 : 2, // Map to Revel types
    created_date: sanityOrder.createdAt,

    customer: {
      first_name: sanityOrder.customer.name.split(' ')[0],
      last_name: sanityOrder.customer.name.split(' ').slice(1).join(' '),
      email: sanityOrder.customer.email,
      phone: sanityOrder.customer.phone
    },

    items: sanityOrder.items.map(item => ({
      product_id: item.menuItem.revelProductId, // Need to store this in Sanity
      quantity: item.quantity,
      price: item.price,
      modifiers: item.modifiers.map(mod => ({
        modifier_id: mod.revelModifierId,
        option_id: mod.revelOptionId
      }))
    })),

    // Payment already processed via Stripe
    paid: true,
    payment_method: 'online',

    special_requests: sanityOrder.specialInstructions
  };

  const response = await fetch('https://api.revelsystems.com/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(revelOrder)
  });

  const { order_id } = await response.json();

  // Update Sanity order with Revel ID
  await sanityClient
    .patch(sanityOrder._id)
    .set({ revelOrderId: order_id, revelSynced: true })
    .commit();

  return order_id;
}
```

### 3.3 Revel Webhooks

**Setup Webhook Endpoints:**
1. Provide Revel with webhook URL: `https://yourdomain.com/api/revel/webhook`
2. Configure HMAC-SHA1 signature verification
3. Handle these events:
   - `order.updated` - Status changes (preparing, ready, etc.)
   - `menu.updated` - Menu changes to sync
   - `customer.created` - Customer loyalty data

**Webhook Handler:**
```typescript
// app/api/revel/webhook/route.ts
import crypto from 'crypto';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('X-Revel-Signature');

  // Verify HMAC signature
  const expectedSignature = crypto
    .createHmac('sha1', process.env.REVEL_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');

  if (signature !== expectedSignature) {
    return new Response('Invalid signature', { status: 401 });
  }

  const event = JSON.parse(body);

  switch (event.event_type) {
    case 'order.updated':
      await handleOrderUpdate(event.data);
      break;
    case 'menu.updated':
      await syncMenuFromRevel();
      break;
  }

  return new Response('OK', { status: 200 });
}

async function handleOrderUpdate(orderData: any) {
  // Find order by Revel ID
  const order = await sanityClient.fetch(
    `*[_type == "order" && revelOrderId == $revelId][0]`,
    { revelId: orderData.order_id }
  );

  // Update status in Sanity
  await sanityClient
    .patch(order._id)
    .set({
      status: mapRevelStatusToSanity(orderData.status),
      updatedAt: new Date().toISOString()
    })
    .commit();
}
```

### 3.4 Menu Synchronization

**Option A: Manual Sync**
- Admin triggers sync from Sanity Studio
- Pulls products, modifiers from Revel API
- Updates Sanity menu items with Revel IDs

**Option B: Webhook-Based Sync**
- Revel triggers `menu.updated` webhook
- System automatically syncs changes
- Requires careful conflict resolution

**Implementation:**
```typescript
// app/api/revel/sync-menu/route.ts
export async function POST(request: Request) {
  const token = await getRevelToken();

  // Fetch products from Revel
  const response = await fetch(
    `https://api.revelsystems.com/products?establishment=${process.env.REVEL_ESTABLISHMENT_ID}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );

  const revelProducts = await response.json();

  // Update Sanity menu items
  const transaction = sanityClient.transaction();

  for (const product of revelProducts) {
    const existingItem = await sanityClient.fetch(
      `*[_type == "menuItem" && revelProductId == $id][0]`,
      { id: product.id }
    );

    if (existingItem) {
      transaction.patch(existingItem._id, {
        set: {
          name: product.name,
          price: product.price,
          available: product.active,
          revelProductId: product.id
        }
      });
    }
  }

  await transaction.commit();

  return Response.json({ synced: revelProducts.length });
}
```

---

## Phase 4: Kitchen Display & Order Management

### 4.1 Kitchen Display System (KDS)

**Option A: Sanity Studio Plugin**
- Build custom Sanity Studio tool
- Real-time order feed
- Update order status
- Print tickets

**Option B: Dedicated Next.js App**
- `/kds` route protected by password
- Full-screen order display
- Auto-refresh with Sanity real-time subscriptions
- Sound notifications for new orders

**KDS Features:**
- Column layout: Pending → Preparing → Ready
- Drag-and-drop to update status
- Order details expandable
- Time since order placed
- Estimated ready time countdown
- Print order ticket button

**Implementation:**
```typescript
// app/kds/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { sanityClient } from '@/lib/sanity';

export default function KitchenDisplay() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    // Initial fetch
    const fetchOrders = async () => {
      const data = await sanityClient.fetch(
        `*[_type == "order" && status in ["confirmed", "preparing"]] | order(createdAt desc)`
      );
      setOrders(data);
    };
    fetchOrders();

    // Subscribe to real-time updates
    const subscription = sanityClient
      .listen(`*[_type == "order"]`)
      .subscribe(update => {
        if (update.result) {
          setOrders(prev => {
            const idx = prev.findIndex(o => o._id === update.result._id);
            if (idx >= 0) {
              const newOrders = [...prev];
              newOrders[idx] = update.result;
              return newOrders;
            }
            return [update.result, ...prev];
          });

          // Play sound for new orders
          if (update.transition === 'appear') {
            new Audio('/sounds/new-order.mp3').play();
          }
        }
      });

    return () => subscription.unsubscribe();
  }, []);

  const updateStatus = async (orderId: string, status: string) => {
    await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  };

  return (
    <div className="grid grid-cols-3 gap-4 p-6 h-screen bg-gray-100">
      <OrderColumn
        title="New Orders"
        orders={orders.filter(o => o.status === 'confirmed')}
        onUpdateStatus={updateStatus}
      />
      <OrderColumn
        title="Preparing"
        orders={orders.filter(o => o.status === 'preparing')}
        onUpdateStatus={updateStatus}
      />
      <OrderColumn
        title="Ready"
        orders={orders.filter(o => o.status === 'ready')}
        onUpdateStatus={updateStatus}
      />
    </div>
  );
}
```

### 4.2 Admin Dashboard (Sanity Studio)

**Custom Tool:**
```typescript
// sanity/structure/ordersTool.ts
export const ordersTool = {
  name: 'orders',
  title: 'Orders',
  icon: ShoppingCart,
  component: OrdersManager
};

// Components
function OrdersManager() {
  return (
    <div>
      <OrderFilters />
      <OrdersList />
      <OrderDetails />
    </div>
  );
}
```

**Features:**
- Filter by location, status, date range
- Search by order number, customer name
- View order details
- Update status
- Refund orders
- Print receipts
- Export to CSV
- Analytics dashboard

---

## Phase 5: Customer Experience Enhancements

### 5.1 Order Tracking

**Customer Portal:**
- `/orders/[orderNumber]` - Track order status
- Real-time updates via Sanity subscriptions
- SMS notifications (via Twilio)
- Email notifications (via SendGrid/Resend)

**Features:**
- Progress bar: Confirmed → Preparing → Ready → Completed
- Estimated ready time
- Location details with map
- Reorder button
- Order history (if logged in)

### 5.2 Customer Accounts (Optional)

**Guest Checkout:**
- Phone/email only
- Orders saved by email

**Full Accounts:**
- Save payment methods (Stripe Customer)
- Order history
- Saved addresses
- Favorite items
- Loyalty points integration

### 5.3 Notifications

**Email Notifications:**
- Order confirmation
- Order ready for pickup
- Order status updates

**SMS Notifications:**
- Via Twilio
- "Your order #1234 is ready for pickup!"
- Delivery tracking

**Push Notifications (Future):**
- Progressive Web App (PWA)
- Native app notifications

---

## Phase 6: Advanced Features

### 6.1 Delivery Integration

**Option A: Third-Party (DoorDash Drive, Uber Direct)**
- API integration for delivery requests
- Automatic driver assignment
- Real-time tracking

**Option B: In-House Delivery**
- Driver assignment interface
- Route optimization
- Delivery zones with fees

### 6.2 Loyalty Program

**Points System:**
- Earn points per dollar spent
- Redeem for discounts
- Birthday rewards
- Tier levels (Bronze, Silver, Gold)

**Implementation:**
- Store customer points in Sanity
- Award on order completion
- Redemption at checkout

### 6.3 Catering Orders

**Special Flow:**
- Minimum order amounts
- Lead time requirements (24-48 hours)
- Custom pricing
- Deposit payments
- Staff assignment

### 6.4 Group Orders

**Features:**
- Create order link to share
- Multiple people add items
- Split payment or single payer
- Deadline to submit items

### 6.5 Scheduled Orders

**Features:**
- Calendar picker for future dates
- Time slot selection
- Pre-order for events
- Recurring orders (weekly lunch, etc.)

---

## Technical Considerations

### 7.1 Performance Optimization

**Frontend:**
- Server-side rendering for menu pages
- Static generation where possible
- Image optimization (Next.js Image)
- Lazy loading for cart/modals
- Client-side caching with React Query

**Backend:**
- Edge functions for geo-location
- CDN for static assets
- Database indexing in Sanity
- Rate limiting on API routes

### 7.2 Security

**Payment Security:**
- Never store credit card numbers
- PCI compliance via Stripe
- HTTPS only
- Secure webhook verification

**Data Protection:**
- Environment variables for secrets
- API route authentication
- Input validation and sanitization
- CSRF protection

**Customer Data:**
- Minimal data collection
- GDPR compliance
- Privacy policy
- Data retention policies

### 7.3 Error Handling

**Payment Failures:**
- Retry logic
- Clear error messages
- Customer support contact
- Save cart state

**Order Submission Failures:**
- Queue orders if Revel API is down
- Retry mechanism
- Alert staff of failures
- Manual order entry fallback

**Network Issues:**
- Offline detection
- Graceful degradation
- Retry buttons
- Status indicators

### 7.4 Testing Strategy

**Unit Tests:**
- Order calculations (tax, fees, tips)
- Cart operations
- Validation logic

**Integration Tests:**
- Stripe payment flow
- Revel API calls
- Webhook handlers
- Email/SMS sending

**E2E Tests:**
- Full checkout flow
- Order status updates
- Admin operations

**Load Testing:**
- Simulate peak ordering times
- Concurrent orders
- Database performance

---

## Deployment & Infrastructure

### 8.1 Hosting

**Recommended: Vercel**
- Automatic Next.js optimization
- Edge functions
- Preview deployments
- Easy environment variables

**Alternative: AWS/GCP**
- More control
- Cost optimization at scale
- Lambda functions

### 8.2 Database

**Sanity (Primary):**
- Orders, customers, menu items
- Real-time capabilities
- Great CMS experience

**Redis (Optional):**
- Session storage
- Cart caching
- Rate limiting

### 8.3 Monitoring

**Error Tracking:**
- Sentry for error monitoring
- Slack alerts for critical errors

**Analytics:**
- Order volume tracking
- Revenue analytics
- Customer behavior
- Popular items

**Performance:**
- Vercel Analytics
- Core Web Vitals
- API response times

### 8.4 Backup & Recovery

**Sanity Backups:**
- Automatic daily backups
- Export orders to CSV daily
- Version history

**Disaster Recovery:**
- Manual order entry process
- Phone order fallback
- Printed menu with prices

---

## Implementation Timeline

### Week 1-2: Foundation
- ✅ Sanity order schema
- ✅ Cart system components
- ✅ API route structure
- ✅ Basic checkout UI

### Week 3-4: Payment Integration
- ✅ Stripe setup
- ✅ Payment flow implementation
- ✅ Webhook handlers
- ✅ Order confirmation

### Week 5-6: Testing & Refinement
- ✅ End-to-end testing
- ✅ Bug fixes
- ✅ UI polish
- ✅ Mobile optimization

### Week 7-8: Revel Integration (When Credentials Available)
- ⏳ API authentication
- ⏳ Order submission to Revel
- ⏳ Webhook setup
- ⏳ Menu synchronization

### Week 9-10: Kitchen Display
- ⏳ KDS interface
- ⏳ Real-time updates
- ⏳ Order management
- ⏳ Printing integration

### Week 11-12: Launch Preparation
- ⏳ Staff training
- ⏳ Soft launch (one location)
- ⏳ Customer feedback
- ⏳ Full rollout

---

## Cost Breakdown

### Development Costs
- **Developer Time:** 8-12 weeks
- **Design/UX:** Optional

### Monthly Operating Costs
- **Sanity CMS:** Free tier (up to 3 users), then $99-199/mo
- **Vercel Hosting:** Free tier, then $20/mo per team member
- **Stripe Processing:** 2.9% + $0.30 per transaction
- **Twilio SMS:** ~$0.0075 per SMS
- **Email Service:** Free-$20/mo (SendGrid/Resend)

### One-Time Costs
- **Revel API Access:** Contact Revel (may be included)
- **Domain & SSL:** ~$15/year
- **Sound/notification assets:** Free or ~$50

### Per-Location Hardware (Optional)
- **Kitchen Display Tablet:** $200-500
- **Receipt Printer:** $100-300
- **Tablet Stand:** $30-100

**Estimated Monthly Cost at Scale:**
- Platform fees: ~$150/mo
- Transaction fees: 3% of revenue
- SMS notifications: ~$50-200/mo
- Total: ~$200-500/mo + 3% of orders

---

## Alternative Approaches

### Approach A: Full Custom Build (This Plan)
**Pros:**
- Complete control
- Custom branding
- Own customer data
- Lower long-term costs

**Cons:**
- Higher upfront development
- Maintenance required
- Need developer expertise

### Approach B: White-Label Solutions
**Examples:** ChowNow, Toast Online Ordering, Square Online
**Pros:**
- Quick setup
- Proven systems
- Support included

**Cons:**
- Monthly fees ($100-300)
- Limited customization
- Commission fees (0-5%)
- Don't own customer data

### Approach C: Marketplace Only
**Examples:** DoorDash, Uber Eats, Grubhub
**Pros:**
- Instant customer base
- No development needed
- Marketing included

**Cons:**
- High commissions (15-30%)
- No direct customer relationship
- Brand dilution
- Price pressure

### Approach D: Hybrid
- Custom site for brand/loyalty
- Marketplace presence for discovery
- Best of both worlds

---

## Success Metrics

### Key Performance Indicators (KPIs)

**Revenue Metrics:**
- Average order value
- Orders per day/week
- Online vs. in-person ratio
- Revenue per location

**Customer Metrics:**
- New vs. returning customers
- Customer acquisition cost
- Lifetime value
- Order frequency

**Operational Metrics:**
- Order accuracy rate
- Average prep time
- Order error rate
- Customer support tickets

**Technical Metrics:**
- Page load time
- Checkout completion rate
- Payment success rate
- System uptime

---

## Risk Mitigation

### Technical Risks
- **Revel API downtime:** Queue orders, manual entry fallback
- **Payment processing issues:** Multiple payment methods, staff contact
- **High traffic:** Load testing, caching, CDN

### Business Risks
- **Low adoption:** Marketing plan, staff training, incentives
- **Order errors:** Double-check flow, confirmation screens
- **Customer confusion:** Clear UI, help documentation, support

### Compliance Risks
- **PCI compliance:** Use Stripe (PCI compliant)
- **Data privacy:** GDPR compliance, privacy policy
- **Health regulations:** Include allergen info, disclaimers

---

## Next Steps

### Immediate (Can Start Now)
1. ✅ Create Sanity order schema
2. ✅ Build cart system
3. ✅ Create checkout UI
4. ✅ Set up Stripe test account

### Short-term (1-2 Weeks)
1. Implement payment flow
2. Build order confirmation
3. Create basic admin dashboard
4. Test end-to-end flow

### Medium-term (Requires Revel Access)
1. Contact Revel for API credentials
2. Build Revel integration
3. Set up webhooks
4. Test order submission

### Long-term (After Launch)
1. Gather customer feedback
2. Implement loyalty program
3. Add advanced features
4. Scale to all locations

---

## Questions to Answer Before Starting

1. **Payment Processing:**
   - Do you have a Stripe account? If not, business or restaurant type?
   - Preferred payment methods? (Cards only, or Apple Pay, Google Pay too?)

2. **Revel Integration:**
   - Do you have Revel API access already?
   - Do all 7 locations use Revel?
   - Same Revel account/establishment for all?

3. **Order Types:**
   - Pickup only to start, or delivery too?
   - Dine-in ordering (scan QR code)?
   - Catering orders?

4. **Location-Specific:**
   - Different menus per location?
   - Different hours?
   - Different delivery zones?

5. **Customer Data:**
   - Require accounts or allow guest checkout?
   - Collect marketing consent?
   - Loyalty program from day one?

6. **Hardware:**
   - Do locations have dedicated tablets/computers?
   - Need to purchase kitchen display hardware?
   - Printer integration needed?

7. **Launch Strategy:**
   - Soft launch at one location first?
   - All locations at once?
   - Beta testing period?

---

## Conclusion

This plan provides a comprehensive roadmap for implementing online ordering at The Catch. The phased approach allows you to:

1. **Start immediately** with no external dependencies
2. **Integrate with Revel** when credentials are available
3. **Scale progressively** as you learn and grow
4. **Maintain full control** over the customer experience and data

The system is designed to be robust, scalable, and maintainable while providing an excellent experience for both customers and staff.

**Recommended Next Step:** Start with Phase 1 (Foundation) - build the cart system and order schema in Sanity. This gives you a working prototype to test and refine before adding payment and POS integration.
