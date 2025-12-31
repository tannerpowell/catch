# Order Tracking & Customer Portal

## Executive Summary

A complete customer-facing order management system for The Catch, enabling real-time order tracking, account management, order history, one-click reorder, and multi-channel notifications.

---

## Feature Overview

### 1. Real-Time Order Tracking

**Route:** `/orders/[orderNumber]`

Customers can track their order status in real-time without needing an account.

| Capability | Description |
|------------|-------------|
| Live status updates | Automatic polling every 30 seconds |
| Visual progress bar | Shows order progression through stages |
| Timeline view | Timestamps for each status change |
| ETA display | Estimated ready time from kitchen |
| Order details | Full item list with modifiers and pricing |

**Order Statuses:**
- `pending` → Order received
- `confirmed` → Kitchen acknowledged
- `preparing` → Actively being prepared
- `ready` → Ready for pickup
- `completed` → Order fulfilled
- `cancelled` → Order cancelled

**Smart Polling:**
- Pauses when browser tab is hidden (saves resources)
- Stops when order reaches terminal state (ready/completed/cancelled)
- Configurable interval based on order age

---

### 2. Customer Accounts (Clerk Authentication)

**Routes:** `/sign-in`, `/sign-up`, `/account/*`

Secure authentication with Clerk, designed for future loyalty program integration.

| Capability | Description |
|------------|-------------|
| Email/password auth | Standard secure authentication |
| Social login ready | Clerk supports Google, Apple, etc. |
| Protected routes | Middleware-based route protection |
| Conditional loading | Works without API keys in development |

**Account Navigation:**
- Header: User icon button (desktop + mobile)
- Links to `/account` when signed in
- Links to `/sign-in` when signed out

---

### 3. Order History

**Route:** `/account/orders`

View complete order history with filtering and pagination.

| Capability | Description |
|------------|-------------|
| Paginated list | 10 orders per page |
| Tab filtering | All / Active / Completed |
| Order summaries | Location, items, total, status |
| Quick actions | View details, reorder |
| Status badges | Color-coded order status |

**Each Order Card Shows:**
- Order number and date
- Location name
- Item preview (first 3 items)
- Order total
- Current status
- Reorder button

---

### 4. One-Click Reorder

**Route:** `/api/reorder`

Quickly add previous order items to cart.

| Capability | Description |
|------------|-------------|
| Availability check | Verifies items still on menu |
| Current pricing | Uses today's prices, not historical |
| Location awareness | Checks item availability at selected location |
| Partial reorder | Select which items to add |
| Unavailable warnings | Shows which items can't be reordered |

**Reorder Flow:**
1. Click "Reorder" on any past order
2. Modal shows available items (pre-selected)
3. Unavailable items shown with explanation
4. Confirm to add selected items to cart
5. Continue to checkout or keep shopping

---

### 5. Notification Preferences

**Route:** `/account/settings`

Control how and when to receive order updates.

| Channel | Notifications |
|---------|--------------|
| **SMS** | Order confirmed, Preparing, Ready for pickup |
| **Email** | Order confirmation, Ready for pickup |

**Preference Categories:**
- Order confirmations (SMS/Email)
- Order ready alerts (SMS/Email)
- Promotional updates (SMS/Email) - future use

---

### 6. SMS Notifications (Twilio)

**Integration:** `lib/notifications/twilio.ts`

Automated text messages at key order milestones.

| Trigger | Message Example |
|---------|-----------------|
| Order Confirmed | "Your order #1234 is confirmed! Estimated ready time: 2:30 PM. Track: [link]" |
| Preparing | "Great news! The kitchen has started preparing your order #1234." |
| Ready | "Your order #1234 is READY! Pick up at The Catch - Arlington." |

---

### 7. Email Notifications (Resend)

**Integration:** `lib/notifications/resend.ts`

Beautifully formatted HTML emails using React Email.

| Template | Contents |
|----------|----------|
| Order Confirmation | Order details, items, location, ETA |
| Order Ready | Pickup instructions, location address |

**Email Features:**
- Responsive HTML design
- Brand-consistent styling
- Direct links to order tracking
- Location map/address details

---

## Technical Architecture

### New Files Created

```
Authentication:
├── middleware.ts                           # Clerk route protection
├── app/(auth)/sign-in/[[...sign-in]]/page.tsx
└── app/(auth)/sign-up/[[...sign-up]]/page.tsx

Order Tracking:
├── app/orders/[orderNumber]/
│   ├── page.tsx                           # Main tracking page
│   ├── loading.tsx                        # Loading skeleton
│   └── not-found.tsx                      # 404 handling
├── app/api/orders/[orderNumber]/route.ts  # Public tracking API
└── components/order-tracking/
    ├── OrderStatusCard.tsx                # Status + progress bar
    ├── OrderTimeline.tsx                  # Visual timeline
    ├── OrderItemsList.tsx                 # Order items display
    ├── OrderPolling.tsx                   # Real-time polling hook
    └── index.ts

Account Portal:
├── app/account/
│   ├── layout.tsx                         # Protected layout
│   ├── page.tsx                           # Dashboard redirect
│   ├── orders/
│   │   ├── page.tsx                       # Order history
│   │   └── loading.tsx
│   └── settings/page.tsx                  # Notification preferences
├── app/api/orders/history/route.ts        # Order history API
├── app/api/reorder/route.ts               # Reorder API
└── components/account/
    ├── AccountSidebar.tsx                 # Navigation sidebar
    ├── OrderHistoryCard.tsx               # Order summary card
    ├── OrderHistoryList.tsx               # Tabbed list + pagination
    ├── ReorderModal.tsx                   # Reorder item selector
    └── NotificationSettings.tsx           # SMS/Email toggles

Notifications:
├── lib/notifications/
│   ├── index.ts                           # Exports
│   ├── twilio.ts                          # SMS sending
│   └── resend.ts                          # Email sending
├── app/api/notifications/
│   ├── send/route.ts                      # Trigger notifications
│   └── preferences/route.ts               # Get/set preferences
└── emails/
    ├── OrderConfirmation.tsx              # Confirmation template
    └── OrderReady.tsx                     # Ready template

UI Components (shadcn/ui):
└── components/ui/
    ├── button.tsx
    ├── card.tsx
    ├── badge.tsx
    ├── progress.tsx
    ├── separator.tsx
    ├── skeleton.tsx
    ├── alert.tsx
    └── tabs.tsx
```

### Modified Files

| File | Changes |
|------|---------|
| `app/globals.css` | Added shadcn CSS variables with ocean blue theme |
| `app/providers.tsx` | Wrapped with ClerkProvider (conditional) |
| `app/order-confirmation/page.tsx` | Added "Track Order" link |
| `components/catch/HeaderSimple.tsx` | Added account button + mobile menu link |
| `app/styles/catch-base.css` | Added `.nav-account-button` styles |
| `lib/contexts/CartContext.tsx` | Added `addMultipleToCart()` for reorder |
| `tsconfig.json` | Added `@/emails/*` path alias |
| `.env.example` | Added Clerk, Twilio, Resend variables |

---

## Environment Variables

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/account
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/account

# Twilio SMS
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Resend Email
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=orders@thecatchseafood.com

# Public URLs
NEXT_PUBLIC_BASE_URL=https://thecatchseafood.com
```

---

## GROQ Queries

### Order Tracking
```groq
*[_type == "order" && orderNumber == $orderNumber][0] {
  orderNumber, status, orderType,
  "customer": {
    "name": customer.name,
    "maskedPhone": "***-***-" + customer.phone[-4..]
  },
  "location": locationSnapshot { name, address, phone },
  items[] {
    "name": menuItemSnapshot.name,
    quantity, price,
    modifiers[] { name, option }
  },
  subtotal, tax, tip, total,
  createdAt, confirmedAt, preparingAt, readyAt,
  estimatedReadyTime
}
```

### Order History
```groq
*[_type == "order" && customer.email == $email]
  | order(createdAt desc) [$start...$end] {
  _id, orderNumber, status, total, createdAt,
  "locationName": locationSnapshot.name,
  "itemSummary": items[0...3] {
    "name": menuItemSnapshot.name,
    quantity
  }
}
```

---

## Presentation Suggestions

### Option 1: Feature Showcase Page

Create a `/features` page highlighting customer benefits:

```
/features
├── Hero: "Track Your Order in Real-Time"
├── Section: Order Tracking (with phone mockup)
├── Section: Your Account (order history screenshot)
├── Section: One-Click Reorder
├── Section: Stay Updated (notification examples)
└── CTA: "Create Your Account" / "Order Now"
```

### Option 2: Order Confirmation Enhancement

Add feature callouts to the order confirmation page:

```
Order Confirmed!
├── Track Your Order → [Button]
├── "Create an account to:"
│   ├── View order history
│   ├── Reorder with one click
│   └── Get SMS/email updates
└── Sign Up [Button]
```

### Option 3: Interactive Demo Flow

Create a demo order experience:

```
/demo
├── Step 1: "Place" a fake order
├── Step 2: Watch the tracking page update
├── Step 3: See sample notifications
├── Step 4: View in order history
└── CTA: "Ready to order for real?"
```

### Option 4: Homepage Feature Grid

Add a feature section to the homepage:

```
Why Order from The Catch?
┌─────────────────┬─────────────────┬─────────────────┐
│  📍 Track Live  │  📜 History     │  🔄 Reorder     │
│  Watch your     │  See all your   │  Add favorites  │
│  order progress │  past orders    │  with one click │
└─────────────────┴─────────────────┴─────────────────┘
```

### Option 5: Slide Deck Content

For stakeholder presentations:

| Slide | Content |
|-------|---------|
| 1 | Title: "The Catch Customer Portal" |
| 2 | Problem: "Customers wonder where their order is" |
| 3 | Solution: Real-time tracking with live updates |
| 4 | Feature: Account + Order History |
| 5 | Feature: One-Click Reorder |
| 6 | Feature: SMS + Email Notifications |
| 7 | Tech Stack: Next.js, Sanity, Clerk, Twilio, Resend |
| 8 | Demo: [Live walkthrough] |
| 9 | Metrics: Conversion potential, repeat orders |
| 10 | Next Steps: Loyalty program, rewards |

---

## Future Enhancements

| Feature | Description | Priority |
|---------|-------------|----------|
| Loyalty Program | Points per order, rewards redemption | High |
| Push Notifications | Browser push for order updates | Medium |
| Order Modification | Edit order before preparation starts | Medium |
| Favorites | Save favorite items for quick reorder | Low |
| Order Scheduling | Place orders for future pickup times | Low |
| Group Orders | Share cart, split payments | Low |

---

## Testing Checklist

### Order Tracking
- [ ] Order tracking page loads with valid order number
- [ ] 404 page shows for invalid order number
- [ ] Status updates appear without page refresh
- [ ] Polling pauses when tab is hidden
- [ ] Polling stops at terminal states
- [ ] All status badges display correctly

### Authentication
- [ ] Sign-up flow works
- [ ] Sign-in flow works
- [ ] Protected routes redirect to sign-in
- [ ] Account button shows correctly based on auth state
- [ ] Sign-out works

### Order History
- [ ] Orders load for authenticated user
- [ ] Pagination works
- [ ] Tab filtering works
- [ ] Empty state displays correctly

### Reorder
- [ ] Reorder modal opens with order items
- [ ] Unavailable items are marked
- [ ] Items add to cart correctly
- [ ] Price updates reflect current menu

### Notifications
- [ ] SMS sends on order confirmed
- [ ] SMS sends on order ready
- [ ] Email sends on order confirmed
- [ ] Email sends on order ready
- [ ] Preferences save correctly
