# Deferred Nitpicks

CodeRabbit suggestions that were intentionally deferred for future consideration.

---

## Integer Cents for Money Math

**File:** `lib/contexts/CartContext.tsx`

**Current:** Prices stored as floats (e.g., `14.99`), rounded at calculation time with `Math.round(x * 100) / 100`.

**Suggestion:** Store and calculate all amounts in integer cents to avoid floating-point drift (e.g., `0.1 + 0.2 !== 0.3` in JS).

**Stripe context:** Stripe *requires* amounts in cents. Currently we convert at the boundary: `amount: Math.round(total * 100)`. Storing in cents throughout would align with Stripe's model.

**Trade-offs:**
- Pro: Eliminates float precision issues
- Pro: Matches Stripe's API format
- Con: Every display requires `(cents / 100).toFixed(2)`
- Con: Refactor touches cart, checkout, order history, admin displays

**Verdict:** Current approach is fine for restaurant menu pricing. Worth revisiting if we add complex discounting, split payments, or financial reporting.

---

## Location Region Field (Replace Hardcoded Slugs)

**File:** `components/catch/Menu2PageClient.tsx`

**Current:** DFW/Houston locations are identified by hardcoded slug arrays:
```typescript
locations.filter(loc => ['denton', 'coit-campbell', 'garland'].includes(loc.slug))
```

**Suggestion:** Add a `region` field to the location schema and filter dynamically.

**Implementation steps:**
1. Add `region` field to `sanity/schemas/location.ts`:
   ```typescript
   defineField({
     name: "region",
     title: "Region",
     type: "string",
     options: {
       list: [
         { title: "DFW", value: "dfw" },
         { title: "Houston", value: "houston" },
         { title: "Oklahoma", value: "oklahoma" },
         { title: "Other Texas", value: "other-tx" },
       ],
     },
   }),
   ```

2. Update all 16 locations in Sanity Studio with their region

3. Add `region` to `lib/types.ts` Location interface:
   ```typescript
   region?: "dfw" | "houston" | "oklahoma" | "other-tx";
   ```

4. Update GROQ queries in `lib/adapters/sanity-catch.ts` to fetch region

5. Replace hardcoded arrays in Menu2PageClient.tsx:
   ```typescript
   locations.filter(l => l.region === 'dfw')
   locations.filter(l => l.region === 'houston')
   ```

**Estimated effort:** ~30 minutes

**Verdict:** Good idea, low effort. Do it when touching location filtering or adding new locations.

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
