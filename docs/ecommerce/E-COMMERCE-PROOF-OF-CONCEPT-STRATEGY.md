# Proof-of-Concept Strategy

## Goal
Build a polished, working online ordering system that's:
- Hidden from public until ready
- Easy to enable per-location
- Professional enough that locations will want to use it
- Testable at Post Oak or Denton first

---

## Phase 1: Feature Flags (Built into Sanity)

You already have the perfect feature flag system built in! Each location has:

```typescript
onlineOrderingEnabled: boolean  // Controls if location accepts online orders
acceptingOrders: boolean        // Temporary on/off switch
```

### How to Hide During Development

### Option A: Keep All Locations Disabled (Recommended)

1. Keep `onlineOrderingEnabled: false` for all locations
2. Build entire cart/checkout system
3. Test locally with dev environment
4. When ready for POC:
   - Set `onlineOrderingEnabled: true` for Post Oak only
   - Post Oak is the only public-facing location
   - Other locations show "Online ordering coming soon"

### Option B: Server-Side Admin Access (Secure)

Never expose admin codes in URLs or client-side code. Instead, use a server-side endpoint with HTTP-only cookies:

```typescript
// app/api/admin/auth/route.ts
import { cookies } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';

const ADMIN_CODES = process.env.ADMIN_CODES?.split(',') ?? [];
const ADMIN_CODE_VERSION = process.env.ADMIN_CODE_VERSION ?? '1';
let failedAttempts = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  
  // Rate limiting and throttling
  const now = Date.now();
  const attempt = failedAttempts.get(ip);
  if (attempt && attempt.resetAt > now && attempt.count >= 5) {
    return new Response('Too many failed attempts. Try again later.', { status: 429 });
  }
  if (attempt && attempt.resetAt < now) {
    failedAttempts.delete(ip);
  }

  const { code } = await request.json();
  
  // Validate code (never log the code itself)
  if (!code || !ADMIN_CODES.includes(code)) {
    const newAttempt = { 
      count: (attempt?.count ?? 0) + 1, 
      resetAt: now + 15 * 60 * 1000 
    };
    failedAttempts.set(ip, newAttempt);
    return new Response('Invalid code', { status: 401 });
  }

  // Success: Set HTTP-only, secure, sameSite cookie
  const cookieStore = await cookies();
  cookieStore.set('admin_session', `v${ADMIN_CODE_VERSION}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 8 * 60 * 60, // 8 hours
    path: '/',
  });

  // Log authentication event (without the code) for security audit
  console.info(`[AUDIT] Admin session created from IP: ${ip} at ${new Date().toISOString()}`);

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
```

```typescript
// lib/feature-flags.ts
import { cookies } from 'next/headers';

export async function canShowOnlineOrdering(location: Location): boolean {
  // Check server-side admin cookie
  const cookieStore = await cookies();
  const adminSession = cookieStore.get('admin_session');
  
  if (adminSession?.value && isValidAdminSession(adminSession.value)) {
    return true;
  }

  // Otherwise, respect location setting
  return location.onlineOrderingEnabled === true;
}

function isValidAdminSession(sessionValue: string): boolean {
  // Validate session format (e.g., v1, v2, etc.)
  const expectedVersion = process.env.ADMIN_CODE_VERSION ?? '1';
  return sessionValue === `v${expectedVersion}`;
}
```

```tsx
// components/AdminAuthForm.tsx (Internal use only, not public)
'use client';

import { useState } from 'react';

export function AdminAuthForm() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        setError('Invalid code or too many attempts');
        return;
      }

      // Success: Cookie set, reload page
      window.location.reload();
    } catch (err) {
      setError('Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border border-gray-300 rounded">
      <input
        type="password"
        placeholder="Enter admin code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        disabled={loading}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Authenticating...' : 'Unlock'}
      </button>
      {error && <p className="text-red-600">{error}</p>}
    </form>
  );
}
```

Set admin codes in `.env.local` (comma-separated, rotatable):

```bash
# Internal development admin codes (rotate regularly, invalidate old versions)
ADMIN_CODES=dev-code-2025-01,staging-code-2025-01
ADMIN_CODE_VERSION=1

# Old codes no longer work: ADMIN_CODES=old-code-2024-11
# To rotate: increment ADMIN_CODE_VERSION to invalidate all old session cookies
```

**Key Security Improvements:**
- ✅ No codes in URLs or query parameters
- ✅ No NEXT_PUBLIC_* exposure
- ✅ HTTP-only cookie prevents client-side access
- ✅ Secure + sameSite flags prevent CSRF and interception
- ✅ Server-side rate limiting + throttling
- ✅ Failed attempt tracking per IP
- ✅ Code never logged in responses or analytics
- ✅ Versioned codes allow instant revocation
- ✅ Short maxAge (8 hours) limits session lifetime
- ✅ Audit logging (event, IP, timestamp, but no code)

### What Users See

**Location with `onlineOrderingEnabled: false`:**
```tsx
// Menu page shows regular menu, no cart button
<MenuItemCard item={item}>
  <Button disabled>Coming Soon</Button>
</MenuItemCard>
```

**Location with `onlineOrderingEnabled: true`:**
```tsx
// Full cart functionality visible
<MenuItemCard item={item}>
  <Button onClick={addToCart}>Add to Cart</Button>
</MenuItemCard>
```

---

## Phase 2: Minimal Viable Product (MVP) Features

Focus on what matters for POC:

### ✅ Must Have (Week 1-2)

1. **Cart System**
   - Add/remove items
   - Location-locked (covered in docs)
   - Quantity adjustment
   - Persist in localStorage

2. **Checkout Flow**
   - Customer info form (name, email, phone)
   - Order type selector (pickup only for POC)
   - Order review/summary
   - Stripe payment (test mode)

3. **Order Confirmation**
   - Order number displayed
   - Email confirmation sent
   - "View order status" link

4. **Basic Order Management**
   - Orders appear in Sanity Studio
   - Staff can mark: Preparing → Ready → Completed
   - Customer can track status at `/orders/[orderNumber]`

### 🎯 Nice to Have (Week 3)

5. **Kitchen Display (Simple Version)**
   - Single page showing pending orders
   - Click to change status
   - Auto-refresh every 30 seconds
   - Print button for order ticket

6. **SMS Notifications**
   - "Order received"
   - "Order ready for pickup"

### ⏳ Can Wait (Post-POC)

- Delivery support
- Scheduled orders
- Loyalty program
- Revel POS integration (manual entry is fine for POC)
- Mobile app
- Multiple payment methods

---

## Phase 3: Design for Adoption

To ensure locations actually use it, focus on:

### For Customers (Make Ordering Easy)

```tsx
// Clean, simple flow
1. See menu → 2. Add to cart → 3. Checkout → 4. Done
   (30 sec)      (10 sec)         (2 min)
```

**Key UX elements:**
- Large, obvious "Add to Cart" buttons
- Floating cart icon with item count
- Clear total always visible
- One-page checkout (no multi-step wizard)
- Mobile-first design
- Fast performance (<2s page loads)

### For Staff (Make Receiving Orders Easy)

**Simple Kitchen Display:**

```text
┌─────────────────────────────────────────────────┐
│  NEW ORDERS                                     │
├─────────────────────────────────────────────────┤
│                                                 │
│  #ORD-001 - John Smith            📱 214-555-0100 │
│  12:45 PM • Pickup • $45.50                     │
│  ─────────────────────────────────────────      │
│  2x Blackened Redfish                           │
│  1x Fried Catfish (extra crispy)                │
│  1x Shrimp Cocktail                             │
│                                                 │
│  [Mark as Preparing] [Print Ticket]             │
│                                                 │
├─────────────────────────────────────────────────┤
│  #ORD-002 - Sarah Johnson        📱 214-555-0101 │
│  12:50 PM • Pickup • $32.75                     │
│  ...                                            │
└─────────────────────────────────────────────────┘
```

**Staff wins:**
- Big touch targets (finger-friendly)
- Sorted by order time
- Phone number visible for easy callback
- One-click status updates
- Print tickets for kitchen

### For Location Managers (Make Setup Easy)

**Zero setup required:**
- You handle Stripe onboarding (they just provide bank info)
- Menu synced from existing Sanity data
- No hardware required (use existing tablet/computer)
- Daily payout to their bank account (automatic)

---

## Phase 4: POC Setup for Post Oak

### Week 1: Build (Hidden from Public)

```bash
# All locations disabled
*[_type == "location"].onlineOrderingEnabled = false
```

Build and test locally.

### Week 2: Internal Testing

1. Enable Post Oak only:
```typescript
// In Sanity Studio
Location: Post Oak
  onlineOrderingEnabled: true
  acceptingOrders: true
  orderTypes: ["pickup"]
```

2. Share link with team: `https://thecatch.com/menu/post-oak`
3. Test with real orders (small amounts)
4. Gather feedback from:
   - Team members (UX)
   - Post Oak staff (kitchen display)
   - Friends/family (customer flow)

### Week 3: Soft Launch

1. Announce to Post Oak regulars:
   - Email newsletter
   - Instagram post
   - QR code at table
   - "Order Online" button on website (only for Post Oak)

2. Monitor closely:
   - Watch orders come in
   - Check for issues
   - Get feedback from staff
   - Measure adoption

### Week 4: Decide Next Steps

**If successful:**
- Roll out to Denton
- Then to other locations
- Invest in polish (SMS, Revel integration, etc.)

**If needs work:**
- Iterate on feedback
- Keep it Post Oak-only
- Improve before expanding

---

## Phase 5: Technical Implementation Details

### Hiding Cart Functionality

**In menu page component:**

```tsx
// app/menu/[location]/page.tsx
import { canShowOnlineOrdering } from '@/lib/feature-flags';

export default async function MenuPage({ params }) {
  const location = await getLocation(params.location);
  const showOrdering = canShowOnlineOrdering(location);

  return (
    <div>
      <MenuItems items={items}>
        {items.map(item => (
          <MenuItemCard
            key={item.id}
            item={item}
            showOrderButton={showOrdering}
            location={location}
          />
        ))}
      </MenuItems>

      {showOrdering && <CartDrawer />}
    </div>
  );
}
```

**In menu item card:**

```tsx
// components/menu/MenuItemCard.tsx
interface Props {
  item: MenuItem;
  showOrderButton: boolean;
  location: Location;
}

export function MenuItemCard({ item, showOrderButton, location }: Props) {
  return (
    <Card>
      <h3>{item.name}</h3>
      <p>{item.description}</p>
      <p>${item.price}</p>

      {showOrderButton ? (
        <AddToCartButton item={item} location={location} />
      ) : (
        <Button disabled>
          Online Ordering Coming Soon
        </Button>
      )}
    </Card>
  );
}
```

### Testing with Stripe Test Account

**In `.env.local` (for POC):**

```bash
# Use test keys from your other app's Stripe account
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# Mark as test mode
NEXT_PUBLIC_IS_TEST_MODE=true
```

**Show test mode indicator:**

```tsx
// components/TestModeBanner.tsx
export function TestModeBanner() {
  if (process.env.NEXT_PUBLIC_IS_TEST_MODE !== 'true') return null;

  return (
    <div className="bg-yellow-500 text-black p-2 text-center text-sm">
      ⚠️ TEST MODE - Use card 4242 4242 4242 4242 for testing
    </div>
  );
}
```

---

## Phase 6: Cost Management for POC

### Stripe Costs (Test Mode = Free)

- Test mode charges: $0
- Test mode payouts: $0
- Connected Accounts: Free in test mode
- When you go live:
  - 2.9% + $0.30 per transaction
  - No monthly fees

### Keep POC Cheap

**Don't build yet:**
- SMS notifications (costs ~$0.01 per text)
- Email service (use free tier: SendGrid, Resend)
- Cloud functions (Vercel's free tier is enough)
- Hardware (use existing tablet/laptop)

**Free for POC:**
- Sanity (free tier up to 3 users)
- Vercel hosting (free for preview deployments)
- Stripe test mode (unlimited testing)

---

## Success Metrics for POC

Track these to evaluate success:

### Customer Adoption
- How many online orders per day?
- What % of customers use it vs. call/walk-in?
- Average order value (online vs. in-person)
- Time to complete order (goal: <3 minutes)

### Staff Satisfaction
- Is kitchen display easy to use?
- Are orders accurate?
- Is it faster than phone orders?
- Any pain points?

### Business Impact
- Increase in total orders?
- Increase in average order size?
- Reduction in phone time for staff?
- Customer feedback positive?

### Technical Health
- Page load time (<2s)
- Checkout completion rate (>80%)
- Payment success rate (>95%)
- Order errors (<1%)

---

## Rollout Timeline (Suggested)

### Week 1-2: Build MVP
- Cart system
- Checkout flow
- Order management
- Basic kitchen display

### Week 3: Internal Testing
- Enable Post Oak only
- Test with team
- Fix critical bugs
- Polish UX

### Week 4: Soft Launch
- Announce to regulars
- Monitor closely
- Gather feedback
- Quick iterations

### Week 5-6: Evaluate
- Review metrics
- Staff feedback
- Customer feedback
- Decide: expand or iterate

### Week 7+: Expand or Improve
- If good: Roll out to Denton
- If needs work: Keep improving
- If successful: Add to all locations

---

## Key Takeaways

1. **Use existing Stripe account for POC** - Totally fine, just use test mode
2. **Feature flags built in** - `onlineOrderingEnabled` per location
3. **Start with one location** - Post Oak or Denton only
4. **Keep it simple** - Pickup only, defer fancy features
5. **Make it look good** - Polish matters for adoption
6. **Easy for staff** - Simple kitchen display is key
7. **Measure success** - Track orders, feedback, issues
8. **Iterate quickly** - Fix problems before expanding

The goal is to prove the concept works at one location before investing in:
- Revel integration
- SMS notifications
- Delivery support
- Mobile app
- Multiple payment methods
- Advanced features

Keep it simple, make it work, make it pretty, then expand. 🚀
