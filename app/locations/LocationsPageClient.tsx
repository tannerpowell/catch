'use client';

import { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { fallbackGeoCoordinates } from '@/lib/adapters/sanity-catch';
import { formatPhone } from '@/lib/utils/formatPhone';
import styles from './LocationsPageClient.module.css';

const LocationsMap = dynamic(() => import('@/components/catch/LocationsMap'), {
  ssr: false,
  loading: () => <div className={styles.mapLoading} />
});

interface Location {
  slug: string;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  phone?: string;
  hours?: {
    sunday?: string;
    friday?: string;
  } | string;
  revelUrl?: string;
  doordashUrl?: string;
  uberEatsUrl?: string;
}

interface LocationsPageClientProps {
  locations: Location[];
}

// Region definitions matching LocationBar.tsx
const REGIONS: Record<string, { label: string; slugs: string[] | null }> = {
  ALL: { label: 'All', slugs: null },
  DFW: { label: 'DFW', slugs: ['denton', 'coit-campbell', 'garland', 'arlington', 'burleson'] },
  HOUSTON: { label: 'Houston', slugs: ['conroe', 'humble', 's-post-oak', 'willowbrook', 'atascocita'] },
  OKLAHOMA: { label: 'Oklahoma', slugs: ['okc-memorial', 'midwest-city', 'moore'] },
  EAST_TX: { label: 'East TX', slugs: ['tyler', 'longview'] },
  WEST_TX: { label: 'West TX', slugs: ['lubbock', 'wichita-falls'] },
};

type RegionKey = 'ALL' | 'DFW' | 'HOUSTON' | 'OKLAHOMA' | 'EAST_TX' | 'WEST_TX';

function getAppleMapsUrl(location: Location): string {
  const address = [
    location.addressLine1,
    location.city,
    location.state,
    location.postalCode
  ].filter(Boolean).join(', ');
  return `https://maps.apple.com/?address=${encodeURIComponent(address)}`;
}

// Remove "The Catch" prefix from location names
function getDisplayName(name: string): string {
  return name.replace(/^The Catch\s*[—–-]\s*/i, '').trim();
}

// Parse time string like "11:00 AM" or "10 PM" into minutes since midnight
function parseTime(timeStr: string): number | null {
  const match = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM|am|pm)/i);
  if (!match) return null;

  let hours = parseInt(match[1]);
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const isPM = match[3].toLowerCase() === 'pm';

  if (isPM && hours !== 12) hours += 12;
  if (!isPM && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

// Parse hours string like "11:00 AM - 10:00 PM" into open/close times
function parseHoursRange(hoursStr: string): { open: number; close: number } | null {
  const parts = hoursStr.split(/\s*[-–]\s*/);
  if (parts.length !== 2) return null;

  const open = parseTime(parts[0]);
  const close = parseTime(parts[1]);

  if (open === null || close === null) return null;
  return { open, close };
}

// Determine if location is currently open
function isLocationOpen(hours: Location['hours']): boolean | null {
  if (!hours) return null;

  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  let hoursStr: string | undefined;

  if (typeof hours === 'string') {
    hoursStr = hours;
  } else {
    // Sunday = 0, Monday-Thursday = 1-4, Friday = 5, Saturday = 6
    if (day === 5 || day === 6) {
      hoursStr = hours.friday;
    } else {
      hoursStr = hours.sunday;
    }
  }

  if (!hoursStr) return null;

  const range = parseHoursRange(hoursStr);
  if (!range) return null;

  // Handle closing after midnight (e.g., 11 AM - 1 AM)
  if (range.close < range.open) {
    return currentMinutes >= range.open || currentMinutes < range.close;
  }

  return currentMinutes >= range.open && currentMinutes < range.close;
}

// Get formatted hours string for display
function getDisplayHours(hours: Location['hours']): { weekday: string; weekend: string } | null {
  if (!hours) return null;

  if (typeof hours === 'string') {
    return { weekday: hours, weekend: hours };
  }

  return {
    weekday: hours.sunday || '',
    weekend: hours.friday || ''
  };
}

export default function LocationsPageClient({ locations }: LocationsPageClientProps) {
  const [region, setRegion] = useState<RegionKey>('ALL');
  const [isLocating, setIsLocating] = useState(false);
  const [nearestSlug, setNearestSlug] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);

  // Haversine distance calculation
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }, []);

  const handleFindNearest = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Store user coords for map zoom [lng, lat] format
        setUserCoords([longitude, latitude]);

        let nearest: string | null = null;
        let minDistance = Infinity;

        locations.forEach(location => {
          const coords = fallbackGeoCoordinates[location.slug];
          if (!coords) return;
          const distance = calculateDistance(latitude, longitude, coords.lat, coords.lng);
          if (distance < minDistance) {
            minDistance = distance;
            nearest = location.slug;
          }
        });

        setNearestSlug(nearest);
        setRegion('ALL'); // Switch to All so nearest location is visible
        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsLocating(false);
      }
    );
  }, [locations, calculateDistance]);

  // Get nearest location object for banner
  const nearestLocation = useMemo(() => {
    if (!nearestSlug) return null;
    return locations.find(l => l.slug === nearestSlug) || null;
  }, [locations, nearestSlug]);

  // Get nearest location coordinates for map
  const nearestCoords = useMemo((): [number, number] | null => {
    if (!nearestSlug) return null;
    const coords = fallbackGeoCoordinates[nearestSlug];
    if (!coords) return null;
    return [coords.lng, coords.lat];
  }, [nearestSlug]);

  const filteredLocations = useMemo(() => {
    const regionConfig = REGIONS[region];
    if (!regionConfig.slugs) return locations;
    return locations.filter(location => regionConfig.slugs!.includes(location.slug));
  }, [locations, region]);

  // Group locations by region for display
  const groupedLocations = useMemo(() => {
    if (region !== 'ALL') {
      return [{ region, locations: filteredLocations }];
    }

    // Group by region when showing all
    const groups: { region: RegionKey; locations: Location[] }[] = [];
    const regionOrder: RegionKey[] = ['DFW', 'HOUSTON', 'OKLAHOMA', 'EAST_TX', 'WEST_TX'];

    regionOrder.forEach(r => {
      const regionConfig = REGIONS[r];
      const regionLocations = locations.filter(l => regionConfig.slugs?.includes(l.slug));
      if (regionLocations.length > 0) {
        groups.push({ region: r, locations: regionLocations });
      }
    });

    return groups;
  }, [locations, filteredLocations, region]);

  return (
    <>
      {/* Full-width Map */}
      <div className={styles.mapWrapper}>
        <LocationsMap locations={locations} minimal userCoords={userCoords} nearestCoords={nearestCoords} />
      </div>

      {/* Region Tabs */}
      <nav className={styles.regionTabs} aria-label="Filter locations by region">
        <button
          onClick={handleFindNearest}
          disabled={isLocating}
          className={styles.geoButton}
          aria-label="Find nearest location"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
          </svg>
          {isLocating ? 'Finding...' : 'Near Me'}
        </button>
        <span className={styles.tabDivider} />
        {(Object.keys(REGIONS) as RegionKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setRegion(key)}
            className={`${styles.regionTab} ${region === key ? styles.regionTabActive : ''}`}
            aria-pressed={region === key}
          >
            {REGIONS[key].label}
          </button>
        ))}
      </nav>

      {/* Nearest Location Banner */}
      {nearestLocation && (
        <div className={styles.nearestBanner}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
          </svg>
          <span>The location closest to you is <strong>{getDisplayName(nearestLocation.name)}</strong></span>
          <button
            onClick={() => setNearestSlug(null)}
            className={styles.nearestBannerClose}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Locations List - Dense Format */}
      <div className={styles.locationsContainer}>
        {/* Show nearest location first if set */}
        {nearestLocation && (
          <section className={styles.regionSection}>
            <h2 className={styles.regionTitle}>Nearest to You</h2>
            <ul className={styles.locationsList}>
              {(() => {
                const isOpen = isLocationOpen(nearestLocation.hours);
                const displayHours = getDisplayHours(nearestLocation.hours);
                return (
                  <li className={`${styles.locationItem} ${styles.locationItemNearest}`}>
                    <div className={styles.locationHeader}>
                      <span className={styles.locationName}>
                        {getDisplayName(nearestLocation.name)}
                      </span>
                      {isOpen !== null && (
                        <span className={`${styles.statusBadge} ${isOpen ? styles.statusOpen : styles.statusClosed}`}>
                          {isOpen ? 'Open' : 'Closed'}
                        </span>
                      )}
                    </div>
                    <div className={styles.locationMeta}>
                      <a href={getAppleMapsUrl(nearestLocation)} target="_blank" rel="noopener noreferrer" className={styles.addressLink}>
                        {nearestLocation.addressLine1}, {nearestLocation.city}
                      </a>
                      {nearestLocation.phone && (
                        <>
                          <span className={styles.metaDivider}>·</span>
                          <a href={`tel:${nearestLocation.phone}`} className={styles.phoneLink}>
                            {formatPhone(nearestLocation.phone)}
                          </a>
                        </>
                      )}
                    </div>
                    {displayHours && (
                      <div className={styles.locationHours}>
                        <span className={styles.hoursLabel}>Hours:</span>
                        <span className={styles.hoursText}>
                          {displayHours.weekday === displayHours.weekend ? (
                            displayHours.weekday
                          ) : (
                            <>
                              <span>Sun-Thu {displayHours.weekday}</span>
                              <span className={styles.hoursDivider}>·</span>
                              <span>Fri-Sat {displayHours.weekend}</span>
                            </>
                          )}
                        </span>
                      </div>
                    )}
                    <div className={styles.locationActions}>
                      {nearestLocation.revelUrl && (
                        <a href={nearestLocation.revelUrl} target="_blank" rel="noopener noreferrer" className={styles.actionPrimary}>Order</a>
                      )}
                      {nearestLocation.doordashUrl && (
                        <a href={nearestLocation.doordashUrl} target="_blank" rel="noopener noreferrer" className={styles.actionSecondary}>DoorDash</a>
                      )}
                      {nearestLocation.uberEatsUrl && (
                        <a href={nearestLocation.uberEatsUrl} target="_blank" rel="noopener noreferrer" className={styles.actionSecondary}>Uber Eats</a>
                      )}
                    </div>
                  </li>
                );
              })()}
            </ul>
          </section>
        )}

        {groupedLocations.map(({ region: groupRegion, locations: groupLocations }) => (
          <section key={groupRegion} className={styles.regionSection}>
            {region === 'ALL' && (
              <h2 className={styles.regionTitle}>{REGIONS[groupRegion].label}</h2>
            )}
            <ul className={styles.locationsList}>
              {groupLocations.filter(l => l.slug !== nearestSlug).map((location) => {
                const isOpen = isLocationOpen(location.hours);
                const displayHours = getDisplayHours(location.hours);

                return (
                  <li key={location.slug} className={styles.locationItem}>
                    <div className={styles.locationHeader}>
                      <span className={styles.locationName}>
                        {getDisplayName(location.name)}
                      </span>
                      {isOpen !== null && (
                        <span className={`${styles.statusBadge} ${isOpen ? styles.statusOpen : styles.statusClosed}`}>
                          {isOpen ? 'Open' : 'Closed'}
                        </span>
                      )}
                    </div>

                    <div className={styles.locationMeta}>
                      <a
                        href={getAppleMapsUrl(location)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.addressLink}
                      >
                        {location.addressLine1}, {location.city}
                      </a>
                      {location.phone && (
                        <>
                          <span className={styles.metaDivider}>·</span>
                          <a href={`tel:${location.phone}`} className={styles.phoneLink}>
                            {formatPhone(location.phone)}
                          </a>
                        </>
                      )}
                    </div>

                    {displayHours && (
                      <div className={styles.locationHours}>
                        <span className={styles.hoursLabel}>Hours:</span>
                        <span className={styles.hoursText}>
                          {displayHours.weekday === displayHours.weekend ? (
                            displayHours.weekday
                          ) : (
                            <>
                              <span>Sun-Thu {displayHours.weekday}</span>
                              <span className={styles.hoursDivider}>·</span>
                              <span>Fri-Sat {displayHours.weekend}</span>
                            </>
                          )}
                        </span>
                      </div>
                    )}

                    <div className={styles.locationActions}>
                      {location.revelUrl && (
                        <a href={location.revelUrl} target="_blank" rel="noopener noreferrer" className={styles.actionPrimary}>
                          Order
                        </a>
                      )}
                      {location.doordashUrl && (
                        <a href={location.doordashUrl} target="_blank" rel="noopener noreferrer" className={styles.actionSecondary}>
                          DoorDash
                        </a>
                      )}
                      {location.uberEatsUrl && (
                        <a href={location.uberEatsUrl} target="_blank" rel="noopener noreferrer" className={styles.actionSecondary}>
                          Uber Eats
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
