import type { Location } from '@/lib/types';
import { getDistance } from './distance';

/**
 * Find the nearest location to a given set of coordinates.
 *
 * Iterates through all locations, calculates the distance from the user's
 * coordinates to each location, and returns the slug of the closest one.
 * Locations without geo coordinates are skipped.
 *
 * @param userLat - User's latitude in decimal degrees
 * @param userLng - User's longitude in decimal degrees
 * @param locations - Array of Location objects to search through
 * @returns The slug of the nearest location, or null if no locations have coordinates
 *
 * @example
 * ```ts
 * const userLat = 33.2148;
 * const userLng = -97.1331;
 * const locations = await getLocations();
 * const nearest = findNearestLocation(userLat, userLng, locations);
 * console.log(nearest); // "denton"
 * ```
 */
export function findNearestLocation(
  userLat: number,
  userLng: number,
  locations: Location[]
): string | null {
  let nearestLocation: Location | null = null;
  let shortestDistance = Infinity;

  for (const location of locations) {
    // Skip locations without geo coordinates (explicit null/undefined checks to accept 0)
    if (location.geo == null || location.geo.lat == null || location.geo.lng == null) {
      continue;
    }

    const distance = getDistance(
      userLat,
      userLng,
      location.geo.lat,
      location.geo.lng
    );

    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearestLocation = location;
    }
  }

  return nearestLocation?.slug ?? null;
}
