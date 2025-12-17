import { useState, useCallback, useEffect } from 'react';
import type { Location } from '@/lib/types';
import { getDistance } from '@/lib/utils/distance';

// Storage key for persisted location
const STORAGE_KEY = 'menu3-selected-location';

interface UseNearestLocationOptions {
  locations: Location[];
  /** Default location slug if none selected */
  defaultSlug?: string;
  /** Whether to auto-load from localStorage */
  persistSelection?: boolean;
}

interface UseNearestLocationReturn {
  /** Currently selected location slug */
  selectedSlug: string;
  /** Set the selected location */
  setSelectedSlug: (slug: string) => void;
  /** Whether geolocation is currently being requested */
  isLocating: boolean;
  /** Error message if geolocation failed */
  geoError: string | null;
  /** Trigger geolocation to find nearest */
  findNearest: () => void;
  /** Whether geolocation was denied */
  isGeoDenied: boolean;
  /** The selected location object */
  selectedLocation: Location | undefined;
}

/**
 * Hook to manage location selection with geolocation support.
 * Persists selection to localStorage and provides Find Nearest functionality.
 *
 * @param options - Configuration including available locations
 * @returns Location state and handlers
 *
 * @example
 * ```tsx
 * const { selectedSlug, findNearest, isLocating, selectedLocation } = useNearestLocation({
 *   locations,
 *   defaultSlug: 'denton',
 *   persistSelection: true,
 * });
 * ```
 */
export function useNearestLocation(options: UseNearestLocationOptions): UseNearestLocationReturn {
  const { locations, defaultSlug, persistSelection = true } = options;

  // Initialize with SSR-safe deterministic value to avoid hydration mismatch
  // localStorage hydration happens in useEffect below
  const [selectedSlug, setSelectedSlugState] = useState<string>(
    defaultSlug || locations[0]?.slug || ''
  );

  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isGeoDenied, setIsGeoDenied] = useState(false);

  // Persist selection to localStorage
  const setSelectedSlug = useCallback((slug: string) => {
    setSelectedSlugState(slug);
    if (persistSelection && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, slug);
    }
    // Clear any previous error when manually selecting
    setGeoError(null);
  }, [persistSelection]);

  // Find nearest location based on geolocation
  const findNearest = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Find nearest location
        let nearestSlug: string | null = null;
        let shortestDistance = Infinity;

        for (const location of locations) {
          // Skip locations without geo coordinates (use null check, not truthiness - 0 is valid)
          if (location.geo?.lat == null || location.geo?.lng == null) continue;

          const distance = getDistance(latitude, longitude, location.geo.lat, location.geo.lng);
          if (distance < shortestDistance) {
            shortestDistance = distance;
            nearestSlug = location.slug;
          }
        }

        if (nearestSlug) {
          setSelectedSlug(nearestSlug);
        } else {
          setGeoError('Unable to determine the nearest location');
        }
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);

        switch (error.code) {
          case error.PERMISSION_DENIED:
            setIsGeoDenied(true);
            setGeoError('Location access denied. Please select a location manually.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError('Unable to determine your location. Please try again.');
            break;
          case error.TIMEOUT:
            setGeoError('Location request timed out. Please try again.');
            break;
          default:
            setGeoError('An error occurred while getting your location.');
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000, // 5 minutes
      }
    );
  }, [locations, setSelectedSlug]);

  // Hydrate from localStorage after mount (client-side only)
  // This runs after initial render to sync with persisted preference
  useEffect(() => {
    if (persistSelection && typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      // Only update if stored value is valid and different from current
      if (stored && locations.some(l => l.slug === stored) && stored !== selectedSlug) {
        setSelectedSlugState(stored);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Only run on mount, not on selectedSlug changes
  }, [locations, persistSelection]);

  // Get the selected location object
  const selectedLocation = locations.find(l => l.slug === selectedSlug);

  return {
    selectedSlug,
    setSelectedSlug,
    isLocating,
    geoError,
    findNearest,
    isGeoDenied,
    selectedLocation,
  };
}
