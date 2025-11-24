# Deployment Architecture: Subdomain Strategy

## The Problem

**Scenario:**
```
You deploy a change to thecatch.com
         ↓
TypeScript error in marketing page
         ↓
Entire site goes down (500 error)
         ↓
Kitchen Display is down too (/kds on same domain)
         ↓
Kitchen can't see new orders!
         ↓
Revenue loss + operational chaos 😱
```

**The Issue:**
- Marketing site and mission-critical systems share the same deployment
- One broken component can take down everything
- No isolation between critical and non-critical services

---

## Recommended Solution: Separate Subdomains

### Architecture Overview

```
┌─────────────────────────────────────────────────┐
│  thecatch.com                                   │
│  Marketing site, about, locations, blog        │
│  Priority: Low (can tolerate downtime)         │
│  (Can break without affecting orders)          │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  order.thecatch.com                             │
│  Menu browsing, cart, checkout                 │
│  Priority: Critical (revenue-generating)       │
│  (Customers place orders here)                 │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  kds.thecatch.com                               │
│  Kitchen Display System only                    │
│  Priority: Critical (operations)               │
│  (Kitchen sees and manages orders here)        │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  studio.thecatch.com (optional)                 │
│  Sanity Studio (manager dashboard)             │
│  Priority: Medium                              │
│  (Fallback: managers can use sanity.studio)   │
└─────────────────────────────────────────────────┘
```

### Benefits of Isolation

**Reliability:**
- ✅ Marketing site breaks → Kitchen still works
- ✅ Checkout breaks → Marketing site still works
- ✅ Each can be deployed independently
- ✅ Different error boundaries
- ✅ Different monitoring/alerting

**Performance:**
- ✅ Can scale services differently (KDS needs less resources)
- ✅ Can optimize each for its specific use case
- ✅ No shared resource contention

**Development:**
- ✅ Independent deployment pipelines
- ✅ Can use different tech stacks if needed
- ✅ Easier to assign ownership (marketing team vs. ops team)
- ✅ Faster CI/CD (smaller codebases)

---

## Implementation Options

### Option 1: Separate Vercel Projects (Recommended for Production)

**Repository Structure:**
```
catch-marketing/          → Deploy to thecatch.com
├── app/
│   ├── (home)/
│   ├── about/
│   ├── locations/
│   ├── blog/
│   └── events/
├── components/
└── package.json

catch-ordering/           → Deploy to order.thecatch.com
├── app/
│   ├── menu/
│   ├── checkout/
│   ├── orders/[id]/     (order tracking)
│   └── api/
│       ├── stripe/
│       └── orders/
├── components/
│   ├── cart/
│   └── checkout/
├── lib/
│   └── contexts/CartContext.tsx
└── package.json

catch-kds/                → Deploy to kds.thecatch.com
├── app/
│   ├── page.tsx         (KDS interface)
│   └── api/
│       └── orders/
│           └── update-status/
├── components/
│   └── kds/
└── package.json         (minimal dependencies!)
```

**Deployment:**
```bash
# Deploy each separately
cd catch-marketing
vercel --prod

cd catch-ordering
vercel --prod

cd catch-kds
vercel --prod
```

**Vercel Dashboard Configuration:**
```
Project: catch-marketing
├── Production Domain: thecatch.com
└── Git Branch: main

Project: catch-ordering
├── Production Domain: order.thecatch.com
└── Git Branch: main

Project: catch-kds
├── Production Domain: kds.thecatch.com
└── Git Branch: main
```

**Pros:**
- ✅ **Complete isolation** - True independence between services
- ✅ **Independent deploys** - Deploy one without affecting others
- ✅ **Different scaling** - Scale KDS and ordering independently
- ✅ **Team ownership** - Different teams can own different repos
- ✅ **Clearest separation** - No ambiguity about what goes where
- ✅ **Smallest blast radius** - Bug affects only one service

**Cons:**
- ❌ **More repos to manage** - 3+ repositories
- ❌ **Code duplication** - Some shared code (types, utils) needs to be duplicated or published as packages
- ❌ **More complex CI/CD** - Multiple pipelines to configure
- ❌ **Dependency sync** - Keeping dependencies aligned across repos

**Best For:**
- Production launch
- High-stakes operations
- Multiple teams
- Long-term maintenance

---

### Option 2: Monorepo with Multiple Apps (Good Middle Ground)

**Repository Structure:**
```
catch-monorepo/
├── apps/
│   ├── marketing/        → thecatch.com
│   │   ├── app/
│   │   ├── components/
│   │   └── package.json
│   ├── ordering/         → order.thecatch.com
│   │   ├── app/
│   │   ├── components/
│   │   └── package.json
│   └── kds/              → kds.thecatch.com
│       ├── app/
│       ├── components/
│       └── package.json
├── packages/
│   ├── types/            (shared TypeScript types)
│   │   ├── src/
│   │   └── package.json
│   ├── ui/               (shared components)
│   │   ├── src/
│   │   └── package.json
│   ├── sanity-client/    (shared Sanity config)
│   │   ├── src/
│   │   └── package.json
│   └── utils/            (shared utilities)
│       ├── src/
│       └── package.json
├── package.json          (root)
├── turbo.json            (Turborepo config)
└── pnpm-workspace.yaml   (or package.json workspaces)
```

**Root package.json:**
```json
{
  "name": "catch-monorepo",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "dev:marketing": "turbo run dev --filter=marketing",
    "dev:ordering": "turbo run dev --filter=ordering",
    "dev:kds": "turbo run dev --filter=kds",
    "build:all": "turbo run build",
    "build:ordering": "turbo run build --filter=ordering",
    "build:kds": "turbo run build --filter=kds",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  }
}
```

**Shared Package Example:**
```typescript
// packages/types/src/index.ts
export interface Location {
  _id: string;
  name: string;
  slug: string;
  // ... shared types
}

export interface Order {
  _id: string;
  orderNumber: string;
  // ... shared types
}

// packages/sanity-client/src/index.ts
import { createClient } from '@sanity/client';

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  useCdn: false,
  apiVersion: '2024-01-01',
});
```

**Usage in Apps:**
```typescript
// apps/ordering/app/menu/page.tsx
import { Location } from '@catch/types';
import { sanityClient } from '@catch/sanity-client';

// apps/kds/app/page.tsx
import { Order } from '@catch/types';
import { sanityClient } from '@catch/sanity-client';
```

**Deployment:**
```bash
# Turborepo with Vercel automatically detects changed apps
vercel --prod  # Deploys only what changed

# Or manually deploy specific app
vercel --prod --cwd=apps/ordering
vercel --prod --cwd=apps/kds
```

**Turbo.json Configuration:**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    }
  }
}
```

**Pros:**
- ✅ **Shared code** - No duplication, import shared packages
- ✅ **Single repo** - Easier to manage than multiple repos
- ✅ **Independent deploys** - Still can deploy apps separately
- ✅ **Atomic changes** - Update shared code and all apps in one PR
- ✅ **Type safety** - Shared types stay in sync
- ✅ **Better DX** - Jump between apps easily

**Cons:**
- ❌ **Setup complexity** - Turborepo/monorepo tools have learning curve
- ❌ **Build overhead** - Need to configure build system correctly
- ❌ **Larger repo** - All code in one place (can be slow)
- ❌ **Shared dependencies** - Upgrading affects all apps

**Best For:**
- Medium to large teams
- Shared component libraries
- When code sharing is important
- Long-term projects with evolving shared logic

---

### Option 3: Same Codebase, Multiple Deployments (Simplest)

**Your Current Structure:**
```
catch/
├── app/
│   ├── (marketing)/      → Deploy to thecatch.com
│   │   ├── page.tsx
│   │   ├── about/
│   │   └── locations/
│   ├── menu/             → Deploy to order.thecatch.com
│   ├── checkout/         → Deploy to order.thecatch.com
│   ├── kds/              → Deploy to kds.thecatch.com
│   └── api/
│       ├── stripe/
│       └── orders/
├── components/
│   ├── cart/
│   ├── kds/
│   └── catch/
└── lib/
    └── contexts/
```

**Create Separate Vercel Configurations:**

```json
// vercel-marketing.json
{
  "name": "catch-marketing",
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm install",
  "routes": [
    {
      "src": "/menu(.*)",
      "status": 404,
      "headers": { "Location": "https://order.thecatch.com/menu$1" }
    },
    {
      "src": "/checkout(.*)",
      "status": 404,
      "headers": { "Location": "https://order.thecatch.com/checkout$1" }
    },
    {
      "src": "/kds(.*)",
      "status": 404
    }
  ]
}

// vercel-ordering.json
{
  "name": "catch-ordering",
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm install",
  "routes": [
    {
      "src": "^/(?!menu|checkout|api/orders|api/stripe).*",
      "status": 404
    }
  ]
}

// vercel-kds.json
{
  "name": "catch-kds",
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm install",
  "routes": [
    {
      "src": "^/(?!kds|api/orders).*",
      "status": 404
    }
  ]
}
```

**Deployment Commands:**
```bash
# Marketing site
vercel --prod --config vercel-marketing.json

# Ordering site
vercel --prod --config vercel-ordering.json

# KDS
vercel --prod --config vercel-kds.json
```

**Alternative: Use Environment Variables**
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const deployment = process.env.DEPLOYMENT_TYPE; // 'marketing' | 'ordering' | 'kds'

  // Block routes based on deployment type
  if (deployment === 'kds' && !request.nextUrl.pathname.startsWith('/kds')) {
    return NextResponse.redirect(new URL('/kds', request.url));
  }

  if (deployment === 'ordering') {
    const allowedPaths = ['/menu', '/checkout', '/api/orders', '/api/stripe'];
    const isAllowed = allowedPaths.some(path => request.nextUrl.pathname.startsWith(path));
    if (!isAllowed) {
      return NextResponse.redirect(new URL('/menu', request.url));
    }
  }

  return NextResponse.next();
}
```

**Deploy with Different Env Vars:**
```bash
# Set in Vercel dashboard for each project
DEPLOYMENT_TYPE=marketing  # For thecatch.com
DEPLOYMENT_TYPE=ordering   # For order.thecatch.com
DEPLOYMENT_TYPE=kds        # For kds.thecatch.com
```

**Pros:**
- ✅ **Simplest setup** - No monorepo tools, no separate repos
- ✅ **Single codebase** - All code in one place
- ✅ **Easy development** - Run everything locally with one command
- ✅ **Shared everything** - Types, components, utils all shared naturally

**Cons:**
- ❌ **Deploy entire app 3 times** - Wasteful (same .next output deployed 3x)
- ❌ **Less true isolation** - Still same build, just different routing
- ❌ **Build breaks affect all** - TypeScript error breaks all deployments
- ❌ **Larger deployments** - Each deployment includes unused code

**Best For:**
- POC phase
- Small teams
- Quick iteration
- When you plan to split later

---

## Migration Path: Phased Approach

### Phase 1: POC (Now - Week 4)

**Strategy:** Single codebase, single deployment

**Setup:**
```
catch/
└── Deploy everything to thecatch.com
    ├── /menu (customer ordering)
    ├── /kds (kitchen display)
    └── everything else
```

**Reasoning:**
- Fastest to develop
- Easiest to iterate
- Good enough for low volume testing
- Can prove concept before investing in infrastructure

**Risk:** Low (POC volume is small, acceptable to have brief downtime)

---

### Phase 2: Soft Launch (Week 5-8)

**Strategy:** Same codebase, multiple deployments (Option 3)

**Setup:**
```bash
# Create 3 Vercel projects from same repo
vercel --prod --config vercel-marketing.json  # → thecatch.com
vercel --prod --config vercel-ordering.json   # → order.thecatch.com
vercel --prod --config vercel-kds.json        # → kds.thecatch.com
```

**Reasoning:**
- Minimal refactoring needed
- Gets you subdomain isolation quickly
- Can roll back to single deployment if issues
- Tests production architecture

**Risk:** Medium (some wasted resources, but operational reliability improved)

---

### Phase 3: Production (Month 2-3)

**Strategy:** Separate projects with shared packages (Option 1 or 2)

**Setup:**

**Option A: Separate Repos**
```bash
# Extract each app to own repo
git subtree split -P app/kds -b kds-app
# Create new repo, push kds-app branch

# Publish shared types as npm package (optional)
npm publish @catch/types
```

**Option B: Monorepo**
```bash
# Restructure into monorepo
mkdir -p apps/marketing apps/ordering apps/kds
mv app/* apps/marketing/app/
# Move ordering and KDS code to respective dirs
# Set up Turborepo
```

**Reasoning:**
- True isolation achieved
- Each service can scale independently
- Clear ownership boundaries
- Production-grade reliability

**Risk:** Low (proper architecture for scale)

---

## KDS-Specific Considerations

### Keep KDS Ultra-Minimal

**Critical:** KDS must be the most reliable service

**Strategy:**
```json
// catch-kds/package.json
{
  "name": "catch-kds",
  "dependencies": {
    "next": "16.0.0",           // Only essential deps
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "@sanity/client": "6.20.0", // For orders
    // That's it! No heavy libraries
  }
}
```

**Avoid:**
- ❌ Heavy UI libraries (MUI, Ant Design)
- ❌ Complex state management (Redux, Zustand)
- ❌ Unused features (image optimization, i18n)
- ❌ Analytics libraries
- ❌ Experimental features

**Reasoning:**
- Fewer dependencies = fewer breaking changes
- Smaller bundle = faster loads
- Less to go wrong = more reliable

---

## Reliability Enhancements

### 1. Health Checks

**Add to all services:**
```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // Test Sanity connection
    await sanityClient.fetch('*[_type == "order"][0]');

    // Test Stripe (ordering only)
    if (process.env.DEPLOYMENT_TYPE === 'ordering') {
      await stripe.paymentIntents.list({ limit: 1 });
    }

    return Response.json({
      status: 'healthy',
      service: process.env.DEPLOYMENT_TYPE || 'unknown',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Log full error details server-side for diagnostics
    const errorDetails = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('[Health Check] Service unhealthy:', {
      service: process.env.DEPLOYMENT_TYPE || 'unknown',
      error: errorDetails,
      stack: errorStack,
      timestamp: new Date().toISOString(),
    });

    // Return generic message to client without leaking internals
    return Response.json(
      {
        status: 'unhealthy',
        service: process.env.DEPLOYMENT_TYPE || 'unknown',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
```

**Monitor with:**
- UptimeRobot (free tier: 50 monitors)
- Pingdom
- Vercel's built-in monitoring

**Alert on:**
- `/api/health` returns 503
- Response time > 2 seconds
- Any 5xx errors

---

### 2. Graceful Degradation (KDS)

**Fallback to cached data if Sanity is unreachable:**

```typescript
// app/kds/page.tsx
'use client';

const [orders, setOrders] = useState<Order[]>([]);
const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'cached'>('online');

useEffect(() => {
  const fetchOrders = async () => {
    try {
      const data = await sanityClient.fetch('*[_type == "order" && ...]');
      setOrders(data);
      setConnectionStatus('online');

      // Cache for offline use
      localStorage.setItem('kds-cache', JSON.stringify(data));
      localStorage.setItem('kds-cache-time', Date.now().toString());
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setConnectionStatus('offline');

      // Load from cache
      const cached = localStorage.getItem('kds-cache');
      const cacheTime = localStorage.getItem('kds-cache-time');

      if (cached) {
        setOrders(JSON.parse(cached));
        setConnectionStatus('cached');

        const age = Date.now() - parseInt(cacheTime || '0');
        const ageMinutes = Math.floor(age / 60000);

        alert(`⚠️ Connection issue. Showing cached orders (${ageMinutes} min old)`);
      }
    }
  };

  fetchOrders();

  // Retry connection every 30 seconds if offline
  if (connectionStatus !== 'online') {
    const retry = setInterval(fetchOrders, 30000);
    return () => clearInterval(retry);
  }
}, [connectionStatus]);

return (
  <div>
    {connectionStatus !== 'online' && (
      <div className="kds-warning">
        ⚠️ {connectionStatus === 'offline' ? 'Connection lost' : 'Using cached data'}
        - Attempting to reconnect...
      </div>
    )}

    {/* Rest of KDS UI */}
  </div>
);
```

---

### 3. Real-time Fallback to Polling

**If live subscriptions fail, use polling:**

```typescript
const [updateMode, setUpdateMode] = useState<'realtime' | 'polling'>('realtime');

useEffect(() => {
  try {
    // Try real-time subscription first
    const subscription = sanityClient
      .listen(`*[_type == "order" && status in ["confirmed", "preparing", "ready"]]`)
      .subscribe({
        next: (update) => {
          setOrders(/* update orders */);
          setUpdateMode('realtime');
        },
        error: (error) => {
          console.error('Subscription failed:', error);
          setUpdateMode('polling');
        },
      });

    return () => subscription.unsubscribe();
  } catch (error) {
    // Fall back to polling immediately
    setUpdateMode('polling');
  }
}, []);

// Polling fallback
useEffect(() => {
  if (updateMode === 'polling') {
    const interval = setInterval(async () => {
      try {
        const data = await sanityClient.fetch('...');
        setOrders(data);
      } catch (error) {
        console.error('Polling failed:', error);
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }
}, [updateMode]);
```

---

### 4. Manual Order Entry Fallback

**If all else fails, have a manual process:**

```
┌─────────────────────────────────────────┐
│  KDS Goes Down                          │
│         ↓                               │
│  Kitchen uses printed order tickets     │
│  (from email confirmation)              │
│         ↓                               │
│  Manually call customers when ready     │
│         ↓                               │
│  Mark orders complete in Sanity Studio  │
│  (from phone or office computer)        │
└─────────────────────────────────────────┘
```

**Backup:** Always email order confirmations to location manager

---

## Cost Analysis

### Option 1: Separate Projects

**Vercel Costs:**
- 3 projects × $20/month = **$60/month** (Pro tier per project)
- Or use Hobby tier: **$0** (with some limitations)

**Pros:**
- True isolation
- Independent scaling

**Cons:**
- Higher Vercel costs

---

### Option 2: Monorepo

**Vercel Costs:**
- 1 repo = 3 deployments
- Turborepo caching reduces build times
- **$20-40/month** (depends on build minutes)

**Pros:**
- Shared code
- Single repo

**Cons:**
- More complex setup

---

### Option 3: Same Codebase

**Vercel Costs:**
- 3 projects pointing to same repo
- Each builds full Next.js app (wasteful)
- **$20-60/month**

**Pros:**
- Simplest setup

**Cons:**
- Most wasteful (builds same code 3x)

---

## DNS Configuration

Regardless of option chosen, DNS setup is the same:

```
# In your DNS provider (Cloudflare, etc.)

A     thecatch.com           → Vercel IP (via CNAME)
CNAME order.thecatch.com     → cname.vercel-dns.com
CNAME kds.thecatch.com       → cname.vercel-dns.com
CNAME studio.thecatch.com    → cname.vercel-dns.com (optional)

# Or if using Vercel DNS
# Configure in Vercel dashboard → Domains
```

**In Vercel Dashboard:**
```
Project: catch-marketing
  Domain: thecatch.com ✓
  Domain: www.thecatch.com ✓ (redirect to thecatch.com)

Project: catch-ordering
  Domain: order.thecatch.com ✓

Project: catch-kds
  Domain: kds.thecatch.com ✓
```

---

## Security Considerations

### KDS Access Control

**KDS should be password-protected:**

```typescript
// app/kds/page.tsx
'use client';

import { useState, useEffect } from 'react';

export default function KitchenDisplay() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check authentication status server-side
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/kds/check', {
        method: 'GET',
        credentials: 'include', // Include HTTP-only cookies
      });
      if (response.ok) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      // Not authenticated, show login
      setIsAuthenticated(false);
    }
  };

  const handleLogin = async (password: string) => {
    setIsLoading(true);
    try {
      // Call server-side authentication endpoint
      // This endpoint verifies the password and sets an HTTP-only cookie
      const response = await fetch('/api/auth/kds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include HTTP-only cookies
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        alert('Incorrect password');
      }
    } catch (error) {
      alert('Authentication error. Please try again.');
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} isLoading={isLoading} />;
  }

  return <KDSContent />;
}
```

**Create the server-side authentication endpoint:**
```typescript
// app/api/auth/kds/route.ts
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.KDS_JWT_SECRET || 'your-secret-key-change-in-production'
);

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    
    // Verify password using hash-based comparison (timing-safe)
    const { createHash, timingSafeEqual } = await import('crypto');
    
    const inputHash = createHash('sha256').update(password || '').digest();
    const expectedHash = createHash('sha256').update(process.env.KDS_PASSWORD || '').digest();
    const isValidPassword = timingSafeEqual(inputHash, expectedHash);
    
    if (!isValidPassword) {
      return Response.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    // Set HTTP-only cookie
    const cookieJar = await cookies();
    cookieJar.set('kds-auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400, // 24 hours
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('KDS auth error:', error);
    return Response.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

// Check authentication status
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

    // Verify JWT
    await jwtVerify(token, JWT_SECRET);
    return Response.json({ authenticated: true });
  } catch (error) {
    return Response.json(
      { authenticated: false },
      { status: 401 }
    );
  }
}
```

**Protect KDS routes with middleware:**
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.KDS_JWT_SECRET || 'your-secret-key-change-in-production'
);

export async function middleware(request: NextRequest) {
  // Only protect KDS routes
  if (request.nextUrl.pathname.startsWith('/kitchen')) {
    const token = request.cookies.get('kds-auth')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/kitchen/login', request.url));
    }

    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.next();
    } catch (error) {
      return NextResponse.redirect(new URL('/kitchen/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/kitchen/:path*'],
};
```

        {
          "key": "X-Robots-Tag",
          "value": "noindex, nofollow"
        }
      ]
    }
  ]
}
```

---

## Monitoring Strategy

### What to Monitor

**KDS (Critical):**
- ✅ Uptime (99.9% target)
- ✅ Response time (<500ms)
- ✅ Error rate (<0.1%)
- ✅ Order fetch latency
- ✅ Real-time subscription health

**Ordering (Critical):**
- ✅ Uptime (99.9% target)
- ✅ Checkout success rate (>95%)
- ✅ Payment processing success (>98%)
- ✅ API response times
- ✅ Cart abandonment rate

**Marketing (Non-Critical):**
- ✅ Uptime (95% target - acceptable downtime)
- ✅ Page load times
- ✅ SEO metrics

### Alert Thresholds

```yaml
# .github/workflows/monitoring.yml

KDS:
  - alert: KDS_Down
    condition: uptime < 100% (5 min window)
    action: Immediately notify ops team via SMS + Slack
    severity: P0 (critical)

  - alert: KDS_Slow
    condition: response_time > 1000ms
    action: Notify ops team via Slack
    severity: P1 (high)

Ordering:
  - alert: Checkout_Down
    condition: uptime < 100% (5 min window)
    action: Immediately notify dev team + ops
    severity: P0 (critical)

  - alert: Payment_Failures
    condition: payment_success_rate < 95% (15 min window)
    action: Notify dev team
    severity: P1 (high)

Marketing:
  - alert: Site_Down
    condition: uptime < 95% (30 min window)
    action: Notify dev team (non-urgent)
    severity: P2 (medium)
```

---

## Rollback Strategy

### If Deployment Breaks

**Vercel has instant rollback:**

```bash
# In Vercel dashboard or CLI
vercel rollback  # Rolls back to previous deployment

# Or redeploy specific commit
vercel --prod --force  # Force redeploy of current git commit
```

**For each service:**
- KDS breaks → Rollback only KDS (ordering and marketing unaffected)
- Ordering breaks → Rollback only ordering (KDS and marketing unaffected)
- Marketing breaks → Rollback only marketing (critical services unaffected)

---

## Summary & Recommendation

### **POC Phase (Now - Week 4):**
**Use:** Option 3 (Same codebase, single deployment)
```bash
# Deploy everything to thecatch.com
vercel --prod
```

**Why:** Fastest iteration, prove concept

---

### **Soft Launch (Week 5-8):**
**Use:** Option 3 (Same codebase, multiple deployments)
```bash
# Deploy to separate subdomains
vercel --prod --config vercel-marketing.json
vercel --prod --config vercel-ordering.json
vercel --prod --config vercel-kds.json
```

**Why:** Get subdomain isolation without major refactoring

---

### **Production (Month 2+):**
**Use:** Option 1 (Separate projects)
```
catch-marketing/  → thecatch.com
catch-ordering/   → order.thecatch.com
catch-kds/        → kds.thecatch.com
```

**Why:** True isolation, production-grade reliability, independent scaling

---

## Key Takeaways

1. **Subdomain isolation is smart** - Critical services shouldn't share deployment with marketing
2. **Start simple, evolve** - Don't over-engineer for POC, but plan the migration path
3. **KDS is most critical** - Keep it minimal, make it bulletproof
4. **Progressive enhancement** - Each phase improves reliability without blocking progress
5. **Monitor everything** - Health checks, alerts, and fallbacks are essential

**Your instinct was 100% correct.** Separating critical services from marketing protects revenue and operations. 🎯
