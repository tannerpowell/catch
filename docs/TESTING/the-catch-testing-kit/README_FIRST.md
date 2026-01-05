# The Catch — Testing Infrastructure Kit

**Version 2.0** | **Updated 2026-01-03**

A production-ready testing suite for The Catch restaurant ordering system, featuring:

- **Playwright** — E2E browser tests (multi-browser, mobile)
- **Vitest** — Unit and integration tests
- **axe-core** — Accessibility testing
- **GitHub Actions** — CI/CD pipeline

## Quick Start

```bash
# 1. Install dependencies
pnpm add -D \
  @playwright/test \
  vitest \
  jsdom \
  @vitest/coverage-v8 \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  @vitejs/plugin-react \
  vite-tsconfig-paths \
  @axe-core/playwright

# 2. Install Playwright browsers
pnpm exec playwright install --with-deps

# 3. Copy files to your repo root
cp -r tests/ playwright.config.ts vitest.config.ts vitest.setup.ts .github/ /your/repo/

# 4. Add scripts to package.json (see below)

# 5. Run tests
pnpm run test:unit
pnpm run test:e2e
```

---

## Test Structure

```text
tests/
├── unit/                           # Fast, isolated unit tests
│   ├── _helpers.ts                 # Mock utilities
│   ├── cart-context.test.tsx       # Cart state management
│   ├── cart-totals.test.ts         # Price calculations
│   ├── zod-schemas.test.ts         # Validation schemas
│   └── utils-money.test.ts         # Money formatting
│
├── integration/                    # API and service tests
│   ├── _helpers.ts                 # Request utilities
│   ├── api-health.test.ts          # Health endpoint
│   ├── api-order-status.test.ts    # KDS status updates
│   ├── api-order-tracking.test.ts  # Public order tracking
│   ├── api-notifications.test.ts   # SMS/email notifications
│   └── sanity-circuit-breaker.test.ts  # Resilience testing
│
├── e2e/                            # Browser automation tests
│   ├── _helpers.ts                 # Playwright utilities
│   ├── menu-to-cart.spec.ts        # Browse → Add to cart
│   ├── cart-ops.spec.ts            # Quantity, removal
│   ├── cart-edge-cases.spec.ts     # Location lock, modifiers
│   ├── checkout.spec.ts            # Form validation
│   ├── order-confirmation.spec.ts  # Post-checkout flow
│   ├── order-tracking.spec.ts      # Status polling
│   ├── kitchen-kds.spec.ts         # Kitchen display
│   ├── error-handling.spec.ts      # Network failures
│   └── accessibility.spec.ts       # WCAG compliance
│
└── fixtures/                       # Test data
    ├── loader.ts                   # Fixture utilities
    ├── sanity/menu.sample.json     # Menu data
    └── orders/sample-orders.json   # Order data
```

---

## Package.json Scripts

```json
{
  "scripts": {
    "test": "pnpm run test:unit && pnpm run test:integration && pnpm run test:e2e",
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

---

## Required `data-testid` Attributes

Add these to your UI components for stable E2E selectors:

### Menu Page
```tsx
data-testid="category-nav"              # Category navigation
data-testid="menu-item-{slug}"          # Each menu item card
data-testid="item-modal"                # Item detail modal
data-testid="add-to-cart"               # Add to cart button
data-testid="modifier-{option}"         # Modifier options
data-testid="special-instructions"      # Special instructions textarea
```

### Cart Page
```tsx
data-testid="cart-badge-count"          # Header cart count
data-testid="cart-row-{id}"             # Each cart line item
data-testid="qty-increase-{id}"         # Increase quantity button
data-testid="qty-decrease-{id}"         # Decrease quantity button
data-testid="remove-item-{id}"          # Remove item button
data-testid="cart-total"                # Cart total amount
data-testid="tip-input"                 # Tip input field
data-testid="clear-cart"                # Clear cart button
```

### Checkout Page
```tsx
data-testid="checkout-form"             # Checkout form element
data-testid="checkout-submit"           # Submit order button
data-testid="field-error-{field}"       # Validation error messages
```

### Order Confirmation
```tsx
data-testid="order-number"              # Order number display
data-testid="order-status"              # Order status badge
data-testid="order-location"            # Pickup location
data-testid="order-items"               # Order items list
data-testid="order-total"               # Order total
```

### Kitchen Display (KDS)
```tsx
data-testid="kds-board"                 # KDS container
data-testid="kds-column-{status}"       # Status columns (new, prep, ready)
data-testid="kds-order-{id}"            # Order cards
data-testid="kds-advance-status-{id}"   # Status advance button
```

---

## Environment Variables

### E2E Tests
```bash
# Override route URLs
E2E_MENU_URL=/menu
E2E_CART_URL=/cart
E2E_CHECKOUT_URL=/checkout
E2E_KITCHEN_URL=/kitchen
E2E_ORDER_CONFIRMATION_URL=/order-confirmation

# Strict mode: fail instead of skip on missing selectors
E2E_REQUIRE_TESTIDS=1

# Playwright config
PLAYWRIGHT_BASE_URL=http://localhost:3000
USE_DEV_SERVER=1  # Use dev server instead of production build
```

### Integration Tests
```bash
# API testing tokens
TEST_API_URL=http://localhost:3000
TEST_KITCHEN_TOKEN=your-kitchen-token
TEST_INTERNAL_API_KEY=your-api-key
```

### Fixture Mode
```bash
# Load JSON fixtures instead of live data
USE_FIXTURES=1
```

---

## Fixture Mode

For deterministic tests, enable fixture mode:

```typescript
// In your Sanity client wrapper
import { USE_FIXTURES, getMenuFixture } from '@/tests/fixtures/loader';

export async function getMenu() {
  if (USE_FIXTURES) {
    return getMenuFixture();
  }
  return sanityClient.fetch(menuQuery);
}
```

Run with: `USE_FIXTURES=1 pnpm run test:e2e`

---

## Multi-Browser Testing

Playwright is configured for 5 browser contexts:

| Project | Device |
|---------|--------|
| chromium | Desktop Chrome |
| firefox | Desktop Firefox |
| webkit | Desktop Safari |
| mobile-chrome | Pixel 5 |
| mobile-safari | iPhone 12 |

Run specific browser: `pnpm exec playwright test --project=webkit`

---

## Accessibility Testing

Tests use axe-core for WCAG compliance. Install the dependency:

```bash
pnpm add -D @axe-core/playwright
```

Run a11y tests only: `pnpm run test:a11y`

Tests check for:
- Critical/serious violations
- Keyboard navigation
- ARIA attributes
- Color contrast
- Focus management

---

## CI/CD Pipeline

GitHub Actions workflow included at `.github/workflows/tests.yml`:

1. **Checkout** — Clone repo
2. **Node Setup** — Install Node 20
3. **Dependencies** — `pnpm install --frozen-lockfile`
4. **Unit Tests** — Vitest
5. **Build** — Next.js production build
6. **E2E Tests** — Playwright (with artifacts on failure)

---

## Graceful Degradation

Tests are designed to skip gracefully when prerequisites are missing:

```typescript
// E2E: Skip if selector doesn't exist
await ensureTestId(page, 'cart-badge', 'Add data-testid="cart-badge" to cart icon');

// Unit: Skip if import fails
const mod = await tryImport(() => import('@/lib/cart/store'));
if (!mod) { ctx.skip(); return; }
```

This allows you to merge the test suite early and incrementally add selectors.

---

## Adding New Tests

### Unit Test Template
```typescript
import { describe, test, expect, beforeEach } from 'vitest';
import { tryImport } from './_helpers';

describe('MyFeature', () => {
  test('does something', async (ctx) => {
    const mod = await tryImport(() => import('@/lib/myfeature'));
    if (!mod) { ctx.skip(); return; }

    expect(mod.doSomething()).toBe(true);
  });
});
```

### E2E Test Template
```typescript
import { test, expect } from '@playwright/test';
import { navigateTo, ensureTestId, routes } from './_helpers';

test.describe('My Feature', () => {
  test('works correctly', async ({ page }) => {
    await navigateTo(page, routes.menu);
    await ensureTestId(page, 'my-element', 'Add data-testid="my-element"');
    await expect(page.getByTestId('my-element')).toBeVisible();
  });
});
```

### Integration Test Template
```typescript
import { describe, test, expect, beforeAll } from 'vitest';
import { apiRequest, requireApiAvailable } from './_helpers';

describe('My API', () => {
  let apiAvailable = false;

  beforeAll(async () => {
    apiAvailable = await requireApiAvailable();
  });

  test('returns data', async (ctx) => {
    if (!apiAvailable) { ctx.skip(); return; }

    const response = await apiRequest('/api/my-endpoint');
    expect(response.status).toBe(200);
  });
});
```

---

## Troubleshooting

### Tests skip with "No menu items found"
Add `data-testid="menu-item-{slug}"` to your menu item components.

### Tests skip with "Route returned 404"
Override the route with `E2E_MENU_URL=/your-menu-path`.

### Integration tests fail with 401
Set `TEST_KITCHEN_TOKEN` and `TEST_INTERNAL_API_KEY` environment variables.

### Accessibility tests skip
Install axe-core: `pnpm add -D @axe-core/playwright`

### Playwright can't find browser
Run: `pnpm exec playwright install --with-deps`

---

## Coverage Goals

| Layer | Target | Notes |
|-------|--------|-------|
| Unit | 80%+ | Cart, totals, validation |
| Integration | 100% API routes | All 7 endpoints |
| E2E | Happy paths | Menu → Checkout → Confirm |
| A11y | Zero critical | WCAG 2.1 AA |

---

## Next Steps

1. ✅ Copy files to repo
2. ✅ Install dependencies
3. Add 15-20 `data-testid` attributes
4. Run `pnpm run test:unit` — fix any import paths
5. Run `pnpm run test:e2e` — follow skip messages
6. Enable GitHub Actions
7. Add `USE_FIXTURES=1` to your Sanity client for deterministic tests
