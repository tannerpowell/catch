# CodeRabbit Review - PR #28 - Testing Kit v2

## 🔴 Critical Issues (3)

### 1. Missing npm test scripts in package.json
**File:** `docs/TESTING/the-catch-testing-kit/.github/workflows/tests.yml` (lines 26-36)

**Issue:** The workflow references `test:unit` and `test:e2e` scripts that don't exist in package.json.

**Action:**
- [ ] Add required test scripts to root `package.json`:
```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:integration && npm run test:e2e",
    "test:unit": "vitest run tests/unit",
    "test:unit:watch": "vitest tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "PWDEBUG=1 playwright test",
    "test:a11y": "playwright test tests/e2e/accessibility.spec.ts"
  }
}
```
- [ ] Add integration test step to CI workflow between unit and E2E tests

---

### 2. Replace `require()` with dynamic `import()` in accessibility tests
**File:** `docs/TESTING/the-catch-testing-kit/tests/e2e/accessibility.spec.ts` (lines 16-21)

**Issue:** ESLint rule `@typescript-eslint/no-require-imports` forbids `require()`. Causing pipeline failure.

**Action:**
- [ ] Replace `require()` with async `import()`:
```typescript
let AxeBuilder: typeof import("@axe-core/playwright").default | null = null;

async function loadAxeBuilder() {
  try {
    const module = await import("@axe-core/playwright");
    AxeBuilder = module.default;
  } catch {
    // Package not installed - tests will be skipped
  }
}
```
- [ ] Add `beforeAll` hook to load AxeBuilder
- [ ] Add `beforeEach` hook to skip if AxeBuilder is null

---

### 3. Handle invalid price input to prevent NaN propagation
**File:** `docs/TESTING/the-catch-testing-kit/tests/e2e/_helpers.ts` (lines 139-153)

**Issue:** `parseFloat()` returns `NaN` for invalid input, causing silent test failures.

**Action:**
- [ ] Add validation to `priceToCents`:
```typescript
export function priceToCents(priceStr: string): number {
  const cleaned = priceStr.replace(/[^0-9.]/g, "");
  const parsed = parseFloat(cleaned);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid price string: "${priceStr}"`);
  }
  return Math.round(parsed * 100);
}
```
- [ ] Add validation to `priceToDollars`:
```typescript
export function priceToDollars(priceStr: string): number {
  const cleaned = priceStr.replace(/[^0-9.]/g, "");
  const parsed = parseFloat(cleaned);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid price string: "${priceStr}"`);
  }
  return parsed;
}
```

---

## 🟠 Major Issues (2)

### 4. Refactor order confirmation tests to use helper functions
**File:** `docs/TESTING/the-catch-testing-kit/tests/e2e/order-confirmation.spec.ts` (lines 19-65)

**Issue:** Tests manually duplicate the checkout flow instead of using imported helpers `addItemToCart` and `completeCheckout`.

**Action:**
- [ ] Refactor all 5 tests in the file to use `completeCheckout()` helper
- [ ] Remove inline navigation/click/fill steps
- [ ] Remove related conditional skips
- [ ] Keep assertions for URL and order number checks

**Example:**
```typescript
test("shows order number after checkout", async ({ page }) => {
  await completeCheckout(page, {
    name: "Test User",
    email: "test@example.com",
    phone: "2145551234",
  });

  await expect(page).toHaveURL(/order-confirmation|orders\//);
  // ... order number assertions
});
```

---

### 5. Fix date validation in health API test
**File:** `docs/TESTING/the-catch-testing-kit/tests/integration/api-health.test.ts` (lines 40-42)

**Issue:** `Date` constructor doesn't throw on invalid dates, it returns Invalid Date object.

**Action:**
- [ ] Replace with proper validation:
```typescript
expect(data.timestamp).toBeDefined();
const date = new Date(data.timestamp);
expect(date.getTime()).not.toBeNaN();
expect(date.toISOString()).toBe(data.timestamp);
```

---

## 🟡 Minor Issues (18)

### 6. Risk of test interference in rate limiting tests
**File:** `docs/TESTING/the-catch-testing-kit/tests/integration/api-order-status.test.ts` (lines 193-252)

**Action:**
- [ ] Add delay between rate limiting tests or isolate them
- [ ] Use different tokens/endpoints for each test

---

### 7. Remove unused `form` variable
**File:** `docs/TESTING/the-catch-testing-kit/tests/e2e/checkout.spec.ts` (line 27)

**Action:**
- [ ] Change `const form = await ensureTestId(...)` to `await ensureTestId(...)`

---

### 8. Add return statement after test.skip in kitchen-kds.spec.ts
**File:** `docs/TESTING/the-catch-testing-kit/tests/e2e/kitchen-kds.spec.ts` (lines 25-29)

**Issue:** `test.skip()` doesn't halt execution. If `orderTestId` is null, line 29 will throw TypeError.

**Action:**
- [ ] Add `return;` after `test.skip()` call

---

### 9. Add return statement after test.skip in cart-ops.spec.ts
**File:** `docs/TESTING/the-catch-testing-kit/tests/e2e/cart-ops.spec.ts` (lines 17-24)

**Action:**
- [ ] Add `return;` after `test.skip()` call

---

### 10. Remove unused import `ensureTestId` from order-tracking.spec.ts
**File:** `docs/TESTING/the-catch-testing-kit/tests/e2e/order-tracking.spec.ts` (line 9)

**Action:**
- [ ] Remove `ensureTestId` from import statement

---

### 11. Remove unused import `ensureTestId` from error-handling.spec.ts
**File:** `docs/TESTING/the-catch-testing-kit/tests/e2e/error-handling.spec.ts` (line 12)

**Action:**
- [ ] Remove `ensureTestId` from import statement

---

### 12. Remove unused `page` parameter from beforeEach
**File:** `docs/TESTING/the-catch-testing-kit/tests/e2e/accessibility.spec.ts` (lines 24-28)

**Action:**
- [ ] Change `async ({ page })` to `async ()`

---

### 13. Remove unused `vi` import
**File:** `docs/TESTING/the-catch-testing-kit/tests/unit/cart-context.test.tsx` (line 12)

**Action:**
- [ ] Remove `vi` from Vitest import

---

### 14. Add guard for missing submit button in error-handling.spec.ts
**File:** `docs/TESTING/the-catch-testing-kit/tests/e2e/error-handling.spec.ts` (lines 282-289)

**Action:**
- [ ] Add element existence check before clicking:
```typescript
const submitButton = page.getByTestId("checkout-submit");
if ((await submitButton.count()) === 0) {
  test.skip(true, 'Missing data-testid="checkout-submit".');
  return;
}
await submitButton.click();
```

---

### 15. Remove unused import from cart-edge-cases.spec.ts
**File:** `docs/TESTING/the-catch-testing-kit/tests/e2e/cart-edge-cases.spec.ts` (line 13)

**Action:**
- [ ] Remove `ensureTestId` from imports

---

### 16. Remove unused imports from order-confirmation.spec.ts
**File:** `docs/TESTING/the-catch-testing-kit/tests/e2e/order-confirmation.spec.ts` (lines 9-16)

**Action:**
- [ ] Remove `ensureTestId`, `addItemToCart`, `completeCheckout`, `getOrderNumberFromUrl` from imports

---

### 17. Strengthen double-submission prevention test
**File:** `docs/TESTING/the-catch-testing-kit/tests/e2e/order-confirmation.spec.ts` (lines 160-187)

**Action:**
- [ ] Verify button is disabled during request, not after

---

### 18. Use constant for timeout values in circuit breaker tests
**File:** `docs/TESTING/the-catch-testing-kit/tests/integration/sanity-circuit-breaker.test.ts` (lines 119-153)

**Action:**
- [ ] Replace hardcoded `31000` with `RESET_TIMEOUT + 1000` constant

---

### 19. Use API_BASE_URL for consistency
**File:** `docs/TESTING/the-catch-testing-kit/tests/integration/_helpers.ts` (lines 117-133)

**Action:**
- [ ] Change hardcoded URL to `${API_BASE_URL}/api/test`

---

### 20. Add Node.js version specification
**File:** `docs/TESTING/the-catch-testing-kit/tests/integration/_helpers.ts` (lines 165-179)

**Issue:** `AbortSignal.timeout()` requires Node.js 17.3.0+

**Action:**
- [ ] Add `engines.node` to package.json OR implement fallback timeout
- [ ] Consider adding `.nvmrc` file

---

### 21. Conditional assertions may silently pass in api-order-tracking
**File:** `docs/TESTING/the-catch-testing-kit/tests/integration/api-order-tracking.test.ts` (lines 35-39)

**Action:**
- [ ] Assert expected status codes explicitly instead of conditional checks

---

### 22. Add violation logging for consistency in accessibility tests
**File:** `docs/TESTING/the-catch-testing-kit/tests/e2e/accessibility.spec.ts` (lines 55-70, 96-111)

**Issue:** Cart and kitchen tests don't log critical violations when found, unlike menu/checkout/color contrast tests.

**Action:**
- [ ] Add logging for cart test (after line 67):
```typescript
if (critical.length > 0) {
  console.log("Critical a11y violations on cart page:");
  critical.forEach((v) => {
    console.log(`  - ${v.id}: ${v.description}`);
    v.nodes.forEach((n) => console.log(`    ${n.html.slice(0, 80)}`));
  });
}
```
- [ ] Add same logging for kitchen test (after line 108)

---

### 23. Check count before calling .first() in accessibility tests
**File:** `docs/TESTING/the-catch-testing-kit/tests/e2e/accessibility.spec.ts` (lines in image test)

**Issue:** Calling `.count()` on a locator after `.first()` doesn't properly verify menu items exist.

**Action:**
- [ ] Fix the logic:
```typescript
const menuItems = page.locator('[data-testid^="menu-item-"]');
if ((await menuItems.count()) === 0) {
  test.skip(true, "No menu items found");
  return;
}
const menuItem = menuItems.first();
await menuItem.click();
```

---

## 🧹 Nitpick Comments (31)

### 24. Extract skip guard to reduce duplication
**File:** `docs/TESTING/the-catch-testing-kit/tests/e2e/accessibility.spec.ts` (lines 31-34, 56-59, 73-76, 97-100, 268-271)

**Issue:** Skip guard pattern is repeated across five tests.

**Action:**
- [ ] Extract to helper function in `_helpers.ts`:
```typescript
function requireAxeBuilder() {
  if (!AxeBuilder) {
    test.skip(true, "Install @axe-core/playwright to run accessibility tests");
  }
}
```
- [ ] Use in each test:
```typescript
test("menu page: no critical violations", async ({ page }) => {
  requireAxeBuilder();
  await navigateTo(page, routes.menu);
  // ...
});
```

---

### 25. Make image test limit configurable
**File:** `docs/TESTING/the-catch-testing-kit/tests/e2e/accessibility.spec.ts` (line 253)

**Issue:** Arbitrary limit of 10 images might miss violations.

**Action:**
- [ ] Make configurable via environment variable:
```typescript
const maxImagesToTest = parseInt(process.env.E2E_MAX_IMAGES_TEST ?? "20", 10);
const imageCount = await images.count();
for (let i = 0; i < Math.min(imageCount, maxImagesToTest); i++) {
```

---

### 26. Stronger typing for Zod schemas test
**File:** `docs/TESTING/the-catch-testing-kit/tests/unit/zod-schemas.test.ts` (lines 5-25)

**Action:**
- [ ] Replace `as any` with proper type assertion or remove entirely

---

### 27. Remove unused `expect` import
**File:** `docs/TESTING/the-catch-testing-kit/tests/e2e/menu-to-cart.spec.ts` (line 1)

**Action:**
- [ ] Remove `expect` from `@playwright/test` import

---

### 28. Avoid `as any` in cart-store.test.tsx
**File:** `docs/TESTING/the-catch-testing-kit/tests/unit/cart-store.test.tsx` (line 14)

**Action:**
- [ ] Define proper interface for CartStoreModule instead of `as any`

---

### 29. Strengthen cart store assertions
**File:** `docs/TESTING/the-catch-testing-kit/tests/unit/cart-store.test.tsx` (lines 22-33)

**Action:**
- [ ] Add assertions for item properties (id, name, priceCents)
- [ ] Verify actual qty values, not just length

---

### 30. Avoid `as any` in utils-money.test.ts
**File:** `docs/TESTING/the-catch-testing-kit/tests/unit/utils-money.test.ts` (line 13)

**Action:**
- [ ] Define MoneyModule type instead of `as any`

---

### 31. Test inverse property explicitly
**File:** `docs/TESTING/the-catch-testing-kit/tests/unit/utils-money.test.ts` (lines 15-21)

**Action:**
- [ ] Add test that verifies `toDollars(toCents(x)) === x` for arbitrary values

---

### 32. More reasonable timeout for health checks
**File:** `docs/TESTING/the-catch-testing-kit/tests/integration/api-health.test.ts` (lines 85-96)

**Action:**
- [ ] Change timeout from 5000ms to 1000ms

---

### 33. Optimize redundant API calls in health tests
**File:** `docs/TESTING/the-catch-testing-kit/tests/integration/api-health.test.ts` (lines 18-123)

**Action:**
- [ ] Fetch once in `beforeAll` and share response across tests

---

### 34. Avoid conditional assertions in api-order-status
**File:** `docs/TESTING/the-catch-testing-kit/tests/integration/api-order-status.test.ts` (lines 256-281)

**Action:**
- [ ] Assert specific status codes instead of conditional checks

---

### 35. Improve loop-based test clarity
**File:** `docs/TESTING/the-catch-testing-kit/tests/integration/api-order-status.test.ts` (lines 164-189)

**Action:**
- [ ] Use `test.each()` for individual status tests instead of loop

---

### 36. Add integration tests to CI pipeline
**File:** `docs/TESTING/the-catch-testing-kit/.github/workflows/tests.yml` (lines 26-36)

**Action:**
- [ ] Add integration test step between unit and E2E tests

---

### 37. Clarify commented environment variables
**File:** `docs/TESTING/the-catch-testing-kit/.github/workflows/tests.yml` (lines 39-41)

**Action:**
- [ ] Remove commented env vars OR document when they should be used

---

### 38. Import `maybeFill` from helpers
**File:** `docs/TESTING/the-catch-testing-kit/tests/e2e/checkout.spec.ts` (lines 31-34)

**Action:**
- [ ] Import `maybeFill` from `_helpers.ts` instead of redefining

---

### 39. Add language specifiers to code blocks
**File:** `docs/TESTING/the-catch-testing-kit/README_FIRST.md` (lines 45, 106, 116, 128, 135, 144)

**Action:**
- [ ] Add `text` or `plaintext` to fenced code blocks

---

### 40. Replace waitForTimeout with deterministic waits
**File:** `docs/TESTING/the-catch-testing-kit/tests/e2e/error-handling.spec.ts` (line 210)

**Action:**
- [ ] Replace `waitForTimeout(500)` with `waitForFunction()` or element wait

---

### 41. Remove redundant AxeBuilder checks
**File:** `docs/TESTING/the-catch-testing-kit/tests/e2e/accessibility.spec.ts` (lines 30-53)

**Action:**
- [ ] Remove individual test checks since `beforeEach` already handles skipping

---

### 42. Use test.skip() decorator for always-skipped tests
**File:** `docs/TESTING/the-catch-testing-kit/tests/integration/api-notifications.test.ts` (lines 176-186)

**Action:**
- [ ] Use `test.skip("test name", async () => {})` instead of conditional skip

---

### 43. Strengthen notification type assertions
**File:** `docs/TESTING/the-catch-testing-kit/tests/integration/api-notifications.test.ts` (lines 66-91)

**Action:**
- [ ] Check for success status codes instead of just `!== 400`

---

### 44. Use Playwright's clock API for polling tests
**File:** `docs/TESTING/the-catch-testing-kit/tests/e2e/order-tracking.spec.ts` (lines 215-231)

**Action:**
- [ ] Implement using `page.clock` to fast-forward time

---

### 45. Import types from CartContext module
**File:** `docs/TESTING/the-catch-testing-kit/tests/unit/cart-context.test.tsx` (lines 22-34)

**Action:**
- [ ] Import proper TypeScript types instead of using `unknown`

---

### 46. Test edge cases for currency formatting
**File:** `docs/TESTING/the-catch-testing-kit/tests/unit/cart-totals.test.ts` (lines 261-277)

**Action:**
- [ ] Add tests for large amounts, negative values, single-cent amounts

---

### 47-54. Additional minor code quality improvements
- [ ] Add JSDoc comments to complex helper functions
- [ ] Consider extracting magic numbers to constants
- [ ] Add error message context to test failures
- [ ] Consider adding test coverage reporting
- [ ] Add performance benchmarks for critical paths
- [ ] Document test data fixtures
- [ ] Add comments explaining skip conditions
- [ ] Consider snapshot testing for complex UI components

---

## Summary

- **Critical:** 3 issues (MUST FIX)
- **Major:** 2 issues (SHOULD FIX)
- **Minor:** 18 issues (RECOMMENDED)
- **Nitpicks:** 31+ improvements (OPTIONAL BUT PREFERRED)

**Total:** 54+ actionable items

---

## Progress Tracking

- [ ] All Critical issues resolved
- [ ] All Major issues resolved
- [ ] All Minor issues resolved
- [ ] All Nitpicks addressed
- [ ] CodeRabbit re-review requested
- [ ] All comments approved by CodeRabbit
- [ ] Ready to merge
