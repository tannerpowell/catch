# Kitchen Dashboard

iPad-optimized order management system for The Catch restaurant kitchen staff. Built with Next.js, Sanity CMS, and Apple Human Interface Guidelines.

## Overview

**Route:** `/kitchen`
**Status:** Development (hidden header/footer via CSS)
**Deployment:** Will be extracted to separate app at `kds.thecatch.com` for production

The kitchen dashboard displays active orders in a 3-column kanban board (New → Preparing → Ready) with real-time updates, touch-optimized controls, and iPad-native design patterns.

## Quick Start

```bash
npm run dev
# Visit http://localhost:3000/kitchen
```

**Note:** Header/footer are hidden via CSS using `RouteMarker` component. They'll be visible in HTML source but not rendered.

## Architecture

### Current Setup (Development)
- Lives at `/app/kitchen/` within main Next.js app
- Shares components, types, and API routes with main site
- Header/footer hidden via `html[data-route^="/kitchen"]` CSS selector
- `RouteMarker` component sets `data-route` attribute on navigation

### Production Setup (Future)
Extract to separate Next.js app deployed at `kds.thecatch.com`:
1. Copy `/app/kitchen/*` → new app
2. Copy `/components/kitchen/*` → new app
3. Copy `/app/styles/kitchen.css` → new app
4. Copy `/app/api/orders/*` → new app
5. Copy shared types from `/lib/types.ts`

**Why separate app?** Reliability isolation - kitchen operations won't be affected by marketing site issues or deployments.

## File Structure

```
app/
├── kitchen/
│   ├── page.tsx              # Dashboard page (Sanity fetch + auto-refresh)
│   ├── layout.tsx            # iPad metadata, PWA config
│   └── register-sw.tsx       # Service worker registration
├── api/orders/
│   └── update-status/
│       └── route.ts          # PATCH /api/orders/update-status
└── styles/
    └── kitchen.css           # iOS design system (540 lines)

components/
└── kitchen/
    ├── KitchenBoard.tsx      # Main board (filters by status)
    ├── OrderColumn.tsx       # Kanban column
    ├── OrderCard.tsx         # Order card with actions
    └── OrderTimer.tsx        # Live timer with color warnings

public/
├── manifest.json             # PWA manifest
├── sw.js                     # Service worker
└── icons/                    # App icons (SVG placeholders)

components/
└── RouteMarker.tsx           # Sets data-route for CSS hiding
```

## Design System

### Apple HIG Compliance
- **8-point grid:** All spacing in 8px increments (8, 16, 24, 32, 40, 48)
- **Typography:** SF Pro system font stack (-apple-system, BlinkMacSystemFont)
- **Touch targets:** Minimum 44px (Apple standard)
- **Colors:** iOS semantic colors with light/dark mode
- **Motion:** 250ms cubic-bezier transitions
- **Safe areas:** Support for iPad notch via `env(safe-area-inset-*)`

### Key CSS Variables
```css
--spacing-md: 16px
--spacing-lg: 24px
--font-size-base: 16px
--font-size-xl: 22px
--color-blue: #007aff (light) / #0a84ff (dark)
--color-green: #34c759 (light) / #30d158 (dark)
--touch-target-min: 44px
```

## Components

### KitchenBoard
Fetches orders from Sanity, filters by status, renders 3 columns.

```typescript
const confirmedOrders = orders.filter(o => o.status === 'confirmed');
const preparingOrders = orders.filter(o => o.status === 'preparing');
const readyOrders = orders.filter(o => o.status === 'ready');
```

### OrderCard
Shows order details with touch-optimized action button.

**Features:**
- Customer info with tap-to-call phone
- Item list with modifiers and special instructions
- Live timer with color warnings (orange at 15min, red at 30min)
- Large action button (Start Cooking / Mark Ready / Complete)
- Optimistic UI updates

**API Call:**
```typescript
POST /api/orders/update-status
{ orderId: "order-123", newStatus: "preparing" }
```

### OrderTimer
Auto-updates every 30 seconds, shows relative time.

**States:**
- Default (gray): < 15 minutes
- Warning (orange): 15-29 minutes
- Critical (red): 30+ minutes

## Data Flow

1. **Initial Load:** `page.tsx` fetches orders from Sanity (status: confirmed/preparing/ready)
2. **Auto-refresh:** Polls every 30 seconds
3. **Status Update:** User taps button → POST to API → Sanity update → manual refresh
4. **Real-time (future):** Replace polling with Sanity subscriptions

## API Routes

### POST `/api/orders/update-status`

Updates order status and sets timestamp.

**Request:**
```json
{
  "orderId": "order-abc123",
  "newStatus": "preparing"
}
```

**Response:**
```json
{
  "success": true,
  "order": { /* updated order */ }
}
```

**Status Flow:**
- `confirmed` → `preparing` (sets `preparingAt`)
- `preparing` → `ready` (sets `readyAt`)
- `ready` → `completed` (sets `completedAt`)

**Auth:** None (add later for production)

## PWA Setup

### Manifest (`/public/manifest.json`)
```json
{
  "name": "The Catch Kitchen Dashboard",
  "short_name": "Kitchen",
  "start_url": "/kitchen",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#000000"
}
```

### Service Worker (`/public/sw.js`)
- Network-first for API calls
- Cache-first for static assets
- Offline fallback support
- Push notification infrastructure (future)

### iPad Installation
1. Open Safari → navigate to `/kitchen`
2. Tap Share → "Add to Home Screen"
3. Launches in standalone mode (no browser UI)

**Icons:** Currently using SVG placeholders. For production, generate PNG icons:
```bash
# Create 1024x1024 source icon, then:
brew install imagemagick
cd public/icons
for size in 72 96 128 144 152 180 192 384 512; do
  convert ../icon-source.png -resize ${size}x${size} icon-${size}x${size}.png
done
```

## Environment Variables

```bash
# Required
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your-write-token  # For order updates
```

## Sanity Query

```groq
*[_type == "order" && status in ["confirmed", "preparing", "ready"]]
| order(createdAt asc)
{
  _id,
  orderNumber,
  status,
  customer { name, email, phone },
  items[] {
    quantity,
    menuItemSnapshot { name, basePrice },
    modifiers[] { name, option, priceDelta },
    specialInstructions
  },
  total,
  orderType,
  createdAt,
  specialInstructions
}
```

## Responsive Breakpoints

```css
/* Desktop: 3 columns */
@media (min-width: 1025px) { grid-template-columns: repeat(3, 1fr); }

/* iPad: 2 columns */
@media (max-width: 1024px) { grid-template-columns: repeat(2, 1fr); }

/* iPhone: 1 column */
@media (max-width: 640px) { grid-template-columns: 1fr; }
```

## Development Notes

### Hiding Header/Footer
The `RouteMarker` component (`/components/RouteMarker.tsx`) sets `data-route` attribute on `<html>` element. CSS in `/app/globals.css` hides header/footer:

```css
html[data-route^="/kitchen"] .header,
html[data-route^="/kitchen"] .footer,
html[data-route^="/kitchen"] .full-page-menu,
html[data-route^="/kitchen"] [class*="ThemeToggle"] {
  display: none !important;
}
```

**Why this approach?**
- Fast iteration in single codebase
- Can share components/types/utils with main site
- Easy to extract later
- No complex route group setup

## Future Enhancements

### Phase 1: Real-time
- [ ] Replace polling with Sanity real-time subscriptions
- [ ] WebSocket connection indicator
- [ ] Sound notifications for new orders

### Phase 2: Features
- [ ] Order filtering (by type, time range)
- [ ] Search by customer name/phone
- [ ] Print receipts
- [ ] Batch actions (mark multiple ready)
- [ ] Prep time analytics

### Phase 3: Native App
- [ ] Extract to separate Next.js app
- [ ] Deploy to `kds.thecatch.com`
- [ ] Consider React Native for iPadOS app
- [ ] Native push notifications
- [ ] Haptic feedback

## Troubleshooting

**Orders not loading**
- Check Sanity credentials in `.env.local`
- Verify Sanity allows public queries
- Check browser console for CORS errors

**Header/footer showing**
- Ensure `RouteMarker` component is in root layout
- Check browser DevTools → `<html data-route="/kitchen">`
- Verify CSS is loaded (check Network tab)

**Status updates failing**
- Check `SANITY_API_TOKEN` has write permissions
- Verify order ID exists in Sanity
- Check API route logs for errors

**PWA not installing**
- Must be served over HTTPS (or localhost)
- Verify `/manifest.json` is accessible
- Check icons exist in `/public/icons/`
- Test in Safari (Chrome PWA support is limited on iOS)

## Production Checklist

When extracting to separate app for `kds.thecatch.com`:

- [ ] Create new Next.js project
- [ ] Copy all kitchen files/components
- [ ] Remove `RouteMarker` and CSS hiding logic
- [ ] Generate production PNG icons (512x512, 192x192 minimum)
- [ ] Add authentication (staff login)
- [ ] Set up real-time Sanity subscriptions
- [ ] Configure CORS for API routes
- [ ] Add error tracking (Sentry)
- [ ] Test offline functionality
- [ ] Deploy to Vercel with `kds.thecatch.com` domain
- [ ] Update Stripe Connect dashboard links
- [ ] Document staff onboarding process

## Related Documentation

- `/docs/ecommerce/DEPLOYMENT-ARCHITECTURE.md` - Subdomain isolation strategy
- `/docs/ecommerce/MULTI-LOCATION-IMPLEMENTATION-SUMMARY.md` - Overall e-commerce architecture
- `/docs/ecommerce/ORDER-MANAGEMENT-OPTIONS.md` - Why we chose Sanity for KDS
