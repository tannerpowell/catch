import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import path from 'path';

/**
 * Load environment variables from .env.local
 */
export function loadEnvConfig(): void {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

/**
 * Validate required Sanity environment variables
 */
export function validateSanityEnv(): {
  projectId: string;
  dataset: string;
  token: string;
} {
  loadEnvConfig();

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const token = process.env.SANITY_WRITE_TOKEN;

  const missingVars: string[] = [];
  if (!projectId) missingVars.push('NEXT_PUBLIC_SANITY_PROJECT_ID');
  if (!dataset) missingVars.push('NEXT_PUBLIC_SANITY_DATASET');
  if (!token) missingVars.push('SANITY_WRITE_TOKEN');

  if (missingVars.length > 0) {
    console.error(
      `Missing required environment variables:\n${missingVars.map(v => `  - ${v}`).join('\n')}\n\n` +
      'Please set these variables in your .env.local file or CI/CD environment.'
    );
    process.exit(1);
  }

  // TypeScript doesn't know that process.exit() stops execution,
  // so we assert these are defined after validation
  return {
    projectId: projectId!,
    dataset: dataset!,
    token: token!,
  };
}

/**
 * Create and return a validated Sanity client
 */
export function getSanityClient(apiVersion: string = '2025-11-22') {
  const { projectId, dataset, token } = validateSanityEnv();

  return createClient({
    projectId,
    dataset,
    token,
    apiVersion,
    useCdn: false,
  });
}
