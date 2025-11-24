/**
 * Calculate the great-circle distance between two points on Earth using the Haversine formula.
 *
 * The Haversine formula determines the shortest distance over the earth's surface,
 * giving an "as-the-crow-flies" distance between the points (ignoring hills, etc.).
 *
 * @param lat1 - Latitude of the first point in decimal degrees
 * @param lng1 - Longitude of the first point in decimal degrees
 * @param lat2 - Latitude of the second point in decimal degrees
 * @param lng2 - Longitude of the second point in decimal degrees
 * @returns Distance between the two points in kilometers
 *
 * @example
 * ```ts
 * // Distance from Dallas to Fort Worth (approx 50km)
 * const distance = getDistance(32.7767, -96.7970, 32.7555, -97.3308);
 * console.log(distance); // ~50.4 km
 * ```
 */
export function getDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Convert degrees to radians.
 *
 * @param degrees - Angle in degrees
 * @returns Angle in radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
