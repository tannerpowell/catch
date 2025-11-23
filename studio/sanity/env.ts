const fallbackDataset = "production";
const fallbackProjectId = "cwo08xml";

export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-10-03";

// Validate dataset with fallback only if validation passes
const datasetValue = process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_STUDIO_DATASET;
export const dataset = assertValue(
  datasetValue,
  "Missing environment variable: NEXT_PUBLIC_SANITY_DATASET or SANITY_STUDIO_DATASET"
) || fallbackDataset;

// Validate projectId with fallback only if validation passes
const projectIdValue = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID;
export const projectId = assertValue(
  projectIdValue,
  "Missing environment variable: NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_STUDIO_PROJECT_ID"
) || fallbackProjectId;

function assertValue<T>(value: T | undefined, errorMessage: string): T {
  if (!value) {
    throw new Error(errorMessage);
  }
  return value;
}
