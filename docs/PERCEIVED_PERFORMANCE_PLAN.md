# Perceived Performance Implementation Plan

This plan adapts the techniques from `PERCEIVED_PERFORMANCE.md` to The Catch project's specific architecture.

---

## Current State Assessment

### Already Implemented ✅

| Feature | Status | Notes |
|---------|--------|-------|
| Skeleton component | ✅ Done | `components/ui/skeleton.tsx` - matches guide pattern |
| LocationsMap lazy loading | ✅ Done | Dynamic import with loading fallback in `LocationsPageClient.tsx` |
| MenuPdfDocument lazy loading | ✅ Done | Dynamic import with loading fallback (~500KB saved from initial) |
| Preconnect hints | ✅ Done | `cdn.sanity.io` and `api.mapbox.com` in root layout |
| 5 loading.tsx files | ✅ Partial | Exist but use inline styles instead of Skeleton component |

### Gaps to Address

| Feature | Priority | Impact |
|---------|----------|--------|
| Navigation Progress Bar | 🔴 High | 0ms feedback on every navigation |
| Missing loading.tsx files | 🔴 High | 26+ routes have no skeleton loading state |
| Warmup script | 🟡 Medium | Dev experience improvement |
| ~~Turbopack persistent caching~~ | ⚪ Skip | Experimental - `unstable_` prefix indicates risk |
| Upgrade existing loading.tsx | 🟢 Low | Consistency improvement |

---

## Implementation Plan

### Phase 1: Navigation Progress Bar (High Impact)

**What**: Add a glowing progress bar that provides feedback on slow navigations. Only shows if navigation takes >150ms - fast navigations feel instant without a jarring flash.

**Files to create/modify**:
1. `components/NavigationProgress.tsx` - New component
2. `app/layout.tsx` - Add to root layout wrapped in Suspense

**Key design decision**: The progress bar uses a 150ms threshold before appearing. This prevents the bar from flashing on fast navigations while still providing feedback on slow ones.

**Brand alignment**: Uses `#2B7A9B` (ocean blue) to match The Catch's design system.

**Implementation**: See `components/NavigationProgress.tsx` for the full implementation.

---

### Phase 2: Add Missing loading.tsx Files (High Impact)

**What**: Create skeleton loading states for all major routes.

**Routes needing loading.tsx** (26 total):

| Route | Priority | Skeleton Pattern |
|-------|----------|------------------|
| `/` (homepage) | High | Hero + featured sections |
| `/menu` | High | 3-pane menu layout |
| `/checkout` | High | Cart + form |
| `/kitchen` | High | Order cards grid |
| `/our-story` | Medium | Content blocks |
| `/gift-cards` | Medium | Product grid |
| `/private-events` | Medium | Content + form |
| `/features` | Medium | Feature cards |
| `/locations/[slug]` | Medium | Location detail |
| `/account` | Medium | Profile layout |
| `/account/settings` | Medium | Settings form |
| `/order-confirmation` | Medium | Confirmation card |
| `/print-menu` | Low | Print preview |
| `/print-menu/[locationSlug]` | Low | Print preview |
| `/tv-menu-display` | Low | TV layout |
| `/tv-menu-display/[locationSlug]` | Low | TV layout |
| `/studio/[[...index]]` | Low | Sanity Studio (has own loader) |
| `/modal` | Low | Demo page |
| `/design-demo` | Low | Demo page |
| `/test` | Skip | Dev only |
| `/sitemap` | Skip | Technical |
| `/sitemap/locations-archive` | Skip | Archive |
| `/categories-analysis` | Skip | Dev only |
| `/image-compare` | Skip | Dev only |
| `/(auth)/sign-in` | Skip | Clerk handles |
| `/(auth)/sign-up` | Skip | Clerk handles |

**High Priority Skeletons to Create**:

1. **Homepage** (`app/loading.tsx`):
```tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="animate-in fade-in duration-300">
      {/* Hero skeleton */}
      <div className="h-[60vh] relative">
        <Skeleton className="absolute inset-0" />
      </div>

      {/* Featured sections */}
      <div className="container mx-auto py-12 space-y-8">
        <Skeleton className="h-8 w-48 mx-auto" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-4/3 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

2. **Menu Page** (`app/menu/loading.tsx`):
```tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function MenuLoading() {
  return (
    <div className="min-h-screen bg-(--color--dark-slate-deepest) animate-in fade-in duration-300">
      {/* Location selector bar */}
      <div className="border-b border-white/10 p-4">
        <Skeleton className="h-10 w-64 mx-auto bg-white/5" />
      </div>

      {/* 3-pane layout */}
      <div className="flex">
        {/* Categories sidebar */}
        <div className="w-48 p-4 space-y-2 hidden md:block">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-8 w-full bg-white/5" />
          ))}
        </div>

        {/* Menu items grid */}
        <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex justify-between p-3 border-b border-white/10">
              <Skeleton className="h-5 w-40 bg-white/5" />
              <Skeleton className="h-5 w-16 bg-white/5" />
            </div>
          ))}
        </div>

        {/* Preview pane */}
        <div className="w-80 p-4 hidden lg:block">
          <Skeleton className="aspect-square w-full bg-white/5" />
          <Skeleton className="h-6 w-3/4 mt-4 bg-white/5" />
          <Skeleton className="h-4 w-full mt-2 bg-white/5" />
        </div>
      </div>
    </div>
  );
}
```

3. **Checkout** (`app/checkout/loading.tsx`):
```tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function CheckoutLoading() {
  return (
    <div className="container mx-auto py-8 animate-in fade-in duration-300">
      <Skeleton className="h-8 w-32 mb-8" />

      <div className="grid md:grid-cols-2 gap-8">
        {/* Cart items */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 p-4 border rounded-lg">
              <Skeleton className="h-20 w-20 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="p-6 border rounded-lg space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}
```

4. **Kitchen Display** (`app/kitchen/loading.tsx`):
```tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function KitchenLoading() {
  return (
    <div className="min-h-screen bg-slate-900 p-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-8 w-48 bg-slate-700" />
        <Skeleton className="h-10 w-32 bg-slate-700" />
      </div>

      {/* Order cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bg-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-6 w-20 bg-slate-700" />
              <Skeleton className="h-6 w-16 bg-slate-700" />
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map((j) => (
                <Skeleton key={j} className="h-4 w-full bg-slate-700" />
              ))}
            </div>
            <Skeleton className="h-10 w-full bg-slate-700 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### Phase 3: Development Warmup Script (Medium Impact)

**What**: Script to pre-compile all routes after dev server starts.

**Files to create**:
1. `scripts/warmup-routes.ts` - Warmup script

**Implementation**:
```ts
// scripts/warmup-routes.ts
#!/usr/bin/env tsx

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const routes = [
  "/",
  "/menu",
  "/locations",
  "/checkout",
  "/kitchen",
  "/our-story",
  "/gift-cards",
  "/private-events",
  "/features",
  "/account",
  "/account/orders",
  "/account/settings",
  "/print-menu",
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
      } catch {
        const elapsed = Date.now() - routeStart;
        console.log(`  ✗ ${route} (${elapsed}ms) - failed`);
        throw new Error(`Failed to warm ${route}`);
      }
    })
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  console.log(`\nWarmed ${succeeded}/${routes.length} routes in ${Date.now() - start}ms`);
}

warmup().catch(console.error);
```

**package.json updates**:
```json
{
  "scripts": {
    "warmup": "tsx scripts/warmup-routes.ts",
    "dev:warm": "next dev --turbopack & sleep 4 && pnpm warmup && wait"
  }
}
```

---

### ~~Phase 4: Turbopack Persistent Caching~~ — SKIPPED

Deprioritized due to experimental status (`unstable_` prefix). Uptime > milliseconds.

---

### Phase 4: Upgrade Existing loading.tsx Files (Low Impact)

**What**: Refactor existing loading files to use Skeleton component for consistency.

**Files to update**:
- `app/locations/loading.tsx` - Replace inline bounce loader with Skeleton-based skeleton
- `app/menu2/loading.tsx`
- `app/menu-legacy/loading.tsx`
- `app/account/orders/loading.tsx`
- `app/orders/[orderNumber]/loading.tsx`

---

## Implementation Order

```text
Week 1:
├── Phase 1: Navigation Progress Bar (2 hours)
│   ├── Create NavigationProgress component
│   └── Integrate into root layout
│
└── Phase 2a: High-Priority loading.tsx (4 hours)
    ├── Homepage loading.tsx
    ├── Menu loading.tsx
    ├── Checkout loading.tsx
    └── Kitchen loading.tsx

Week 2:
├── Phase 2b: Medium-Priority loading.tsx (3 hours)
│   ├── our-story, gift-cards, private-events
│   ├── locations/[slug], features
│   └── account pages
│
└── Phase 3: Warmup Script (1 hour)

Week 3 (Optional):
└── Phase 4: Upgrade existing loading.tsx (2 hours)
```

---

## Verification Checklist

After implementation, verify:

- [ ] Navigation progress bar appears immediately on link click
- [ ] Progress bar uses ocean blue (#2B7A9B) brand color
- [ ] All high-traffic routes show skeleton on slow connection
- [ ] Skeletons match actual page layouts
- [ ] `pnpm warmup` successfully pre-compiles routes
- [ ] Lighthouse "Time to Interactive" improved

---

## Measuring Success

Use Chrome DevTools:

1. **Network tab**: Enable "Slow 3G" throttling
2. **Navigate between pages**: Should see immediate progress bar + skeleton
3. **Performance tab**: Record navigation, check "First Contentful Paint"
4. **Lighthouse**: Run before/after, compare Speed Index

Target metrics:
- First feedback: **<50ms** (progress bar starts)
- Skeleton visible: **<100ms** (structure appears)
- Full content: Variable (but user perceives fast due to feedback)
