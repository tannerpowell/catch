# Accounting & Tax Integration

## Current State

Tax is calculated **in the cart** (not via Stripe):

1. **Tax rates** are stored per location in Sanity as a decimal (e.g., 0.0825 for 8.25%)
2. **CartContext** calculates: `tax = subtotal * location.taxRate`
3. **Orders** store both the calculated `tax` amount and `taxRate` snapshot
4. **Stripe** receives only the final total - no tax breakdown

### Data Available Per Order

```typescript
{
  subtotal: number,      // Sum of items before tax
  tax: number,           // Calculated tax amount
  taxRate: number,       // Rate used (e.g., 0.0825)
  tip: number,
  deliveryFee: number,
  total: number,
  location: string,      // Which location
  items: [...],          // Line items with prices
  createdAt: timestamp
}
```

---

## Questions for the Business

Before choosing a solution, we need to understand:

1. **What accounting software do you use?** (QuickBooks, Xero, FreshBooks, other?)
2. **Who handles tax filing?** (In-house, accountant, service?)
3. **Do you need automated tax filing?** Or just reports for your accountant?
4. **Multi-state nexus** - Are you registered to collect tax in both TX and OK?
5. **What reports do you need?**
   - Daily/weekly/monthly sales by location?
   - Tax collected by jurisdiction?
   - Product mix / category breakdowns?

---

## Integration Options

### Option 1: Stripe Tax (Recommended if staying with Stripe)

**What it does:**
- Automatic tax calculation based on customer location
- Handles varying rates across TX/OK jurisdictions
- Built-in reporting in Stripe Dashboard
- Can generate reports for tax filing

**Pros:**
- Already integrated with Stripe
- No separate vendor
- Handles tax rate updates automatically

**Cons:**
- 0.5% per transaction fee
- Less control over calculation

**Implementation:** Replace cart-based tax calc with Stripe Tax API

---

### Option 2: TaxJar

**What it does:**
- Tax calculation API
- Auto-filing in supported states (including TX)
- Sales tax reports by jurisdiction

**Pros:**
- Comprehensive reporting
- Can auto-file returns
- Good for multi-state

**Cons:**
- Additional vendor/cost (~$19-99/mo + per-transaction)
- Another integration to maintain

---

### Option 3: Sync to Accounting Software

**QuickBooks Online API** or **Xero API**

**What it does:**
- Push orders as sales receipts/invoices
- Accountant works in familiar software
- They handle tax reporting from there

**Pros:**
- Accountants love it
- Full financial picture (not just online orders)
- Robust reporting built-in

**Cons:**
- Requires API integration work
- Need to map tax rates/accounts correctly

---

### Option 4: Custom Export Reports

Build reports that query Sanity orders and export:
- CSV for Excel/accountant
- PDF summaries

**Pros:**
- No additional cost
- Full control
- Can match exact report format needed

**Cons:**
- Development time
- Manual process for filing

---

## Tax Jurisdictions

Current locations span multiple tax jurisdictions:

**Texas** (varies by city/county):
- State: 6.25%
- Local: 0-2% additional
- Total typically: 8.25%

**Oklahoma:**
- State: 4.5%
- Local: varies
- Total typically: 8.5-9%

Each location should have the correct combined rate. Current rates are set via `scripts/ecommerce/migrate-locations.ts` using ZIP code lookups.

---

## Recommended Next Steps

1. **Confirm accounting software** - This drives the integration choice
2. **Talk to accountant** - What reports/format do they need?
3. **Decide on tax calculation** - Keep in-cart or move to Stripe Tax?
4. **Implement reporting** - Either sync to accounting software or build exports

---

## Stripe Account Structure

### Option A: Single Stripe Account (All Locations)

One Stripe account handles payments for all 4-6 locations under an owner.

**Pros:**
- Simpler setup and management
- Single dashboard for all revenue
- One payout destination (or split via Stripe)
- Easier reconciliation
- Lower overhead - one set of API keys, webhooks, etc.
- Unified customer experience (saved cards work across locations)

**Cons:**
- Must manually track/split revenue by location for accounting
- Single point of failure (account issue affects all locations)
- Harder to separate P&L by location
- If locations have different legal entities, this gets complicated

**Best for:** Single legal entity operating multiple locations

---

### Option B: Separate Stripe Account Per Location

Each location has its own Stripe account.

**Pros:**
- Clean separation of revenue per location
- Easy per-location P&L
- Different bank accounts per location if needed
- Isolated risk (one account issue doesn't affect others)
- Required if locations are separate legal entities (different LLCs)

**Cons:**
- Multiple dashboards to monitor
- Multiple API key sets to manage
- More complex integration (route payments to correct account)
- Separate onboarding/verification per account
- Customer payment methods don't transfer between locations

**Best for:** Franchise model, separate LLCs per location, or locations with different ownership stakes

---

### Option C: Stripe Connect (Platform Model)

You operate as a "platform" with connected accounts per location.

**Pros:**
- Single integration, multiple destination accounts
- Centralized reporting across all connected accounts
- Can take platform fees if desired
- Handles separate legal entities cleanly
- Best of both worlds - unified code, separated funds

**Cons:**
- More complex initial setup
- Connect fees on top of standard Stripe fees
- Requires each location to onboard to Stripe
- Overkill if all locations are same legal entity

**Best for:** Franchise operations, marketplaces, or if you want to add more owners/locations later

---

### Recommendation

| Scenario | Recommendation |
|----------|----------------|
| Same owner, same LLC, 4-6 locations | **Single account** - use metadata to track location |
| Same owner, separate LLCs per location | **Stripe Connect** or separate accounts |
| Franchise / different owners | **Stripe Connect** |
| Plans to scale to many locations/owners | **Stripe Connect** (future-proof) |

For The Catch with ~16 locations under (presumably) one or a few owners, **single account with location metadata** is likely simplest unless there are separate legal entities involved.

---

## Native App Considerations

### Customer iOS App (Ordering)

**Difficulty: Low-Medium**

The web app is already built with React/Next.js. Options:

| Approach | Effort | Result |
|----------|--------|--------|
| **PWA (Progressive Web App)** | ~1-2 days | Add to Home Screen, works offline, push notifications. No App Store. |
| **Capacitor/Ionic wrapper** | ~1-2 weeks | Wrap existing web app in native shell. App Store distribution. |
| **React Native rebuild** | ~2-3 months | Full native app, best UX. Reuse types/logic, rebuild UI. |
| **Expo** | ~1-2 months | React Native but faster. Good middle ground. |

**What's already reusable:**
- Menu data (Sanity)
- Cart logic
- Stripe integration
- Order submission API
- All TypeScript types

**What needs building:**
- Native UI components (or wrap web views)
- Push notifications for order status
- Apple Pay integration (straightforward with Stripe)
- App Store listing/approval

**Recommendation:** Start with **PWA** - it's nearly free and tests demand. If users want a "real" app, wrap with **Capacitor** or build with **Expo**.

---

### iPad App (Back-of-House / Kitchen Display)

**Difficulty: Very Low**

The kitchen display (`/kitchen`) already exists and works on iPad:
- Real-time order updates via polling
- Touch-friendly UI
- Order status management (new → preparing → ready)

**To make it a proper iPad app:**

| Approach | Effort | Notes |
|----------|--------|-------|
| **Just use Safari** | 0 days | Works now. Add to Home Screen for fullscreen. |
| **PWA with manifest** | ~1 day | Better fullscreen, stays logged in, auto-launch. |
| **Capacitor wrapper** | ~3-5 days | App Store (for enterprise distribution), push notifications. |

**Already implemented:**
- Order columns by status
- Timer display per order
- Touch to advance order status
- Auto-refresh
- Location filtering

**Nice-to-haves for native:**
- Push notifications when new order arrives
- Sound alerts
- Persist across iPad restarts
- MDM distribution (no App Store needed for enterprise)

**Recommendation:** The current `/kitchen` route as a **PWA** is probably sufficient. Add push notifications if they want audio alerts for new orders.

---

### Unified System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Sanity CMS                         │
│         (Menu, Locations, Orders, Config)               │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
┌───────────────────┐     ┌───────────────────┐
│   Next.js API     │     │   Next.js API     │
│   (Web + PWA)     │     │   (Webhooks)      │
└────────┬──────────┘     └────────┬──────────┘
         │                         │
    ┌────┴────┐              ┌─────┴─────┐
    │         │              │           │
    ▼         ▼              ▼           ▼
┌───────┐ ┌───────┐    ┌─────────┐ ┌─────────┐
│ iOS   │ │ Web   │    │ Kitchen │ │ Push    │
│ App   │ │ Menu  │    │ iPad    │ │ Notif.  │
└───────┘ └───────┘    └─────────┘ └─────────┘
```

All apps share:
- Same Sanity backend
- Same API routes
- Same order schema
- Same Stripe integration

---

### Cost Estimates

| Item | One-time | Ongoing |
|------|----------|---------|
| Apple Developer Account | $99/year | $99/year |
| Push notification service (OneSignal/Firebase) | Free | Free tier usually sufficient |
| App Store submission | Included | - |
| Capacitor/Expo | Free | - |

---

## Related Files

| File | Purpose |
|------|---------|
| `lib/contexts/CartContext.tsx` | Tax calculation logic |
| `sanity/schemas/location.ts` | Tax rate field per location |
| `sanity/schemas/order.ts` | Order schema with tax fields |
| `scripts/ecommerce/migrate-locations.ts` | Tax rate lookup tables |
| `app/checkout/page.tsx` | Tax display at checkout |
