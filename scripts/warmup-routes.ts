#!/usr/bin/env tsx
/**
 * Development route warmup script.
 *
 * Turbopack compiles routes on-demand, which can cause slow first-visits.
 * Run this after `bun run dev` starts to pre-compile all routes.
 *
 * Usage:
 *   bun run warmup       # After dev server is running
 *   bun run dev:warm     # Starts dev + auto-warms after 4s
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// All public routes to warm up
// NOTE: Update this list when adding or removing routes
const routes = [
  // High traffic
  "/",
  "/menu",
  "/locations",
  "/checkout",

  // Staff
  "/kitchen",

  // Content pages
  "/our-story",
  "/gift-cards",
  "/private-events",
  "/features",

  // Account
  "/account",
  "/account/orders",
  "/account/settings",

  // Utility
  "/print-menu",
  "/order-confirmation",
];

async function warmup() {
  console.log(`\n🔥 Warming up ${routes.length} routes on ${BASE_URL}...\n`);
  const start = Date.now();

  const results = await Promise.allSettled(
    routes.map(async (route) => {
      const url = `${BASE_URL}${route}`;
      const routeStart = Date.now();

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(url, {
          headers: { "X-Warmup": "true" },
          redirect: "follow",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const elapsed = Date.now() - routeStart;

        // Accept 200, 307 (redirect), 401 (auth required) as "warmed"
        const ok = [200, 307, 401, 302].includes(res.status);
        const icon = ok ? "✓" : "✗";
        const status = ok ? "" : ` [${res.status}]`;

        console.log(`  ${icon} ${route}${status} (${elapsed}ms)`);
        return { route, status: res.status, elapsed, ok };
      } catch (error) {
        const elapsed = Date.now() - routeStart;
        console.log(`  ✗ ${route} (${elapsed}ms) - connection failed`);
        return { route, status: 0, elapsed, ok: false, error };
      }
    })
  );

  const succeeded = results.filter(
    (r) => r.status === "fulfilled" && r.value.ok
  ).length;
  const totalTime = Date.now() - start;

  console.log(`\n✨ Warmed ${succeeded}/${routes.length} routes in ${totalTime}ms\n`);

  // Exit with error if too many failures
  if (succeeded < routes.length * 0.5) {
    console.error("⚠️  More than half the routes failed to warm. Is the dev server running?");
    process.exit(1);
  }
}

warmup().catch((err) => {
  console.error("Warmup failed:", err);
  process.exit(1);
});
