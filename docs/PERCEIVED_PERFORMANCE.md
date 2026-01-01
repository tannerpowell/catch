# Perceived Performance Guide for Next.js Applications

A comprehensive guide for implementing perceived performance optimizations in Next.js applications. Perceived performance is about making applications *feel* fast, even when actual load times remain unchanged.

## Core Principle: The 3-Layer Feedback Model

Users perceive speed through feedback timing, not actual completion time. Implement three layers of feedback:

| Layer | Timing | Purpose |
|-------|--------|---------|
| **Immediate** | 0ms | Acknowledge the action (progress bar starts) |
| **Fast** | <100ms | Show structure of incoming content (skeleton) |
| **Complete** | Variable | Fade in actual content smoothly |

The key insight: **Users don't mind waiting if they know something is happening.**

---

## 1. Navigation Progress Bar

A top-of-screen progress bar that provides feedback on slow navigations. **Important**: Only show the progress bar if navigation takes longer than ~150ms. Fast navigations should feel instant without a flashing progress bar.

### Implementation

```tsx
// src/components/navigation-progress.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const [progress, setProgress] = useState(0);

  // Reset on route change complete
  useEffect(() => {
    setIsNavigating(false);
    setShowBar(false);
    setProgress(0);
  }, [pathname, searchParams]);

  // Listen for link clicks to start tracking navigation
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (
        anchor?.href &&
        anchor.href.startsWith(window.location.origin) &&
        !anchor.hasAttribute("download") &&
        !anchor.target &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey
      ) {
        const url = new URL(anchor.href);
        if (url.pathname !== pathname) {
          setIsNavigating(true);
        }
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

  // Only show progress bar if navigation takes longer than 150ms
  useEffect(() => {
    if (!isNavigating) return;

    const showTimer = setTimeout(() => {
      setShowBar(true);
      setProgress(20);
    }, 150);

    return () => clearTimeout(showTimer);
  }, [isNavigating]);

  // Animate progress while navigating
  useEffect(() => {
    if (!showBar) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        const increment = Math.max(1, (90 - prev) / 10);
        return Math.min(90, prev + increment);
      });
    }, 100);

    return () => clearInterval(timer);
  }, [showBar]);

  if (!showBar || progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1">
      <div
        className="h-full bg-gradient-to-r from-primary via-primary to-primary/50 transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          boxShadow: "0 0 10px var(--primary), 0 0 5px var(--primary)",
        }}
      />
    </div>
  );
}
```

### Integration (Root Layout)

```tsx
// src/app/layout.tsx
import { Suspense } from "react";
import { NavigationProgress } from "@/components/navigation-progress";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
```

### Why It Works

- **150ms threshold**: Only shows for slow navigations - fast ones feel instant without jarring flash
- **Asymptotic approach to 90%**: Progress slows as it approaches 90%, never completing until the page actually loads
- **Glowing effect**: The box-shadow creates a premium feel that draws attention

---

## 2. Route Loading Skeletons

Use Next.js `loading.tsx` files to show skeleton UI that matches the actual page structure.

### Skeleton Component

```tsx
// src/components/ui/skeleton.tsx
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-primary/10", className)}
      {...props}
    />
  );
}
```

### Loading File Pattern

Create `loading.tsx` files that mirror the actual page layout:

```tsx
// src/app/dashboard/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header skeleton - matches actual header structure */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats grid skeleton - matches actual 4-column grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border p-4 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Content skeleton - matches actual content area */}
      <div className="rounded-xl border p-6 space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}
```

### Skeleton Design Principles

1. **Match the layout exactly**: Count columns, measure proportions, mirror the real structure
2. **Use consistent heights**: Headers ~h-6 to h-8, body text ~h-4, small text ~h-3
3. **Vary widths realistically**: Not everything is full-width; use w-24, w-48, w-3/4, etc.
4. **Add entrance animation**: `animate-in fade-in duration-300` prevents jarring appearance
5. **Group related elements**: Wrap related skeletons in containers that match real groupings

### Common Skeleton Patterns

```tsx
// Card with header and content
<div className="rounded-xl border p-5 space-y-3">
  <div className="flex items-center justify-between">
    <Skeleton className="h-5 w-32" />
    <Skeleton className="h-5 w-16" />
  </div>
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-2 w-full rounded-full" /> {/* Progress bar */}
</div>

// Avatar with text
<div className="flex items-center gap-3">
  <Skeleton className="h-10 w-10 rounded-full" />
  <div className="space-y-1">
    <Skeleton className="h-4 w-28" />
    <Skeleton className="h-3 w-20" />
  </div>
</div>

// Stats card
<div className="p-4 space-y-2">
  <Skeleton className="h-4 w-24" />
  <Skeleton className="h-9 w-16" />
  <Skeleton className="h-3 w-28" />
</div>

// Table row
<div className="flex items-center justify-between py-3 border-b">
  <Skeleton className="h-4 w-32" />
  <Skeleton className="h-4 w-24" />
  <Skeleton className="h-8 w-20 rounded-md" />
</div>
```

---

## 3. Dynamic Imports for Heavy Dependencies

Split large dependencies out of the main bundle so they only load when needed.

### Pattern: Lazy Component Loading

```tsx
// Instead of:
import { HeavyComponent } from "@/components/heavy-component";

// Do this:
import dynamic from "next/dynamic";

const HeavyComponent = dynamic(
  () => import("@/components/heavy-component").then((mod) => mod.HeavyComponent),
  {
    ssr: false,
    loading: () => (
      <Button disabled className="gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading...
      </Button>
    ),
  }
);
```

### Common Candidates for Dynamic Import

| Library | Size | When to Load |
|---------|------|--------------|
| `@react-pdf/renderer` | ~500KB | Only when generating PDFs |
| Chart libraries (recharts, chart.js) | ~200-400KB | Only on analytics pages |
| Rich text editors (TipTap, Slate) | ~300KB | Only when editing |
| Code editors (Monaco, CodeMirror) | ~1MB+ | Only on code pages |
| Map libraries (Mapbox, Leaflet) | ~200KB | Only on map views |
| Date pickers (react-datepicker) | ~50KB | Only in forms |

### Example: PDF Export Button

```tsx
"use client";

import dynamic from "next/dynamic";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// @react-pdf/renderer is ~500KB - only load when user wants to export
const PDFDownloadButton = dynamic(
  () => import("@/components/pdf-download-button").then((mod) => mod.PDFDownloadButton),
  {
    ssr: false,
    loading: () => (
      <Button variant="outline" disabled className="gap-2">
        <Download className="h-4 w-4" />
        Export PDF
      </Button>
    ),
  }
);

export function ReportPage({ data }) {
  return (
    <div>
      <h1>Report</h1>
      {/* PDF button loads its heavy dependency only when rendered */}
      <PDFDownloadButton data={data} />
    </div>
  );
}
```

---

## 4. Development Cache Warming

In development, Turbopack compiles routes on-demand. Warm the cache after server start to eliminate first-visit latency.

### Warmup Script

```ts
// scripts/warmup-routes.ts
#!/usr/bin/env tsx

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// List all routes to warm up
const routes = [
  "/",
  "/login",
  "/dashboard",
  "/settings",
  "/profile",
  // Add all your routes here
];

async function warmup() {
  console.log(`Warming up ${routes.length} routes...`);
  const start = Date.now();

  const results = await Promise.allSettled(
    routes.map(async (route) => {
      const url = `${BASE_URL}${route}`;
      const routeStart = Date.now();
      try {
        const res = await fetch(url, { headers: { "X-Warmup": "true" } });
        const elapsed = Date.now() - routeStart;
        const status = res.status === 200 || res.status === 307 ? "✓" : "✗";
        console.log(`  ${status} ${route} (${elapsed}ms)`);
        return { route, status: res.status, elapsed };
      } catch (error) {
        const elapsed = Date.now() - routeStart;
        console.log(`  ✗ ${route} (${elapsed}ms) - failed`);
        throw error;
      }
    })
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  console.log(`\nWarmed ${succeeded}/${routes.length} routes in ${Date.now() - start}ms`);
}

warmup().catch(console.error);
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "dev:warm": "next dev --turbopack & sleep 4 && pnpm warmup && wait",
    "warmup": "tsx scripts/warmup-routes.ts"
  }
}
```

### Usage

```bash
# Option 1: Manual warmup after dev server starts
pnpm dev
# In another terminal:
pnpm warmup

# Option 2: Auto-warmup (starts server, waits 4s, warms routes)
pnpm dev:warm
```

---

## 5. Next.js Caching Configuration

### Turbopack Persistent Caching (Next.js 16+)

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      // Keep cache valid across more scenarios
      unstable_persistentCaching: true,
    },
  },
};

export default nextConfig;
```

### Preserve .next Directory

The `.next` folder contains compiled assets. Preserving it between restarts keeps the cache warm.

**Do NOT add to .gitignore (it already should be there, but don't delete it locally):**
- The cache survives dev server restarts
- Only delete when troubleshooting build issues

---

## 6. Additional Techniques

### Optimistic UI Updates

Update UI immediately, then sync with server:

```tsx
function LikeButton({ postId, initialLiked }) {
  const [liked, setLiked] = useState(initialLiked);

  const handleClick = async () => {
    // Update UI immediately
    setLiked(!liked);

    // Sync with server in background
    try {
      await fetch(`/api/posts/${postId}/like`, { method: "POST" });
    } catch {
      // Revert on failure
      setLiked(liked);
      toast.error("Failed to update");
    }
  };

  return <Button onClick={handleClick}>{liked ? "Unlike" : "Like"}</Button>;
}
```

### Prefetching on Hover

Next.js prefetches links automatically, but you can be more aggressive:

```tsx
import Link from "next/link";

// Next.js prefetches when link enters viewport
<Link href="/dashboard">Dashboard</Link>

// For non-link elements, prefetch on hover:
import { useRouter } from "next/navigation";

function NavItem({ href, children }) {
  const router = useRouter();

  return (
    <button
      onMouseEnter={() => router.prefetch(href)}
      onClick={() => router.push(href)}
    >
      {children}
    </button>
  );
}
```

### Blur Placeholders for Images

```tsx
import Image from "next/image";

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..." // Low-res version
/>
```

### Suspense Boundaries for Streaming

Wrap slow components in Suspense to stream the rest of the page:

```tsx
import { Suspense } from "react";

export default function Page() {
  return (
    <div>
      <Header /> {/* Streams immediately */}

      <Suspense fallback={<CommentsSkeleton />}>
        <Comments /> {/* Streams when ready */}
      </Suspense>

      <Footer /> {/* Streams immediately */}
    </div>
  );
}
```

---

## Implementation Checklist

When adding perceived performance to a Next.js app:

- [ ] Add `NavigationProgress` component to root layout
- [ ] Create `loading.tsx` for each major route group
- [ ] Audit dependencies >100KB and add dynamic imports
- [ ] Create warmup script with all routes
- [ ] Add `dev:warm` script to package.json
- [ ] Enable `unstable_persistentCaching` if on Next.js 16+
- [ ] Add Suspense boundaries around slow async components
- [ ] Use optimistic updates for user actions
- [ ] Add blur placeholders for above-fold images

---

## Measuring Perceived Performance

Use browser DevTools:

1. **Performance tab**: Record a navigation, look for "First Contentful Paint"
2. **Network tab**: Enable throttling to simulate slow connections
3. **Lighthouse**: Check "Time to Interactive" and "Speed Index"

The goal is not zero load time—it's zero *perceived* wait time. Users should always see immediate feedback, progressive content loading, and smooth transitions.
