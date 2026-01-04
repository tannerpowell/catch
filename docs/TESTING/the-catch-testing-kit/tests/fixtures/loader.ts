/**
 * Fixture Loader
 *
 * Utilities for loading test fixtures and creating mock clients.
 * Enable fixture mode with USE_FIXTURES=1 environment variable.
 */

import type { SanityClient } from "@sanity/client";
import menuFixture from "./sanity/menu.sample.json";
import ordersFixture from "./orders/sample-orders.json";

/**
 * Whether fixture mode is enabled.
 * Set USE_FIXTURES=1 to use fixture data instead of live Sanity.
 */
export const USE_FIXTURES = process.env.USE_FIXTURES === "1";

/**
 * Get the menu fixture data.
 * @throws if USE_FIXTURES is not enabled
 */
export function getMenuFixture() {
  if (!USE_FIXTURES) {
    throw new Error("Fixtures not enabled. Set USE_FIXTURES=1");
  }
  return menuFixture;
}

/**
 * Get the orders fixture data.
 * @throws if USE_FIXTURES is not enabled
 */
export function getOrdersFixture() {
  if (!USE_FIXTURES) {
    throw new Error("Fixtures not enabled. Set USE_FIXTURES=1");
  }
  return ordersFixture;
}

/**
 * Get raw fixture data without checking USE_FIXTURES.
 * Useful for unit tests that always use fixtures.
 */
export function getRawMenuFixture() {
  return menuFixture;
}

export function getRawOrdersFixture() {
  return ordersFixture;
}

/**
 * Create a mock Sanity client that returns fixture data.
 *
 * @example
 * ```ts
 * vi.mock('@sanity/client', () => createMockSanityClient());
 * ```
 */
export function createMockSanityClient() {
  return {
    createClient: () => ({
      fetch: async (query: string) => {
        // Match GROQ query patterns
        if (query.includes("menuCategory")) return menuFixture.categories;
        if (query.includes("menuItem")) return menuFixture.items;
        if (query.includes("location")) return menuFixture.locations;
        if (query.includes("order")) return ordersFixture.orders;

        throw new Error(`No fixture for GROQ query: ${query.slice(0, 50)}...`);
      },
      create: async (doc: unknown) => doc,
      createOrReplace: async (doc: unknown) => doc,
      patch: () => ({
        set: () => ({ commit: async () => ({}) }),
      }),
      delete: async () => ({}),
    }),
  };
}

/**
 * Mock fetch implementation for Sanity API requests.
 * Use with vi.mock or jest.mock for fetch.
 *
 * @example
 * ```ts
 * beforeEach(() => {
 *   global.fetch = createMockSanityFetch();
 * });
 * ```
 */
export function createMockSanityFetch() {
  return async (url: string) => {
    if (url.includes("sanity.io")) {
      return {
        ok: true,
        json: async () => ({
          result: menuFixture.categories,
        }),
      };
    }
    throw new Error(`Unmocked fetch: ${url}`);
  };
}

/**
 * Seed test data into Sanity for E2E tests.
 * Creates orders with predictable IDs prefixed with "ORD-TEST-".
 */
export async function seedTestData(sanityClient: SanityClient) {
  const orders = ordersFixture.orders;

  for (const order of orders) {
    await sanityClient.createOrReplace({
      _id: `test-${order.id}`,
      _type: "order",
      ...order,
      orderNumber: `ORD-TEST-${order.id}`,
    });
  }

  return orders.map((o) => `ORD-TEST-${o.id}`);
}

/**
 * Clean up test data from Sanity after E2E tests.
 * Removes all orders with "ORD-TEST-" prefix.
 */
export async function cleanupTestData(sanityClient: SanityClient) {
  await sanityClient.delete({
    query: '*[_type == "order" && orderNumber match "ORD-TEST-*"]',
  });
}

/**
 * Test order numbers for use in E2E tests.
 * These match the sample-orders.json fixture.
 */
export const testOrderNumbers = {
  newOrder: "ORD-TEST-ord_001",
  preparingOrder: "ORD-TEST-ord_002",
};

/**
 * Type definitions for fixture data
 */
export interface MenuFixture {
  categories: Array<{
    id: string;
    slug: string;
    title: string;
  }>;
  items: Array<{
    id: string;
    name: string;
    categoryId: string;
    basePriceCents: number;
    modifierGroups?: Array<{
      id: string;
      name: string;
      options: string[];
    }>;
  }>;
  locations: Array<{
    id: string;
    slug: string;
    title: string;
    taxRate?: number;
  }>;
}

export interface OrderFixture {
  id: string;
  location: string;
  status: string;
  createdAt: string;
  customer: {
    name: string;
    phone: string;
  };
  items: Array<{
    name: string;
    qty: number;
    modifiers?: string[];
    priceCents: number;
  }>;
  totals: {
    subtotalCents: number;
    taxCents: number;
    totalCents: number;
  };
}
