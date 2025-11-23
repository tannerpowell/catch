'use client';

import dynamic from 'next/dynamic';
import LocationsList from './LocationsList';
import styles from './LocationsContent.module.css';

const LocationsMap = dynamic(() => import('./LocationsMap'), {
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

interface LocationsContentProps {
  locations: Location[];
}

export default function LocationsContent({ locations }: LocationsContentProps) {
  return (
    <div className={styles.contentWrapper}>
      {/* Map on Left */}
      <div className={styles.mapColumn}>
        <LocationsMap locations={locations} />
      </div>

      {/* Locations List on Right */}
      <LocationsList locations={locations} />
    </div>
  );
}
