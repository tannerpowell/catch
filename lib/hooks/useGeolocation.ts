import { useState, useEffect } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to request and retrieve user's geolocation coordinates.
 *
 * Requests permission via the browser's Geolocation API and returns
 * the user's latitude and longitude if granted. Handles errors gracefully.
 *
 * @returns {GeolocationState} Object containing latitude, longitude, loading state, and error
 *
 * @example
 * ```tsx
 * const { latitude, longitude, loading, error } = useGeolocation();
 *
 * if (loading) return <div>Getting your location...</div>;
 * if (error) return <div>Could not get location</div>;
 * if (latitude && longitude) {
 *   // Use coordinates
 * }
 * ```
 */
export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setState({
        latitude: null,
        longitude: null,
        loading: false,
        error: 'Geolocation is not supported by your browser',
      });
      return;
    }

    // Request user's position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          loading: false,
          error: null,
        });
      },
      (error) => {
        // Handle errors gracefully - user denied permission or other error
        setState({
          latitude: null,
          longitude: null,
          loading: false,
          error: error.message,
        });
      },
      {
        enableHighAccuracy: false, // Don't need exact GPS, faster response
        timeout: 5000, // 5 second timeout
        maximumAge: 300000, // Accept cached position up to 5 minutes old
      }
    );
  }, []);

  return state;
}
