# Deferred Nitpicks

CodeRabbit suggestions that were intentionally deferred for future consideration.

---

## ~~Integer Cents for Money Math~~ **RESOLVED**

**Status:** Implemented in CartContext.tsx

**Implementation:**
- CartContext now performs all arithmetic in integer cents internally
- Added `toCents()`, `toDollars()`, and `formatPrice()` utilities in `lib/utils.ts`
- Values are converted back to dollars for storage (backward compat with localStorage)
- Checkout page updated to use `formatPrice()` utility

---

## ~~Location Region Field (Replace Hardcoded Slugs)~~ **RESOLVED**

**Status:** Implemented

**Implementation:**
1. Added `region` field to `sanity/schemas/location.ts` with options: dfw, houston, oklahoma, east-tx, west-tx
2. Updated `lib/types.ts` with `LocationRegion` type
3. Updated GROQ query in `lib/adapters/sanity-catch.ts` to fetch region
4. Updated all 16 locations in Sanity with their region values
5. Updated the following files to use `region` field instead of hardcoded slugs:
   - `components/menu3/LocationBar.tsx`
   - `components/catch/MenuPageClient.tsx`
   - `components/catch/Menu2PageClient.tsx`
   - `app/locations/LocationsPageClient.tsx`

---

## More Granular useEffect Dependencies

**File:** `lib/contexts/CartContext.tsx`

**Current:** Effect depends on entire `cart` object:
```typescript
useEffect(() => { ... }, [isHydrated, cart]);
```

**Suggestion:** Depend on specific fields to reduce recalculations:
```typescript
}, [isHydrated, cart?.items, cart?.tip, cart?.deliveryFee, cart?.location?.taxRate]);
```

**Trade-offs:**
- Pro: Fewer effect runs
- Con: Risk of stale closures if we miss a dependency
- Con: Marginal perf gain for added complexity

**Verdict:** Current approach is safer. The `alreadyCurrent` check already prevents unnecessary state updates.
