'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import styles from './LocationsMap.module.css';

interface Location {
  slug: string;
  name: string;
  addressLine1: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
  revelUrl?: string;
  doordashUrl?: string;
  uberEatsUrl?: string;
}

interface LocationsMapProps {
  locations: Location[];
  onLocationSelect?: (slug: string) => void;
}

// Format phone for display
const formatPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
  }
  return phone;
};

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

// Calculate geographic distance using haversine formula
const degreesToRadians = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};

const calculateHaversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(lat1)) *
      Math.cos(degreesToRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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

  const addressText = [location.addressLine1, `${location.city}, ${location.state} ${location.postalCode}`]
    .filter(Boolean)
    .join('\n');
  addressLink.textContent = addressText;

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

// Coordinates for each location [lng, lat] (Mapbox format)
const locationCoords: Record<string, [number, number]> = {
  // Oklahoma locations
  'okc-memorial': [-97.550766, 35.610210],
  'midwest-city': [-97.405760, 35.440914],
  'moore': [-97.491210, 35.327000],
  // Texas locations
  'arlington': [-97.196220, 32.675407],
  'atascocita': [-95.177946, 29.993227],
  'burleson': [-97.348927, 32.519184],
  'coit-campbell': [-96.770851, 32.977688],
  'conroe': [-95.478130, 30.317270],
  'denton': [-97.150930, 33.229110],
  'garland': [-96.651562, 32.949788],
  'longview': [-94.747800, 32.521200],
  'lubbock': [-101.921089, 33.519250],
  's-post-oak': [-95.460240, 29.672800],
  'tyler': [-95.289808, 32.331307],
  'wichita-falls': [-98.520000, 33.880000],
  'willowbrook': [-95.543372, 29.963846],
};

export default function LocationsMap({ locations, onLocationSelect }: LocationsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
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
      const handleActivation = () => {
        setSelectedLocation(location);
        setNearestLocation(location.slug);
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
        setUserLocation(userCoords);

        // Calculate nearest location
        let nearest: string | null = null;
        let minDistance = Infinity;

        locations.forEach((location) => {
          const coords = locationCoords[location.slug];
          if (!coords) return;

          // coords are [lon, lat], userCoords are [lon, lat]
          const distance = calculateHaversineDistance(
            userCoords[1], // lat1
            userCoords[0], // lon1
            coords[1],     // lat2
            coords[0]      // lon2
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

          // Add user location marker
          new mapboxgl.Marker({ color: '#2B7A9B' })
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
                {selectedLocation.addressLine1}<br />
                {selectedLocation.city}, {selectedLocation.state} {selectedLocation.postalCode}
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
