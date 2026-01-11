import type { CircuitState } from "@/lib/utils/circuit-breaker";
import { logger } from "@/lib/utils/logger";

export const CACHE_REVALIDATE_SECONDS = 60;

export const CACHE_TAGS = {
  categories: 'sanity-categories',
  locations: 'sanity-locations',
  items: 'sanity-items',
  all: 'sanity-content',
} as const;

/**
 * Circuit breaker configuration for Sanity client
 * Automatically falls back to demo data when Sanity API fails
 * - failureThreshold: Number of failures before opening circuit
 * - resetTimeout: Time in ms before attempting to close circuit
 * - successThreshold: Consecutive successes needed to fully close circuit
 */
export const SANITY_CIRCUIT_OPTIONS = {
  failureThreshold: 5,
  resetTimeout: 30000,
  successThreshold: 2,
  onStateChange: (from: CircuitState, to: CircuitState, serviceName: string) => {
    if (to === 'OPEN') {
      logger.error('Circuit breaker opened - falling back to demo data', {
        serviceName,
        from,
        to,
        timestamp: new Date().toISOString(),
      });
    } else if (to === 'CLOSED') {
      logger.info('Circuit breaker closed - back to normal operation', {
        serviceName,
        from,
        to,
        timestamp: new Date().toISOString(),
      });
    }
  },
};

export const fallbackLocationPhotography = {
  conroe: "/images/Location-Conroe.jpg",
  humble: "/images/Location-Humble.jpg",
  "s-post-oak": "/images/Location-Post-Oak.jpg",
  willowbrook: "/images/Location-Willowbrook.jpg",
} as const;

export const defaultFallbackHero = fallbackLocationPhotography.humble;

export const fallbackGeoCoordinates = {
  // Oklahoma locations
  "okc-memorial": { lat: 35.610210, lng: -97.550766 },
  "midwest-city": { lat: 35.440914, lng: -97.405760 },
  "moore": { lat: 35.327000, lng: -97.491210 },
  // Texas locations
  "arlington": { lat: 32.675407, lng: -97.196220 },
  "atascocita": { lat: 29.993227, lng: -95.177946 },
  "humble": { lat: 29.9988, lng: -95.2622 },
  "burleson": { lat: 32.519184, lng: -97.348927 },
  "coit-campbell": { lat: 32.977688, lng: -96.770851 },
  "conroe": { lat: 30.317270, lng: -95.478130 },
  "denton": { lat: 33.229110, lng: -97.150930 },
  "garland": { lat: 32.949788, lng: -96.651562 },
  "longview": { lat: 32.521200, lng: -94.747800 },
  "lubbock": { lat: 33.519250, lng: -101.921089 },
  "s-post-oak": { lat: 29.672800, lng: -95.460240 },
  "tyler": { lat: 32.331307, lng: -95.289808 },
  "wichita-falls": { lat: 33.880000, lng: -98.520000 },
  "willowbrook": { lat: 29.963846, lng: -95.543372 },
} as const;

export type FallbackLocationSlug = keyof typeof fallbackGeoCoordinates;

/**
 * Get geo coordinates for a location slug
 */
export function getGeoCoordinates(slug: string): { lat: number; lng: number } | undefined {
  return (fallbackGeoCoordinates as Record<string, { lat: number; lng: number }>)[slug];
}

/**
 * Get hero image for location, falling back to default if slug is invalid or not found
 */
export function fallbackHero(slug: string): string {
  const key = slug.trim().toLowerCase();
  return (fallbackLocationPhotography as Record<string, string>)[key] ?? defaultFallbackHero;
}
