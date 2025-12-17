'use client';

import dynamic from 'next/dynamic';
import LocationsListLegacy from './LocationsListLegacy';
import styles from './LocationsContentLegacy.module.css';

const LocationsMapLegacy = dynamic(() => import('./LocationsMapLegacy'), {
  ssr: false,
  loading: () => <div style={{ height: '600px', background: '#f5f5f5', borderRadius: '12px' }} />
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

interface LocationsContentLegacyProps {
  locations: Location[];
}

export default function LocationsContentLegacy({ locations }: LocationsContentLegacyProps) {
  return (
    <div className={styles.contentWrapper}>
      {/* Map on Left */}
      <div className={styles.mapColumn}>
        <LocationsMapLegacy locations={locations} />
      </div>

      {/* Locations List on Right */}
      <LocationsListLegacy locations={locations} />
    </div>
  );
}
