import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * Vitest Configuration
 *
 * Supports three test layers:
 * - Unit tests: tests/unit/**/*.test.ts(x)
 * - Integration tests: tests/integration/**/*.test.ts
 * - Source-level tests: src/**/*.test.ts(x)
 *
 * Run specific layers:
 * - npm run test:unit       → Unit tests only
 * - npm run test:integration → Integration tests only
 * - npm run test            → All tests
 */
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "tests/unit/**/*.test.ts",
      "tests/unit/**/*.test.tsx",
      "tests/integration/**/*.test.ts",
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
    ],
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      reportsDirectory: "./tests/coverage",
      exclude: [
        "**/node_modules/**",
        "**/.next/**",
        "**/tests/e2e/**",
        "**/tests/fixtures/**",
      ],
    },
    // Separate test pools for different test types
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },
  },
});
