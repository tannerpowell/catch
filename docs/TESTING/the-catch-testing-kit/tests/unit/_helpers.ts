/**
 * Unit Test Helpers
 *
 * Graceful utilities for handling missing imports and test skipping.
 * Designed to work with Vitest's test context API.
 */

/**
 * Attempt to import a module, returning null on failure.
 * Use with ctx.skip() in your test for graceful skipping.
 *
 * @example
 * ```ts
 * test('cart operations', async (ctx) => {
 *   const mod = await tryImport(() => import('@/lib/cart/store'));
 *   if (!mod) {
 *     ctx.skip();
 *     return;
 *   }
 *   // ... test using mod ...
 * });
 * ```
 */
export async function tryImport<T>(importer: () => Promise<T>): Promise<T | null> {
  try {
    return await importer();
  } catch {
    return null;
  }
}

/**
 * Create a mock localStorage for testing cart persistence.
 * Returns an object that mimics the localStorage API.
 */
export function createMockLocalStorage(): Storage {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
}

/**
 * Reset localStorage mock between tests.
 * Call in beforeEach() to ensure test isolation.
 */
export function resetLocalStorage(storage: Storage): void {
  storage.clear();
}
