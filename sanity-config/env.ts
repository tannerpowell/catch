export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-10-03";

export const dataset =
  process.env.SANITY_STUDIO_API_DATASET ||
  process.env.NEXT_PUBLIC_SANITY_DATASET ||
  "development"; // Safe default - never accidentally connect to production

export const projectId =
  process.env.SANITY_STUDIO_API_PROJECT_ID ||
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

// Runtime validation for required environment variables
const isProduction = process.env.NODE_ENV === "production";

if (!projectId) {
  throw new Error(
    `Missing required environment variable: NEXT_PUBLIC_SANITY_PROJECT_ID (or SANITY_STUDIO_API_PROJECT_ID).\n` +
    `Please set this in your .env.local file or environment configuration.`
  );
}

if (isProduction) {
  // In production, require explicit dataset configuration to prevent accidents
  const explicitDataset =
    process.env.SANITY_STUDIO_API_DATASET ||
    process.env.NEXT_PUBLIC_SANITY_DATASET;

  if (!explicitDataset) {
    throw new Error(
      `Missing required environment variable in production: NEXT_PUBLIC_SANITY_DATASET (or SANITY_STUDIO_API_DATASET).\n` +
      `Production deployments require explicit dataset configuration to prevent accidental data operations.\n` +
      `Current dataset would default to: "${dataset}"`
    );
  }
}
