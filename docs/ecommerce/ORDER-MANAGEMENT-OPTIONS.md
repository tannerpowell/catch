# Order Management Options

## Overview

After a customer places an order, staff needs to:
1. See the order
2. Start preparing it
3. Mark it ready
4. Mark it completed

This can happen in **three places:**

---

## Option 1: Sanity Studio (Zero Dev Work)

### What It Is
Orders appear in Sanity Studio automatically. Staff clicks "Orders" in sidebar, sees all orders, can update status.

### Access
- URL: `https://your-project.sanity.studio` (or `localhost:3333` in dev)
- Login: Sanity account credentials
- Mobile-friendly: Works on tablets/phones

### What It Looks Like

**List View:**
```text
Orders
─────────────────────────────────────
🔍 Search orders...

[Filter: Status ▾] [Filter: Location ▾]

✅ ORD-20250123-001
   John Smith • Catch DFW
   $45.50 • Confirmed • 5 min ago

⏳ ORD-20250123-002
   Sarah Johnson • Catch HTX
   $32.75 • Preparing • 12 min ago

🔔 ORD-20250123-003
   Mike Davis • Catch DFW
   $67.25 • Ready • 2 min ago
```

**Detail View (click an order):**
```
Order ORD-20250123-001

Customer
┌─────────────────────────────┐
│ Name: John Smith            │
│ Email: john@example.com     │
│ Phone: (214) 555-0100       │
└─────────────────────────────┘

Order Details
┌─────────────────────────────┐
│ Type: Pickup                │
│ Location: Catch DFW         │
│ Status: [Confirmed ▾]       │ ← Click to change
│   - Pending                 │
│   - Confirmed               │
│   - Preparing               │
│   - Ready                   │
│   - Completed               │
│   - Cancelled               │
└─────────────────────────────┘

Items
┌─────────────────────────────┐
│ 2x Blackened Redfish        │
│    Price: $18.00 each       │
│                             │
│ 1x Shrimp Cocktail          │
│    Price: $9.50             │
└─────────────────────────────┘

Pricing
┌─────────────────────────────┐
│ Subtotal:      $45.50       │
│ Tax (8.25%):   $3.75        │
│ Total:         $49.25       │
└─────────────────────────────┘

Payment
┌─────────────────────────────┐
│ Status: Paid                │
│ Method: Visa •••• 4242      │
│ Stripe ID: pi_xxxxx         │
└─────────────────────────────┘

Timestamps
┌─────────────────────────────┐
│ Created: 1/23/25 12:45 PM   │
│ Confirmed: 1/23/25 12:45 PM │
│ Preparing: -                │
│ Ready: -                    │
│ Completed: -                │
└─────────────────────────────┘

[Publish] [Delete]
```

### Workflow

**Kitchen staff:**
1. Opens Sanity Studio on tablet
2. Clicks "Orders" in sidebar
3. Sees new orders at top (sorted by time)
4. Clicks order to open
5. Reads order details
6. Changes "Status" dropdown: Confirmed → Preparing
7. Cooks food
8. Changes status: Preparing → Ready
9. Customer notified (if SMS enabled)
10. When picked up, changes status: Ready → Completed

### Pros & Cons

**Pros:**
- ✅ **Zero dev work** - Already working
- ✅ **Free** - Included with Sanity
- ✅ **Secure** - Sanity handles auth
- ✅ **Mobile-friendly** - Works on tablets
- ✅ **Full-featured** - Search, filter, export, history
- ✅ **Perfect for managers** - Can add notes, refunds, etc.

**Cons:**
- ❌ Too many clicks for fast-paced kitchen
- ❌ Not optimized for kitchen workflow
- ❌ Requires Sanity login (one more password)
- ❌ Looks like admin panel, not kitchen display

**Best For:**
- POC phase (right now)
- Location managers
- Low order volume (5-10 orders/day)
- Reviewing order history
- Issuing refunds
- Customer service

### Setup Required

**Minimal:**

1. **Give staff access to Sanity Studio:**
   ```bash
   # In Sanity dashboard → Manage → Project Members
   # Add location managers with "Editor" role
   ```

2. **Customize order list preview** (optional, makes scanning easier):
   ```typescript
   // sanity/schemas/order.ts (already done!)
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
   ```

3. **Add custom order tool** (optional, better UX):
   ```typescript
   // sanity/structure.ts
   import { StructureBuilder } from 'sanity/desk';

   export const structure = (S: StructureBuilder) =>
     S.list()
       .title('Content')
       .items([
         // Custom Orders list
         S.listItem()
           .title('Orders')
           .icon(() => '📦')
           .child(
             S.documentList()
               .title('Orders')
               .filter('_type == "order"')
               .defaultOrdering([{ field: 'createdAt', direction: 'desc' }])
               .child((documentId) =>
                 S.document()
                   .documentId(documentId)
                   .schemaType('order')
               )
           ),

         // Regular content
         ...S.documentTypeListItems().filter(
           (listItem) => !['order'].includes(listItem.getId()!)
         ),
       ]);
   ```

**That's it!** Orders will appear immediately when customers check out.

---

## Option 2: Custom Kitchen Display (`/kds`)

### What It Is
A custom page on your domain (`thecatch.com/kds`) optimized for kitchen workflow. Big buttons, auto-refresh, sound alerts.

### What It Looks Like

**Desktop View (3 columns):**
```text
┌──────────────────────────────────────────────────────────┐
│  Kitchen Display - Catch DFW                   🔄 Live   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  NEW ORDERS           │  PREPARING         │  READY     │
│  ─────────────────────┼────────────────────┼────────────│
│                       │                    │            │
│  📱 #001              │  ⏱️ #002           │  🔔 #003   │
│  John Smith           │  Sarah Johnson     │  Mike D.   │
│  12:45 PM             │  12:50 PM (8 min)  │  1:05 PM   │
│  Pickup • $45.50      │  Pickup • $32.75   │  $67.25    │
│  ───────────────      │  ───────────────   │  ─────     │
│  2x Blackened Redfish │  1x Fried Catfish  │  1x Gumbo  │
│  1x Shrimp Cocktail   │  1x Gumbo          │  1x Salad  │
│                       │                    │            │
│  📱 (214) 555-0100    │  📱 555-0101       │  555-0102  │
│                       │                    │            │
│  [START PREPARING]    │  [MARK READY]      │ [COMPLETE] │
│  [PRINT]              │  [PRINT]           │  [PRINT]   │
│                       │                    │            │
└───────────────────────┴────────────────────┴────────────┘
```

**Tablet View (single column, swipe between statuses):**
```text
┌──────────────────────────────────────┐
│  NEW ORDERS              [ → Ready ] │
├──────────────────────────────────────┤
│                                      │
│  #001 - John Smith     📱 555-0100   │
│  12:45 PM • Pickup • $45.50          │
│  ──────────────────────────────      │
│  2x Blackened Redfish                │
│  1x Shrimp Cocktail                  │
│  (no special instructions)           │
│                                      │
│  [START PREPARING]      [PRINT]      │
│                                      │
├──────────────────────────────────────┤
│  #002 - Sarah Johnson  📱 555-0101   │
│  ...                                 │
└──────────────────────────────────────┘
```

### Features

**Core:**
- ✅ Real-time updates (Sanity live subscriptions)
- ✅ Sound notification on new order
- ✅ Big touch-friendly buttons
- ✅ Auto-refresh (no manual reload)
- ✅ Column/kanban layout
- ✅ Timer showing order age
- ✅ Customer phone visible for callbacks

**Nice-to-Have:**
- ✅ Print ticket button
- ✅ Drag-and-drop between columns
- ✅ Highlight overdue orders (>30 min)
- ✅ Filter by order type (pickup/delivery)
- ✅ Multiple location support

### Implementation

**Basic Version (Day 1):**

```typescript
// app/kds/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@sanity/client';
import type { Order } from '@/lib/types';

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  useCdn: false,
  apiVersion: '2024-01-01',
});

export default function KitchenDisplay() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    // Initial fetch
    const fetchOrders = async () => {
      const data = await sanityClient.fetch<Order[]>(`
        *[_type == "order" && status in ["confirmed", "preparing", "ready"]]
        | order(createdAt asc)
        {
          _id,
          orderNumber,
          status,
          customer,
          items,
          total,
          orderType,
          createdAt,
          specialInstructions
        }
      `);
      setOrders(data);
    };

    fetchOrders();

    // Real-time subscription
    const subscription = sanityClient
      .listen(`*[_type == "order" && status in ["confirmed", "preparing", "ready"]]`)
      .subscribe((update) => {
        if (update.result) {
          setOrders((prev) => {
            const idx = prev.findIndex((o) => o._id === update.result._id);
            if (idx >= 0) {
              // Update existing
              const newOrders = [...prev];
              newOrders[idx] = update.result as Order;
              return newOrders;
            }
            // Add new
            return [update.result as Order, ...prev];
          });

          // Play sound for new orders
          if (update.transition === 'appear') {
            new Audio('/sounds/new-order.mp3').play();
          }
        }
      });

    return () => subscription.unsubscribe();
  }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    await fetch('/api/orders/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status: newStatus }),
    });
  };

  return (
    <div className="kds-layout">
      <header className="kds-header">
        <h1>Kitchen Display</h1>
        <div className="kds-status">🔄 Live</div>
      </header>

      <div className="kds-columns">
        <OrderColumn
          title="New Orders"
          orders={orders.filter((o) => o.status === 'confirmed')}
          onUpdateStatus={updateStatus}
          nextStatus="preparing"
          buttonText="Start Preparing"
        />
        <OrderColumn
          title="Preparing"
          orders={orders.filter((o) => o.status === 'preparing')}
          onUpdateStatus={updateStatus}
          nextStatus="ready"
          buttonText="Mark Ready"
        />
        <OrderColumn
          title="Ready"
          orders={orders.filter((o) => o.status === 'ready')}
          onUpdateStatus={updateStatus}
          nextStatus="completed"
          buttonText="Complete"
        />
      </div>
    </div>
  );
}

function OrderColumn({ title, orders, onUpdateStatus, nextStatus, buttonText }) {
  return (
    <div className="kds-column">
      <h2>{title} ({orders.length})</h2>
      <div className="kds-orders">
        {orders.map((order) => (
          <OrderCard
            key={order._id}
            order={order}
            onUpdate={() => onUpdateStatus(order._id, nextStatus)}
            buttonText={buttonText}
          />
        ))}
      </div>
    </div>
  );
}

function OrderCard({ order, onUpdate, buttonText }) {
  const age = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);

  return (
    <div className="kds-order-card">
      <div className="kds-order-header">
        <div>
          <strong>#{order.orderNumber}</strong>
          <span>{order.customer.name}</span>
        </div>
        <a href={`tel:${order.customer.phone}`}>📱 {order.customer.phone}</a>
      </div>

      <div className="kds-order-meta">
        <span>{order.orderType}</span>
        <span>${order.total.toFixed(2)}</span>
        <span className={age > 15 ? 'kds-order-overdue' : ''}>
          {age} min ago
        </span>
      </div>

      <div className="kds-order-items">
        {order.items.map((item, i) => (
          <div key={i}>
            <strong>{item.quantity}x</strong> {item.menuItemSnapshot.name}
            {item.modifiers?.map((mod, j) => (
              <div key={j} className="kds-modifier">
                - {mod.name}: {mod.option}
              </div>
            ))}
          </div>
        ))}
      </div>

      {order.specialInstructions && (
        <div className="kds-order-notes">
          📝 {order.specialInstructions}
        </div>
      )}

      <div className="kds-order-actions">
        <button onClick={onUpdate} className="kds-btn-primary">
          {buttonText}
        </button>
        <button onClick={() => window.print()} className="kds-btn-secondary">
          Print
        </button>
      </div>
    </div>
  );
}
```

**API Route for Status Updates:**

```typescript
// app/api/orders/update-status/route.ts
import { createClient } from '@sanity/client';
import { NextResponse } from 'next/server';

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_API_TOKEN, // Write token
  useCdn: false,
  apiVersion: '2024-01-01',
});

export async function POST(request: Request) {
  try {
    const { orderId, status } = await request.json();

    // Update order status
    await sanityClient
      .patch(orderId)
      .set({
        status,
        updatedAt: new Date().toISOString(),
        [`${status}At`]: new Date().toISOString(), // e.g., preparingAt, readyAt
      })
      .commit();

    // TODO: Send customer notification (SMS/email)
    // if (status === 'ready') {
    //   await sendSMS(order.customer.phone, 'Your order is ready!');
    // }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update order:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
```

### Security

The KDS authentication system implements comprehensive protections against brute-force attacks:

**Password Comparison (CRITICAL SECURITY):**

All password comparisons use **hash-then-compare** for security:

```typescript
// ✅ SECURE: Hash both passwords, then compare hashes with constant-time comparison
const inputHash = createHash('sha256').update(password || '').digest();
const expectedHash = createHash('sha256').update(process.env.KDS_PASSWORD || '').digest();
const isValidPassword = timingSafeEqual(inputHash, expectedHash);
```

**Why this works:**
- **Fixed-length output**: SHA256 always produces 32-byte hashes (prevents truncation attacks)
- **Timing-safe**: `timingSafeEqual` takes constant time regardless of which byte differs
- **Robust**: Works correctly whether passwords are short or very long

**Why NOT to use plaintext buffers:**
- ❌ `padEnd(32, '\0')` creates wrong padding (literal `\0` chars, not null bytes)
- ❌ Truncation without error (long passwords silently cut to 32 bytes)
- ❌ Padding behavior leaks password length information

**Other Mitigation Strategies:**
1. **Rate Limiting**: Maximum 5 failed attempts per IP per 15-minute window
2. **Progressive Delays**: Exponential backoff (500ms → 1s → 2s → 4s → 5s) after each failed attempt
3. **Account Lockout**: 30-minute lockout after 5 failed attempts (prevents sustained attacks)
4. **Security Logging**: All authentication failures and lockouts logged for monitoring and incident response
5. **Constant-Time Comparison**: Password validation uses constant-time comparison to prevent timing attacks
6. **HTTP-Only Cookies**: JWT stored in HTTP-only, secure cookies (prevents JavaScript access)
7. **Generic Error Messages**: Never reveal whether username/email exists (prevents user enumeration)

**Production Rate-Limiting Recommendation:** For high-traffic deployments, replace the in-memory rate limit store with Redis:

```bash
npm install redis ioredis
```

Then update `lib/auth/kds-rate-limit.ts` to use a Redis backend instead of `Map`. Example:

```typescript
import { Redis } from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// Store: redis.set(`ratelimit:${identifier}`, JSON.stringify(record), 'EX', 900)
// Retrieve: redis.get(`ratelimit:${identifier}`)
```

---

**Rate Limiting & Brute-Force Protection Utility:**

```typescript
// lib/auth/kds-rate-limit.ts
/**
 * KDS Login Rate Limiting & Brute-Force Protection
 * 
 * Implements progressive delays and account lockout to prevent
 * automated password guessing attacks.
 */

interface AttemptRecord {
  count: number;
  lastAttempt: number;
  lockedUntil?: number;
}

// In-memory store (replace with Redis in production)
const attemptMap = new Map<string, AttemptRecord>();

const RATE_LIMIT_CONFIG = {
  MAX_ATTEMPTS: 5,           // Max failed attempts before lockout
  WINDOW_MINUTES: 15,        // Time window for attempt counting
  LOCKOUT_MINUTES: 30,       // How long account is locked after max attempts
  BASE_DELAY_MS: 500,        // Base delay in milliseconds
  MAX_DELAY_MS: 5000,        // Maximum delay (exponential backoff cap)
};

/**
 * Check if IP/account is rate limited and record attempt
 * @returns { allowed: boolean; delaySecs: number; reason?: string }
 */
export function checkRateLimit(identifier: string): {
  allowed: boolean;
  delaySecs: number;
  reason?: string;
} {
  const now = Date.now();
  const record = attemptMap.get(identifier);

  // Check if account is locked
  if (record?.lockedUntil && now < record.lockedUntil) {
    const remainingSecs = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      allowed: false,
      delaySecs: remainingSecs,
      reason: `Account locked. Try again in ${remainingSecs} seconds.`,
    };
  }

  // Check if outside time window - reset counter
  if (!record || now - record.lastAttempt > RATE_LIMIT_CONFIG.WINDOW_MINUTES * 60000) {
    return { allowed: true, delaySecs: 0 };
  }

  // Within window - check attempt count
  if (record.count >= RATE_LIMIT_CONFIG.MAX_ATTEMPTS) {
    const lockoutTime = now + RATE_LIMIT_CONFIG.LOCKOUT_MINUTES * 60000;
    attemptMap.set(identifier, { count: record.count, lastAttempt: now, lockedUntil: lockoutTime });
    
    return {
      allowed: false,
      delaySecs: RATE_LIMIT_CONFIG.LOCKOUT_MINUTES * 60,
      reason: `Too many failed attempts. Account locked for ${RATE_LIMIT_CONFIG.LOCKOUT_MINUTES} minutes.`,
    };
  }

  return { allowed: true, delaySecs: 0 };
}

/**
 * Record a failed login attempt and return exponential backoff delay
 */
export function recordFailedAttempt(identifier: string): number {
  const now = Date.now();
  const record = attemptMap.get(identifier) || { count: 0, lastAttempt: now };

  // Reset if outside window
  if (now - record.lastAttempt > RATE_LIMIT_CONFIG.WINDOW_MINUTES * 60000) {
    record.count = 0;
  }

  record.count++;
  record.lastAttempt = now;
  attemptMap.set(identifier, record);

  // Calculate exponential backoff: 2^(attempts-1) * base, capped at MAX_DELAY
  const exponentialDelay = Math.pow(2, Math.max(0, record.count - 1)) * RATE_LIMIT_CONFIG.BASE_DELAY_MS;
  return Math.min(exponentialDelay, RATE_LIMIT_CONFIG.MAX_DELAY_MS);
}

/**
 * Clear failed attempts on successful login
 */
export function clearAttempts(identifier: string): void {
  attemptMap.delete(identifier);
}

/**
 * Log suspicious activity for monitoring
 */
export function logSuspiciousActivity(
  identifier: string,
  eventType: 'brute_force' | 'account_lockout' | 'unusual_pattern',
  details?: Record<string, any>
): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    identifier,
    eventType,
    details,
  };

  // In production: Send to security monitoring system
  // Example: Sentry, DataDog, CloudWatch, etc.
  console.error('[SECURITY]', JSON.stringify(logEntry));

  // TODO: Implement alerting for critical events
  // if (eventType === 'account_lockout') {
  //   await sendSecurityAlert(logEntry);
  // }
}
```

**Server-Side Authentication:**

```typescript
// app/kds/page.tsx
'use client';

import { useState, useEffect } from 'react';

export default function KitchenDisplay() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check authentication status server-side
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/kds/check', {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      setIsAuthenticated(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Call server-side authentication endpoint
      const response = await fetch('/api/auth/kds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        alert('Incorrect password');
        setPassword('');
      }
    } catch (error) {
      alert('Authentication error. Please try again.');
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="kds-login">
        <h1>Kitchen Display</h1>
        <form onSubmit={handleLogin}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            autoFocus
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Authenticating...' : 'Login'}
          </button>
        </form>
      </div>
    );
  }

  return <KitchenDisplayContent />;
}
```

**Shared JWT Secret Utility:**

```typescript
// lib/auth/kds-secret.ts
/**
 * KDS JWT Secret Configuration
 * 
 * CRITICAL: This module validates that KDS_JWT_SECRET is set in environment
 * variables and fails fast if missing. Never use a hardcoded fallback secret.
 */

if (!process.env.KDS_JWT_SECRET) {
  throw new Error(
    'FATAL: KDS_JWT_SECRET environment variable is required but not set. ' +
    'Set it in .env.local for development or in your hosting provider for production. ' +
    'Never deploy without a properly configured secret.'
  );
}

// Export the encoded secret for use with jose library
export const KDS_JWT_SECRET = new TextEncoder().encode(
  process.env.KDS_JWT_SECRET
);

// Validate minimum secret strength (at least 32 characters recommended)
if (process.env.KDS_JWT_SECRET.length < 32) {
  console.warn(
    'WARNING: KDS_JWT_SECRET should be at least 32 characters for security. ' +
    'Generate a strong secret: openssl rand -base64 32'
  );
}
```

**Server Authentication Endpoint with Brute-Force Protection:**

```typescript
// app/api/auth/kds/route.ts
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { KDS_JWT_SECRET } from '@/lib/auth/kds-secret';
import {
  checkRateLimit,
  recordFailedAttempt,
  clearAttempts,
  logSuspiciousActivity,
} from '@/lib/auth/kds-rate-limit';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    
    // Identify user by IP address (use X-Forwarded-For in production behind proxy)
    const identifier = request.headers.get('x-forwarded-for') || 'unknown';

    // ⚠️ BRUTE-FORCE PROTECTION: Check rate limit before validating password
    const rateLimitCheck = checkRateLimit(identifier);
    if (!rateLimitCheck.allowed) {
      logSuspiciousActivity(identifier, 'account_lockout', {
        reason: rateLimitCheck.reason,
      });
      return Response.json(
        { error: rateLimitCheck.reason },
        { status: 429 } // Too Many Requests
      );
    }

    // Verify password (constant-time comparison to prevent timing attacks)
    // Hash both passwords to get fixed-length outputs (32 bytes)
    // This approach is secure because:
    // 1. Hash outputs are always exactly 32 bytes (prevents truncation)
    // 2. Timing attacks reveal nothing about password content
    // 3. Constant-time comparison applies to fixed-length hashes
    const { createHash, timingSafeEqual } = await import('crypto');
    
    const inputHash = createHash('sha256')
      .update(password || '')
      .digest();
    
    const expectedHash = createHash('sha256')
      .update(process.env.KDS_PASSWORD || '')
      .digest();
    
    // Safe comparison: both hashes are always 32 bytes
    const isValidPassword = timingSafeEqual(inputHash, expectedHash);
    
    if (!isValidPassword) {
      // Record failed attempt and get exponential backoff delay
      const delayMs = recordFailedAttempt(identifier);
      
      // Log attempt (delayMs tells us how many failed attempts so far)
      const attemptNumber = Math.log2(delayMs / 500) + 1; // Reverse-engineer attempt number from delay
      logSuspiciousActivity(identifier, 'brute_force', {
        attemptNumber: Math.round(attemptNumber),
        delayMs,
      });

      // Apply exponential backoff by delaying response
      await new Promise(resolve => setTimeout(resolve, delayMs));

      // Generic error message (never reveal if password exists or rate limit status)
      return Response.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // ✅ PASSWORD VALID: Create JWT token
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(KDS_JWT_SECRET);

    // Clear rate limit counter on successful login
    clearAttempts(identifier);

    // Set HTTP-only, secure cookie
    const cookieJar = await cookies();
    cookieJar.set('kds-auth', token, {
      httpOnly: true, // Cannot be accessed by JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400, // 24 hours
    });

    console.log(`[SECURITY] Successful KDS login from ${identifier}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error('KDS auth error:', error);
    return Response.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const cookieJar = await cookies();
    const token = cookieJar.get('kds-auth')?.value;

    if (!token) {
      return Response.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    // Verify JWT validity
    await jwtVerify(token, KDS_JWT_SECRET);
    return Response.json({ authenticated: true });
  } catch (error) {
    return Response.json(
      { authenticated: false },
      { status: 401 }
    );
  }
}
```

**Client-Side Login with User Feedback:**

```typescript
// app/kds/page.tsx
'use client';

import { useState, useEffect } from 'react';

export default function KitchenDisplay() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/kds/check', {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      setIsAuthenticated(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/kds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
      } else if (response.status === 429) {
        // Account locked due to too many failed attempts
        const data = await response.json();
        setError(data.error || 'Too many login attempts. Please try again later.');
      } else {
        setError('Incorrect password. Please try again.');
        setPassword('');
      }
    } catch (error) {
      setError('Connection error. Please check your network and try again.');
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="kds-login">
        <h1>Kitchen Display</h1>
        <form onSubmit={handleLogin}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            autoFocus
            disabled={isLoading}
            aria-label="Password input"
          />
          {error && (
            <div className="kds-error" role="alert">
              {error}
            </div>
          )}
          <button type="submit" disabled={isLoading || !password}>
            {isLoading ? 'Authenticating...' : 'Login'}
          </button>
        </form>
      </div>
    );
  }

  return <KitchenDisplayContent />;
}
```

**Route Protection with Middleware:**

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { KDS_JWT_SECRET } from '@/lib/auth/kds-secret';

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/kds')) {
    const token = request.cookies.get('kds-auth')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/kds/login', request.url));
    }

    try {
      await jwtVerify(token, KDS_JWT_SECRET);
      return NextResponse.next();
    } catch (error) {
      return NextResponse.redirect(new URL('/kds/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/kds/:path*'],
};
```

**Environment Configuration:**

```bash
# .env.local (required for development and production)

# KDS Authentication (REQUIRED - application will fail to start if missing)
KDS_JWT_SECRET=your-jwt-secret-at-least-32-characters-long
KDS_PASSWORD=your-kds-password-at-least-16-characters

# Generate strong secrets:
# JWT Secret: openssl rand -base64 32
# KDS Password: openssl rand -base64 16
```

**⚠️ CRITICAL:**
- The application will throw an error on startup if `KDS_JWT_SECRET` is not set
- This is intentional to prevent deploying with insecure defaults
- **KDS_PASSWORD must be at least 16 characters** (longer is better)
- Use `openssl rand -base64 16` to generate a cryptographically strong password

**Never commit secrets to version control.** The `.env.local` file should be in `.gitignore`.

### Pros & Cons

**Pros:**
- ✅ Optimized for kitchen workflow
- ✅ Big touch targets (tablet-friendly)
- ✅ Real-time updates
- ✅ Sound notifications
- ✅ Fast status changes (one click)
- ✅ Can customize exactly how you want
- ✅ Looks professional

**Cons:**
- ❌ Requires 2-3 days dev work
- ❌ Need tablet/monitor in kitchen
- ❌ Need to maintain/update it
- ❌ Doesn't show order history (use Sanity for that)

**Best For:**
- Production launch
- High order volume
- Fast-paced kitchens
- Staff who aren't tech-savvy

---

## Option 3: Hybrid (Recommended)

**Use BOTH:**

### Kitchen Display for Line Cooks
- Simple, fast interface
- Just change order status
- Auto-refresh, sound alerts

### Sanity Studio for Managers
- View all orders (past and present)
- Issue refunds
- Add internal notes
- Customer service
- Analytics and reporting

**They share the same data:**
```text
Order Created in Sanity
         ↓
    Both see it
         ↓
Cook updates in KDS → Updates Sanity → Manager sees change
         ↓
Manager adds note in Sanity → Updates Sanity → Cook sees note in KDS
```

---

## My Recommendation

### For POC (Now)

**Use Sanity Studio only**
- It already works
- Perfect for 5-10 orders/day
- Can test the entire flow
- Managers handle everything

### Week 5-8 (After Success)

**Build basic Kitchen Display**
- Spend 2-3 days building `/kds`
- Keep it simple: just 3 columns, big buttons
- Test at one location

### Production

**Polish Kitchen Display + Sanity Studio**
- Kitchen gets a tablet mounted on wall
- They use KDS all day
- Managers use Sanity Studio for everything else
- Both work together seamlessly

---

## Error Handling and Monitoring

The KDS and cart systems use centralized error handling utilities for consistent monitoring across client and server:

**Unified Error Reporting** (`lib/errors/cart-errors.ts`):
- Works on both server and client sides
- Uses dynamic imports to avoid code bloat
- Gracefully falls back if Sentry not initialized
- Reports to Sentry with structured context

```typescript
import { captureCartError, createCartError } from '@/lib/errors/cart-errors';

// Report error to monitoring (client and server)
await captureCartError('LOC_MISSING_001', {
  slug: location.slug,
  adapterResponse: location,
  sanityFetchResult: sanityLocation,
});

// Create and throw a safe error (reports to monitoring automatically)
throw await createCartError('LOC_MISSING_001', { slug });
```

**Benefits:**
- Single error utility works everywhere (server Routes, client components)
- Errors sent to Sentry from both client and server
- User-facing messages never leak sensitive data
- Full context available to engineers in monitoring dashboard
- Development mode logs full details to console

---

## Summary

| Feature | Sanity Studio | Custom KDS | Hybrid |
|---------|--------------|------------|--------|
| **Dev Time** | 0 hours | 16-24 hours | 16-24 hours |
| **Cost** | $0 | $0 (hosting) | $0 (hosting) |
| **Kitchen UX** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Manager UX** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Order History** | ✅ | ❌ | ✅ |
| **Refunds** | ✅ | ❌ | ✅ |
| **Real-time** | ✅ | ✅ | ✅ |
| **Mobile** | ✅ | ✅ | ✅ |
| **Best For** | POC | High Volume | Production |

**Start with Sanity Studio, build KDS when you need it.** 🎯
