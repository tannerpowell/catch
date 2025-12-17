'use client';

import { useState } from 'react';
import styles from './LocationsList.module.css';
import { formatPhone } from '@/lib/utils/formatPhone';

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

interface LocationsListProps {
  locations: Location[];
}

function formatHours(hoursString: string): string {
  const timeRegex = /(\d{1,2}):?(\d{2})?\s*(AM|PM|am|pm)/gi;

  return hoursString
    .replace(timeRegex, (match, hour, minute, period) => {
      const h = parseInt(hour);
      const m = minute ? `:${minute}` : '';
      const p = period.toLowerCase() === 'am' ? 'a.m.' : 'p.m.';

      if (!minute || minute === '00') {
        return `${h} ${p}`;
      }
      return `${h}${m} ${p}`;
    })
    .replace(/\s*-\s*/g, ' – ');
}

function getAppleMapsUrl(location: Location): string {
  const address = [
    location.addressLine1,
    location.city,
    location.state,
    location.postalCode
  ].filter(Boolean).join(', ');
  return `https://maps.apple.com/?address=${encodeURIComponent(address)}`;
}

export default function LocationsList({
  locations
}: LocationsListProps) {
  const [region, setRegion] = useState<'ALL' | 'DALLAS' | 'HOUSTON'>('ALL');

  // Define which cities belong to each metro
  const dallasMetro = ['Dallas', 'Denton', 'Garland'];
  const houstonMetro = ['Houston', 'Humble', 'Conroe'];

  const filteredLocations = locations.filter(location => {
    if (region === 'ALL') return true;
    if (region === 'DALLAS') return dallasMetro.includes(location.city);
    if (region === 'HOUSTON') return houstonMetro.includes(location.city);
    return true;
  });

  return (
    <div className={styles.wrapper}>
      <div className={styles.toggle}>
        <button
          onClick={() => setRegion('DALLAS')}
          className={region === 'DALLAS' ? styles.active : ''}
        >
          Dallas
        </button>
        <span className={styles.divider}>|</span>
        <button
          onClick={() => setRegion('HOUSTON')}
          className={region === 'HOUSTON' ? styles.active : ''}
        >
          Houston
        </button>
        {region !== 'ALL' && (
          <>
            <span className={styles.divider}>|</span>
            <button
              onClick={() => setRegion('ALL')}
              className={styles.clearButton}
            >
              Show All
            </button>
          </>
        )}
      </div>

      <div className={styles.locationsList}>
        {filteredLocations.map((location) => {
          const appleMapsUrl = getAppleMapsUrl(location);

          return (
            <div key={location.slug} className={styles.locationItem}>
              <h2 className={styles.locationName}>{location.name}</h2>

              <div className={styles.locationDetails}>
                <a
                  href={appleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.locationLink}
                >
                  {location.addressLine1}
                  {location.addressLine2 && <><br />{location.addressLine2}</>}
                  <br />
                  {location.city}, {location.state} {location.postalCode}
                </a>
              </div>

              {location.phone && (
                <div className={styles.locationDetails}>
                  <a
                    href={`tel:${location.phone}`}
                    className={styles.phoneLink}
                  >
                    {formatPhone(location.phone)}
                  </a>
                </div>
              )}

              {location.hours && (
                <div className={styles.locationDetails}>
                  {typeof location.hours === 'object' ? (
                    <>
                      {location.hours.sunday && (
                        <div>Sun–Thu: {formatHours(location.hours.sunday)}</div>
                      )}
                      {location.hours.friday && (
                        <div>Fri–Sat: {formatHours(location.hours.friday)}</div>
                      )}
                    </>
                  ) : (
                    <div>{formatHours(location.hours)}</div>
                  )}
                </div>
              )}

              <div className={styles.locationLinks}>
                {location.revelUrl && (
                  <a href={location.revelUrl} target="_blank" rel="noopener noreferrer" className={styles.orderLink}>
                    Order
                  </a>
                )}
                {location.doordashUrl && (
                  <a href={location.doordashUrl} target="_blank" rel="noopener noreferrer" className={styles.orderLink}>
                    DoorDash
                  </a>
                )}
                {location.uberEatsUrl && (
                  <a href={location.uberEatsUrl} target="_blank" rel="noopener noreferrer" className={styles.orderLink}>
                    Uber Eats
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
