'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import styles from './LocationsMapLegacy.module.css';
import { fallbackGeoCoordinates } from '@/lib/adapters/sanity-catch';
import { formatPhone } from '@/lib/utils/formatPhone';
import { getDistance } from '@/lib/utils/distance';
import type { Location as SharedLocation } from '@/lib/types';

// Use subset of shared Location type for this component
// Fields made optional for defensive rendering (data may not always be complete)
type Location = Pick<SharedLocation, 'slug' | 'name' | 'addressLine1' | 'phone' | 'revelUrl' | 'doordashUrl' | 'uberEatsUrl'> & {
  city?: string;
  state?: string;
  postalCode?: string;
};

interface LocationsMapProps {
  locations: Location[];
  onLocationSelect?: (slug: string) => void;
}

// Build Apple Maps URL
const getAppleMapsUrl = (location: Location) => {
  const address = [
    location.addressLine1,
    location.city,
    location.state,
    location.postalCode
  ].filter(Boolean).join(', ');
  return `https://maps.apple.com/?address=${encodeURIComponent(address)}`;
};

// Validate and normalize URLs - only allow safe protocols
const sanitizeUrl = (url: string | undefined): string | null => {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    // Only allow http, https, and tel protocols
    if (['http:', 'https:', 'tel:'].includes(urlObj.protocol)) {
      return url;
    }
  } catch {
    // Invalid URL format
  }
  return null;
};

// Create popup DOM safely using document.createElement
const createLocationPopup = (location: Location): HTMLElement => {
  const container = document.createElement('div');
  container.style.fontFamily = 'var(--font-family--headings)';
  container.style.padding = '12px';

  // Title
  const title = document.createElement('h3');
  title.style.margin = '0 0 12px 0';
  title.style.fontSize = '16px';
  title.style.fontWeight = '600';
  title.style.color = '#322723';
  title.textContent = location.name;
  container.appendChild(title);

  // Address section
  const appleMapsUrl = getAppleMapsUrl(location);
  const addressDiv = document.createElement('div');
  addressDiv.style.marginBottom = '8px';

  const addressLink = document.createElement('a');
  addressLink.href = appleMapsUrl;
  addressLink.target = '_blank';
  addressLink.rel = 'noopener noreferrer';
  addressLink.style.color = '#2B7A9B';
  addressLink.style.textDecoration = 'none';
  addressLink.style.fontSize = '14px';
  addressLink.style.lineHeight = '1.4';

  // Build address text defensively to avoid "undefined" in output
  const addressParts: string[] = [];
  if (location.addressLine1) {
    addressParts.push(location.addressLine1);
  }
  // Build city/state/zip line only with defined parts
  const cityStateZip = [
    location.city,
    location.state ? (location.city ? `, ${location.state}` : location.state) : null,
    location.postalCode
  ].filter(Boolean).join(' ').replace(' , ', ', ');
  if (cityStateZip) {
    addressParts.push(cityStateZip);
  }
  addressLink.textContent = addressParts.join('\n');

  addressDiv.appendChild(addressLink);
  container.appendChild(addressDiv);

  // Phone section
  if (location.phone) {
    const phoneDiv = document.createElement('div');
    phoneDiv.style.marginBottom = '12px';

    const phoneLink = document.createElement('a');
    const sanitizedPhone = sanitizeUrl(`tel:${location.phone}`);
    if (sanitizedPhone) {
      phoneLink.href = sanitizedPhone;
      phoneLink.style.color = '#2B7A9B';
      phoneLink.style.textDecoration = 'none';
      phoneLink.style.fontSize = '15px';
      phoneLink.style.fontWeight = '700';
      phoneLink.style.display = 'inline-block';
      phoneLink.style.padding = '6px 12px';
      phoneLink.style.background = 'rgba(43, 122, 155, 0.1)';
      phoneLink.style.borderRadius = '4px';
      phoneLink.style.transition = 'all 0.2s';
      phoneLink.textContent = formatPhone(location.phone);

      phoneDiv.appendChild(phoneLink);
      container.appendChild(phoneDiv);
    }
  }

  // Action buttons
  const buttonsDiv = document.createElement('div');
  buttonsDiv.style.display = 'flex';
  buttonsDiv.style.gap = '6px';
  buttonsDiv.style.flexWrap = 'wrap';
  buttonsDiv.style.marginTop = '12px';
  buttonsDiv.style.paddingTop = '12px';
  buttonsDiv.style.borderTop = '1px solid rgba(0,0,0,0.1)';

  // Order button
  if (location.revelUrl) {
    const orderUrl = sanitizeUrl(location.revelUrl);
    if (orderUrl) {
      const orderBtn = document.createElement('a');
      orderBtn.href = orderUrl;
      orderBtn.target = '_blank';
      orderBtn.rel = 'noopener noreferrer';
      orderBtn.style.padding = '6px 12px';
      orderBtn.style.background = '#2B7A9B';
      orderBtn.style.color = 'white';
      orderBtn.style.textDecoration = 'none';
      orderBtn.style.borderRadius = '4px';
      orderBtn.style.fontSize = '12px';
      orderBtn.style.fontWeight = '600';
      orderBtn.textContent = 'Order';
      buttonsDiv.appendChild(orderBtn);
    }
  }

  // DoorDash button
  if (location.doordashUrl) {
    const doordashUrl = sanitizeUrl(location.doordashUrl);
    if (doordashUrl) {
      const doordashBtn = document.createElement('a');
      doordashBtn.href = doordashUrl;
      doordashBtn.target = '_blank';
      doordashBtn.rel = 'noopener noreferrer';
      doordashBtn.style.padding = '6px 12px';
      doordashBtn.style.background = '#FF3008';
      doordashBtn.style.color = 'white';
      doordashBtn.style.textDecoration = 'none';
      doordashBtn.style.borderRadius = '4px';
      doordashBtn.style.fontSize = '12px';
      doordashBtn.style.fontWeight = '600';
      doordashBtn.textContent = 'DoorDash';
      buttonsDiv.appendChild(doordashBtn);
    }
  }

  // Uber Eats button
  if (location.uberEatsUrl) {
    const uberUrl = sanitizeUrl(location.uberEatsUrl);
    if (uberUrl) {
      const uberBtn = document.createElement('a');
      uberBtn.href = uberUrl;
      uberBtn.target = '_blank';
      uberBtn.rel = 'noopener noreferrer';
      uberBtn.style.padding = '6px 12px';
      uberBtn.style.background = '#06C167';
      uberBtn.style.color = 'white';
      uberBtn.style.textDecoration = 'none';
      uberBtn.style.borderRadius = '4px';
      uberBtn.style.fontSize = '12px';
      uberBtn.style.fontWeight = '600';
      uberBtn.textContent = 'Uber Eats';
      buttonsDiv.appendChild(uberBtn);
    }
  }

  container.appendChild(buttonsDiv);

  return container;
};

// Derive coordinates from shared fallbackGeoCoordinates (convert to Mapbox [lng, lat] format)
const locationCoords: Record<string, [number, number]> = Object.fromEntries(
  Object.entries(fallbackGeoCoordinates).map(([slug, { lat, lng }]) => [slug, [lng, lat]])
);

export default function LocationsMapLegacy({ locations, onLocationSelect }: LocationsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [nearestLocation, setNearestLocation] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Validate Mapbox token
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!mapboxToken || typeof mapboxToken !== 'string' || mapboxToken.trim() === '') {
      const errorMsg = 'Missing or invalid NEXT_PUBLIC_MAPBOX_TOKEN environment variable. Map will not be initialized.';
      console.error(errorMsg);
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-96.5, 32.5], // Center between Texas and Oklahoma locations
      zoom: 5.5,
    });

    map.current = mapInstance;

    // Add location markers
    locations.forEach((location) => {
      const coords = locationCoords[location.slug];
      if (!coords) return;

      const el = document.createElement('div');
      el.className = styles.marker;
      el.innerHTML = '📍';
      
      // Accessibility attributes
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', `Location: ${location.name}`);

      // Handler function for both click and keyboard events
      // Only set selectedLocation, not nearestLocation (which is for "Find Nearest" feature)
      const handleActivation = () => {
        setSelectedLocation(location);
      };

      // Click handler for marker
      el.addEventListener('click', handleActivation);

      // Keyboard event handling (Enter and Space keys)
      el.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleActivation();
        }
      });

      new mapboxgl.Marker(el)
        .setLngLat(coords)
        .setPopup(
          new mapboxgl.Popup({ offset: 25, maxWidth: '280px' })
            .setDOMContent(createLocationPopup(location))
        )
        .addTo(mapInstance);
    });

    return () => {
      // Clean up user marker
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      mapInstance.remove();
      map.current = null;
    };
  }, [locations]);

  const findNearestLocation = () => {
    // Clear previous errors
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userCoords: [number, number] = [
          position.coords.longitude,
          position.coords.latitude,
        ];

        // Calculate nearest location
        let nearest: string | null = null;
        let minDistance = Infinity;

        locations.forEach((location) => {
          const coords = locationCoords[location.slug];
          if (!coords) return;

          // coords are [lon, lat], userCoords are [lon, lat]
          // Use shared getDistance utility from lib/utils/distance.ts
          const distance = getDistance(
            userCoords[1], // lat1
            userCoords[0], // lng1
            coords[1],     // lat2
            coords[0]      // lng2
          );

          if (distance < minDistance) {
            minDistance = distance;
            nearest = location.slug;
          }
        });

        setNearestLocation(nearest);
        const nearestLoc = locations.find(l => l.slug === nearest);
        if (nearestLoc) {
          setSelectedLocation(nearestLoc);
        }
        if (onLocationSelect && nearest) {
          onLocationSelect(nearest);
        }

        // Fly to user location
        const currentMap = map.current;
        if (currentMap) {
          currentMap.flyTo({
            center: userCoords,
            zoom: 10,
          });

          // Remove existing user marker before adding new one
          if (userMarkerRef.current) {
            userMarkerRef.current.remove();
          }

          // Add user location marker and store in ref
          userMarkerRef.current = new mapboxgl.Marker({ color: '#2B7A9B' })
            .setLngLat(userCoords)
            .addTo(currentMap);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setError('Unable to retrieve your location. Please check your permissions and try again.');
      }
    );
  };

  return (
    <div className={styles.mapWrapper}>
      <div className={styles.mapControls}>
        <button onClick={findNearestLocation} className={styles.findButton}>
          Find Nearest Location
        </button>
        {error && (
          <div className={styles.errorMessage} role="alert">
            {error}
            <button
              onClick={() => setError(null)}
              className={styles.closeError}
              aria-label="Close error message"
            >
              ×
            </button>
          </div>
        )}
        {selectedLocation && (
          <div className={styles.locationInfo}>
            <div className={styles.locationName}>
              {nearestLocation === selectedLocation.slug && 'Nearest: '}
              {selectedLocation.name}
            </div>
            <div className={styles.locationDetails}>
              <a
                href={getAppleMapsUrl(selectedLocation)}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.detailLink}
              >
                {selectedLocation.addressLine1}
                {(selectedLocation.city || selectedLocation.state || selectedLocation.postalCode) && (
                  <>
                    <br />
                    {selectedLocation.city}
                    {selectedLocation.city && selectedLocation.state && ', '}
                    {selectedLocation.state}
                    {(selectedLocation.city || selectedLocation.state) && selectedLocation.postalCode && ' '}
                    {selectedLocation.postalCode}
                  </>
                )}
              </a>
            </div>
            <div className={styles.actionButtons}>
              <a
                href={getAppleMapsUrl(selectedLocation)}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.primaryButton}
              >
                Directions
              </a>
              {selectedLocation.phone && (
                <a
                  href={`tel:${selectedLocation.phone}`}
                  className={styles.primaryButton}
                >
                  {formatPhone(selectedLocation.phone)}
                </a>
              )}
            </div>
            <div className={styles.orderLinks}>
              {selectedLocation.doordashUrl && (
                <a href={selectedLocation.doordashUrl} target="_blank" rel="noopener noreferrer" className={styles.orderLink}>
                  DoorDash
                </a>
              )}
              {selectedLocation.uberEatsUrl && (
                <a href={selectedLocation.uberEatsUrl} target="_blank" rel="noopener noreferrer" className={styles.orderLink}>
                  Uber Eats
                </a>
              )}
            </div>
          </div>
        )}
      </div>
      <div ref={mapContainer} className={styles.mapContainer} />
    </div>
  );
}
