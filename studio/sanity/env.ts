export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-10-03";

// Use official Sanity v4 CLI env names first, fall back to NEXT_PUBLIC variants
export const dataset =
  process.env.SANITY_STUDIO_API_DATASET ||
  process.env.NEXT_PUBLIC_SANITY_DATASET ||
  process.env.SANITY_STUDIO_DATASET ||
  "production";

export const projectId =
  process.env.SANITY_STUDIO_API_PROJECT_ID ||
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
  process.env.SANITY_STUDIO_PROJECT_ID ||
  "cwo08xml";
