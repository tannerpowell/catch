import { createClient } from "@sanity/client";
import { SANITY_API_VERSION } from "@/lib/sanity/constants";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

export const hasSanityConfig = Boolean(projectId && dataset);

export const client = hasSanityConfig
  ? createClient({
      projectId: projectId!,
      dataset: dataset!,
      apiVersion: SANITY_API_VERSION,
      useCdn: true,
      perspective: 'published',
      stega: {
        enabled: false,
        studioUrl: process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || '/studio'
      }
    })
  : null;
