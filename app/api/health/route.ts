import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import { SANITY_API_VERSION, SANITY_FETCH_TIMEOUT } from '@/lib/sanity/constants';
import { getCircuitStats, type CircuitState } from '@/lib/utils/circuit-breaker';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    sanity: {
      status: 'up' | 'down';
      latencyMs?: number;
      error?: string;
    };
  };
  circuitBreakers?: {
    [key: string]: {
      state: CircuitState;
      failures: number;
    };
  };
}

const BUILD_VERSION = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local';

/**
 * Health check endpoint for monitoring and load balancers
 *
 * GET /api/health
 * Returns 200 if healthy, 503 if critical services are down
 */
export async function GET(): Promise<NextResponse<HealthStatus>> {
  const timestamp = new Date().toISOString();

  // Check Sanity connectivity
  const sanityCheck = await checkSanity();

  // Get circuit breaker stats
  const circuitBreakers = {
    'sanity-categories': getCircuitStats('sanity-categories'),
    'sanity-locations': getCircuitStats('sanity-locations'),
    'sanity-items': getCircuitStats('sanity-items'),
  };

  // Check if any circuit is open (degraded state)
  const hasOpenCircuit = Object.values(circuitBreakers).some(cb => cb.state === 'OPEN');

  // Determine overall status
  const isHealthy = sanityCheck.status === 'up' && !hasOpenCircuit;
  const isDegraded = sanityCheck.status === 'up' && hasOpenCircuit;
  const overallStatus: HealthStatus['status'] = isHealthy ? 'healthy' : (isDegraded ? 'degraded' : 'unhealthy');

  const response: HealthStatus = {
    status: overallStatus,
    timestamp,
    version: BUILD_VERSION,
    checks: {
      sanity: sanityCheck,
    },
    circuitBreakers: Object.fromEntries(
      Object.entries(circuitBreakers).map(([key, stats]) => [
        key,
        { state: stats.state, failures: stats.failures }
      ])
    ),
  };

  return NextResponse.json(response, {
    status: isHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

async function checkSanity(): Promise<HealthStatus['checks']['sanity']> {
  const startTime = Date.now();

  try {
    const client = createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
      apiVersion: SANITY_API_VERSION,
      useCdn: true,
    });

    // Simple query to verify connectivity - just count a document type
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SANITY_FETCH_TIMEOUT);

    try {
      await client.fetch(
        `count(*[_type == "location"])`,
        {},
        { signal: controller.signal }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    const latencyMs = Date.now() - startTime;

    return {
      status: 'up',
      latencyMs,
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    return {
      status: 'down',
      latencyMs,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
