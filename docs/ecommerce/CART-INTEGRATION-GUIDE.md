# Cart Integration Guide

## What's Been Built

✅ **Cart Infrastructure Complete:**
- CartContext with location-locking logic
- CartDrawer (slide-out cart UI)
- LocationSwitchModal (location change warning)
- AddToCartButton (with location check)
- Complete CSS styling with dark mode support

## Integration Steps

### Step 1: Import Cart Styles

Add to your main layout or globals.css:

```tsx
// app/layout.tsx or wherever you import global styles
import './styles/cart.css';
```

### Step 2: Wrap App with CartProvider

```tsx
// app/layout.tsx
import { CartProvider } from '@/lib/contexts/CartContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
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

### Step 3: Add Floating Cart Button

Add to your layout or header component:

```tsx
// components/catch/HeaderSimple.tsx or app/layout.tsx
import { CartButton } from '@/components/cart/CartDrawer';

export function Header() {
  return (
    <header>
      {/* Your existing header content */}

      {/* Add this: */}
      <CartButton />
    </header>
  );
}
```

The `CartButton` component includes both the floating button AND the drawer, so you only need to add it once.

### Step 4: Update MenuItemCard

Replace the existing "Add to Cart" or detail button with our new button:

```tsx
// components/catch/MenuItemCard.tsx
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import type { Location } from '@/lib/types';

interface MenuItemCardProps {
  // ... existing props
  location: Location;  // Add this
}

export default function MenuItemCard({
  name,
  description,
  price,
  image,
  isAvailable,
  badges,
  location  // Add this
}: MenuItemCardProps) {
  // ... existing code

  return (
    <article className="catch-menu-card">
      {/* ... existing content ... */}

      {/* Replace existing button with: */}
      <AddToCartButton
        menuItem={{
          id: itemId,  // You'll need to pass this
          name,
          price,
          slug: itemSlug,
          categorySlug: categorySlug,
          description,
          badges,
          image,
          // ... other menu item fields
        }}
        location={location}
      />
    </article>
  );
}
```

### Step 5: Update Menu Page to Pass Location

```tsx
// app/menu/[location]/page.tsx (or wherever your menu page is)
import { getLocationBySlug } from '@/lib/adapters/sanity-catch';
import { captureCartError } from '@/lib/errors/cart-errors';

export default async function MenuPage({ params }: { params: { location: string } }) {
  const location = await getLocationBySlug(params.location);

  if (!location) {
    return <div>Location not found</div>;
  }

  // Ensure location has the _id field - CRITICAL for Sanity references
  // If your adapter doesn't return it, fetch from Sanity by slug:
  let locationWithId = location;
  
  if (!location._id) {
    // PRODUCTION CODE: Must query Sanity to get the real _id
    // See "Important Notes > Location Must Have `_id`" section below for the proper fetch pattern
    const sanityLocation = await sanityClient.fetch(
      `*[_type == "location" && slug.current == $slug][0]{ _id }`,
      { slug: location.slug }
    );
    
    if (sanityLocation?._id) {
      locationWithId = { ...location, _id: sanityLocation._id };
    } else {
      // FAIL-FAST: Send detailed error to monitoring, throw clean message to user
      const errorCode = 'LOC_MISSING_001';
      const detailedContext = {
        slug: location.slug,
        adapterResponse: location,
        sanityFetchResult: sanityLocation,
        timestamp: new Date().toISOString(),
      };
      
      // Send full context to monitoring (uses captureCartError for unified reporting)
      await captureCartError(errorCode, detailedContext);
      
      console.error(`[${errorCode}] Location resolution failed for slug: ${location.slug}`);
      
      // In production, throw clean error without sensitive data
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          `${errorCode}: Location configuration error. Please contact support if this persists.`
        );
      } else {
        // In development, return error UI with debugging details
        return (
          <div style={{ padding: '2rem', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px' }}>
            <h2 style={{ color: '#991b1b', marginBottom: '1rem' }}>Location Configuration Error ({errorCode})</h2>
            <p style={{ color: '#7f1d1d', marginBottom: '0.5rem' }}>
              <strong>Problem:</strong> Location "{location.slug}" could not be resolved in Sanity.
            </p>
            <p style={{ color: '#7f1d1d', marginBottom: '0.5rem' }}>
              <strong>Debug info:</strong> Check that the location exists in Sanity Studio with a valid _id and matching slug.
            </p>
            <details style={{ marginTop: '1rem' }}>
              <summary style={{ cursor: 'pointer', color: '#7f1d1d', textDecoration: 'underline' }}>View error details</summary>
              <pre style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#fff7ed', overflow: 'auto', fontSize: '0.85rem' }}>
{JSON.stringify({ adapterLocation: location, sanityResult: sanityLocation }, null, 2)}
              </pre>
            </details>
          </div>
        );
      }
    }
  }

  return (
    <div>
      {/* Pass location to each menu item card */}
      {menuItems.map(item => (
        <MenuItemCard
          key={item.id}
          {...item}
          location={locationWithId}
        />
      ))}
    </div>
  );
}
```

## Testing the Cart

### Test Scenario 1: Add Item
1. Visit a location's menu page
2. Click "Add to Cart" on any item
3. Floating cart button should show item count
4. Click cart button to see drawer slide in

### Test Scenario 2: Location Lock
1. Add item from Location A
2. Navigate to Location B
3. Try to add item from Location B
4. Modal should appear warning about clearing cart
5. Test both "Cancel" and "Switch" options

### Test Scenario 3: Cart Operations
1. Add multiple items
2. Adjust quantities with +/- buttons
3. Remove items with trash icon
4. Verify totals calculate correctly

## Feature Flags

The `AddToCartButton` automatically checks:
- ✅ `location.onlineOrderingEnabled` - Shows "Coming Soon" if false
- ✅ `location.acceptingOrders` - Shows "Temporarily Unavailable" if false
- ✅ `menuItem.price` - Shows "See Menu for Price" if null/undefined

So you can control visibility per location in Sanity Studio!

## Important Notes

### Location Must Have `_id` (CRITICAL)

**⚠️ PRODUCTION REQUIREMENT**: The cart system depends on real Sanity `_id` values for location references and queries. Synthetic/concatenated IDs will break cart operations and order creation.

Your adapter must return the Sanity `_id` field. Update your queries:

```typescript
// Before (WRONG - missing _id)
const location = await sanityClient.fetch(`
  *[_type == "location" && slug.current == $slug][0]{
    name,
    slug,
    address,
    // ...
  }
`, { slug });

// After (CORRECT - includes _id)
const location = await sanityClient.fetch(`
  *[_type == "location" && slug.current == $slug][0]{
    _id,        // ← REQUIRED: Real Sanity document ID
    name,
    slug,
    address,
    onlineOrderingEnabled,
    acceptingOrders,
    taxRate,
    // ...
  }
`, { slug });
```

**If you must handle missing `_id`**: The fallback code in Step 5 performs a Sanity query by slug to retrieve the real ID. Only the final `temp-location-...` placeholder is for temporary client-side logic and should never reach production—if it does, check your logs and fix the adapter configuration.

### MenuItem Interface

Make sure your MenuItem type matches what's expected:

```typescript
// lib/types.ts (already updated)
interface MenuItem {
  id: string;
  name: string;
  slug: string;
  categorySlug: string;
  description?: string;
  price?: number | null;  // Important: can be null for market price
  badges?: Badge[];
  image?: string;
  // ...
}
```

## Styling Customization

The cart uses CSS custom properties for theming. Adjust in your existing CSS:

```css
/* app/globals.css or similar */
:root {
  --color-accent: #d32f2f;        /* Primary color (cart button, checkout) */
  --color-accent-hover: #b71c1c;  /* Hover state */
  --color-success: #4caf50;       /* "Added!" success state */
  --color-warning: #ff9800;       /* Location switch warning icon */
  --color-danger: #d32f2f;        /* Remove item button */
  --color-text: #1a1a1a;          /* Main text */
  --color-text-light: #666;       /* Secondary text */
  --color-bg: white;              /* Backgrounds */
  --color-bg-alt: #fafafa;        /* Alternate backgrounds */
  --color-border: #e5e5e5;        /* Borders */
}
```

## Defensive Validation & Monitoring

**Critical**: All downstream code that uses `location._id` must validate it is a real Sanity ID (not a synthetic "temp-location-" prefix):

```typescript
// lib/validation/location.ts
export function validateLocationId(locationId: string | undefined, context: object): boolean {
  if (!locationId) {
    console.error('[VALIDATION] Location missing _id', { context });
    return false;
  }
  
  // Fail fast on synthetic IDs
  if (locationId.startsWith('temp-location-')) {
    const error = new Error(`Synthetic location ID detected: ${locationId}. This indicates a configuration failure.`);
    // Send to monitoring
    captureException(error, { 
      contexts: { 
        locationId, 
        context,
        severity: 'critical' 
      } 
    });
    throw error;
  }
  
  return true;
}

// Usage in AddToCartButton, checkout, order creation:
if (!validateLocationId(location._id, { cartOperation: 'add', itemName: item.name })) {
  setError('Unable to add item. Location data is invalid. Please refresh and try again.');
  return;
}
```

**Monitoring Setup** (e.g., with Sentry):

```typescript
// lib/monitoring/sentry.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

export function captureLocationError(slug: string, error: unknown, context: object) {
  Sentry.captureException(error, {
    tags: {
      component: 'cart',
      errorType: 'locationResolution',
      slug,
    },
    contexts: {
      location: context,
    },
  });
}
```

When location._id resolution fails in production, your monitoring dashboard will alert operators immediately so they can:
1. Check Sanity Studio for missing locations
2. Verify adapter queries return _id field
3. Review location configuration

## What's Next

Now that the cart is working, next steps:

1. ✅ **Cart Infrastructure** - Done!
2. ⏳ **Checkout Page** - Next (create `/checkout` route)
3. ⏳ **Stripe Integration** - Payment processing
4. ⏳ **Order Creation** - Save to Sanity
5. ⏳ **Order Management** - Kitchen display

See `/docs/ecommerce/E-COMMERCE-PROOF-OF-CONCEPT-STRATEGY.md` for the full plan.

## Troubleshooting

### Cart Not Persisting

**Issue**: Cart clears on page refresh

**Solution**: Cart uses localStorage. Make sure:
- You're testing in a browser (not incognito mode in some browsers)
- localStorage is enabled
- No errors in browser console

### Can't Add Items from Any Location

**Issue**: All buttons show "Coming Soon"

**Solution**: Check in Sanity Studio:
- `onlineOrderingEnabled` is set to `true` for that location
- `acceptingOrders` is set to `true`

### Location Switch Modal Not Appearing

**Issue**: Can add items from multiple locations

**Solution**: Make sure each location has a unique `_id` field. The cart matches on `location._id`.

### Styles Not Loading

**Issue**: Cart looks unstyled

**Solution**:
1. Import cart.css in your layout
2. Check browser console for CSS loading errors
3. Verify path: `@/app/styles/cart.css` or adjust import path

## Error Code Reference

The cart system uses standardized error codes for configuration and runtime errors. When users encounter errors, they'll see a code like `LOC_MISSING_001` which maps to specific troubleshooting steps.

### LOC_MISSING_001: Location Resolution Failure

**What it means:** The application tried to retrieve location data but couldn't find a valid Sanity `_id` for the location.

**Common causes:**
- Location doesn't exist in Sanity Studio
- Location slug in database doesn't match slug in Sanity
- Location document exists but has no `_id` field (corrupted document)
- Adapter/backend is not returning location data at all

**How to fix:**
1. Go to Sanity Studio and search for the location with the slug shown in the error
2. Verify the location document has a valid `_id` (should be system-generated, e.g., `drafts.abc123xyz`)
3. Check that the `slug` field matches what your backend/adapter is sending
4. If location is missing, create it in Sanity with proper slug
5. Redeploy application to reload cached location data

**For operators/monitoring:**
- This error is sent to Sentry/monitoring with full context (adapter response, Sanity query result)
- Check Sentry dashboard under tag `errorType: locationResolution` for patterns
- If multiple locations have this error, likely a schema migration issue in Sanity

**User-facing message:**
```
LOC_MISSING_001: Location configuration error. Please contact support if this persists.
```

### Adding new error codes

When introducing new cart-related errors:

1. **Define the code** in a format: `{COMPONENT}_{SEVERITY}_{NUMBER}`
   - `LOC` = Location, `CART` = Cart state, `INT` = Integration, etc.
   - `MISSING`, `INVALID`, `TIMEOUT` = severity
   - `001`, `002` = sequential number

2. **Send details to monitoring:**
   ```typescript
   window.Sentry?.captureException(new Error(errorCode), {
     tags: { errorType: 'specificErrorType' },
     contexts: { detailedContext: {...} },
   });
   ```

3. **Throw clean message** (no JSON dumps):
   ```typescript
   throw new Error(`${errorCode}: User-friendly message`);
   ```

4. **Document in this section** with causes and fixes

### Using Error Codes in Your Code

Import the error utilities from `lib/errors/cart-errors.ts`:

```typescript
import { 
  createCartError, 
  captureCartError,
  CART_ERROR_CODES 
} from '@/lib/errors/cart-errors';

// Option 1: Create and throw a safe error (automatically sends to monitoring)
try {
  const sanityLocation = await sanityClient.fetch(...);
  if (!sanityLocation?._id) {
    throw createCartError('LOC_MISSING_001', {
      slug: location.slug,
      adapterResponse: location,
      sanityFetchResult: sanityLocation,
    });
  }
} catch (error) {
  // Error thrown contains error code but not sensitive data
  // User sees: "LOC_MISSING_001: Location configuration error..."
  // Sentry sees: full adapterResponse and sanityFetchResult
}

// Option 2: Log error to monitoring without throwing
if (suspiciousCondition) {
  captureCartError('LOC_INVALID_002', {
    locationId: location._id,
    missingFields: ['taxRate', 'address'],
  });
}

// Option 3: Get error metadata for custom handling
const errorInfo = CART_ERROR_CODES.LOC_MISSING_001;
console.log(errorInfo.severity, errorInfo.description);
```

## Summary

**Files Created:**
- ✅ `/lib/contexts/CartContext.tsx` - Cart state management
- ✅ `/components/cart/CartDrawer.tsx` - Drawer UI + floating button
- ✅ `/components/cart/LocationSwitchModal.tsx` - Location change modal
- ✅ `/components/cart/AddToCartButton.tsx` - Smart add button
- ✅ `/app/styles/cart.css` - Complete styling

**To Use:**
1. Import `cart.css` in layout
2. Wrap app with `<CartProvider>`
3. Add `<CartButton />` to header/layout
4. Use `<AddToCartButton />` in menu items
5. Pass location prop with `_id` field

The cart system is feature-complete and production-ready! 🎉
