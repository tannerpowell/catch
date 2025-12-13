'use client';

import React from 'react';
import type { Location } from '@/lib/types';

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits[0] === '1') {
    const areaCode = digits.slice(1, 4);
    const prefix = digits.slice(4, 7);
    const lineNumber = digits.slice(7, 11);
    return `(${areaCode}) ${prefix}-${lineNumber}`;
  }
  if (digits.length === 10) {
    const areaCode = digits.slice(0, 3);
    const prefix = digits.slice(3, 6);
    const lineNumber = digits.slice(6, 10);
    return `(${areaCode}) ${prefix}-${lineNumber}`;
  }
  return phone;
}

interface LocationBarProps {
  locations: Location[];
  selectedSlug: string;
  onLocationChange: (slug: string) => void;
  onFindNearest: () => void;
  isLocating: boolean;
  geoError: string | null;
  isGeoDenied: boolean;
}

// Region groupings
const DFW_SLUGS = ['denton', 'coit-campbell', 'garland', 'arlington', 'burleson'];
const HOUSTON_SLUGS = ['conroe', 'humble', 's-post-oak', 'willowbrook', 'atascocita'];
const OKLAHOMA_SLUGS = ['okc-memorial', 'midwest-city', 'moore'];
const EAST_TEXAS_SLUGS = ['tyler', 'longview'];
const WEST_TEXAS_SLUGS = ['lubbock', 'wichita-falls'];

/**
 * Top strip location bar with Find Nearest CTA and location dropdown.
 * Designed to be thin and compact, fitting the premium 3-pane layout.
 */
export function LocationBar({
  locations,
  selectedSlug,
  onLocationChange,
  onFindNearest,
  isLocating,
  geoError,
  isGeoDenied,
}: LocationBarProps) {
  // Group locations by region
  const groupedLocations = React.useMemo(() => {
    const groups: { label: string; locations: Location[] }[] = [];

    const dfw = locations.filter(l => DFW_SLUGS.includes(l.slug));
    const houston = locations.filter(l => HOUSTON_SLUGS.includes(l.slug));
    const oklahoma = locations.filter(l => OKLAHOMA_SLUGS.includes(l.slug));
    const eastTexas = locations.filter(l => EAST_TEXAS_SLUGS.includes(l.slug));
    const westTexas = locations.filter(l => WEST_TEXAS_SLUGS.includes(l.slug));
    const other = locations.filter(l =>
      ![...DFW_SLUGS, ...HOUSTON_SLUGS, ...OKLAHOMA_SLUGS, ...EAST_TEXAS_SLUGS, ...WEST_TEXAS_SLUGS].includes(l.slug)
    );

    if (dfw.length) groups.push({ label: 'DFW', locations: dfw });
    if (houston.length) groups.push({ label: 'Houston', locations: houston });
    if (oklahoma.length) groups.push({ label: 'Oklahoma', locations: oklahoma });
    if (eastTexas.length) groups.push({ label: 'East Texas', locations: eastTexas });
    if (westTexas.length) groups.push({ label: 'West Texas', locations: westTexas });
    if (other.length) groups.push({ label: 'Other', locations: other });

    return groups;
  }, [locations]);

  const selectedLocation = locations.find(l => l.slug === selectedSlug);

  return (
    <div className="menu3-location-bar">
      {/* Find Nearest CTA - primary action */}
      <button
        type="button"
        onClick={onFindNearest}
        disabled={isLocating || isGeoDenied}
        className="menu3-find-nearest-btn"
        aria-label="Find nearest location"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
        </svg>
        <span>{isLocating ? 'Finding...' : 'Find Nearest'}</span>
      </button>

      {/* Location dropdown */}
      <div className="menu3-location-select-wrapper">
        <select
          value={selectedSlug}
          onChange={(e) => onLocationChange(e.target.value)}
          className="menu3-location-select menu3-type-location"
          aria-label="Select location"
        >
          {groupedLocations.map(group => (
            <optgroup key={group.label} label={group.label}>
              {group.locations.map(location => (
                <option key={location.slug} value={location.slug}>
                  {location.name.replace('The Catch — ', '').replace('The Catch - ', '')}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <svg
          className="menu3-location-select-arrow"
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          aria-hidden="true"
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Selected location details (desktop only) */}
      {selectedLocation && (
        <div className="menu3-location-details">
          <a
            href={`https://maps.apple.com/?address=${encodeURIComponent(
              `${selectedLocation.addressLine1}, ${selectedLocation.city}, ${selectedLocation.state} ${selectedLocation.postalCode}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="menu3-location-link"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>{selectedLocation.addressLine1}, {selectedLocation.city}, {selectedLocation.state}</span>
          </a>
          {selectedLocation.phone && (
            <>
              <span className="menu3-location-divider">•</span>
              <a
                href={`tel:${selectedLocation.phone}`}
                className="menu3-location-link"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span>{formatPhone(selectedLocation.phone)}</span>
              </a>
            </>
          )}
        </div>
      )}

      {/* Geo error message (inline, non-intrusive) */}
      {geoError && !isLocating && (
        <span className="menu3-geo-error" role="alert">
          {geoError}
        </span>
      )}

      <style jsx>{`
        .menu3-location-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 20px;
          background: var(--menu3-location-bar-bg, #1a1a1a);
          border-bottom: 1px solid var(--menu3-border, rgba(255, 255, 255, 0.08));
        }

        .menu3-find-nearest-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 4px;
          color: white;
          font-family: var(--font-menu-ui);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .menu3-find-nearest-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .menu3-find-nearest-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .menu3-location-select-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
        }

        .menu3-location-select {
          appearance: none;
          padding: 7px 28px 7px 12px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 4px;
          color: white;
          cursor: pointer;
          min-width: 140px;
          transition: all 0.2s ease;
        }

        .menu3-location-select:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.25);
        }

        .menu3-location-select:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.4);
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
        }

        .menu3-location-select option {
          background: #1a1a1a;
          color: white;
        }

        .menu3-location-select optgroup {
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
        }

        .menu3-location-select-arrow {
          position: absolute;
          right: 10px;
          pointer-events: none;
          color: rgba(255, 255, 255, 0.5);
        }

        .menu3-location-details {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-left: 8px;
        }

        .menu3-location-link {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-family: var(--font-menu-ui);
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          letter-spacing: 0.01em;
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .menu3-location-link:hover {
          color: rgba(255, 255, 255, 1);
        }

        .menu3-location-link svg {
          opacity: 0.6;
          flex-shrink: 0;
        }

        .menu3-location-link:hover svg {
          opacity: 1;
        }

        .menu3-location-divider {
          color: rgba(255, 255, 255, 0.3);
          font-size: 10px;
        }

        .menu3-geo-error {
          font-family: var(--font-menu-ui);
          font-size: 11px;
          color: #ff8a80;
          margin-left: auto;
        }

        /* Mobile adjustments */
        @media (max-width: 768px) {
          .menu3-location-bar {
            flex-wrap: wrap;
            gap: 8px;
            padding: 10px 16px;
          }

          .menu3-location-details {
            display: none;
          }

          .menu3-find-nearest-btn {
            padding: 8px 12px;
          }

          .menu3-geo-error {
            flex-basis: 100%;
            margin-left: 0;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
