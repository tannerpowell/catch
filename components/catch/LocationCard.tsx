import Link from "next/link";
import type { Location } from "@/lib/types";

export default function LocationCard({ location }: { location: Location }) {
  return (
    <article className="catch-location-item">
      <h3 className="catch-location-name">{location.name}</h3>
      <p className="catch-location-meta">
        {location.addressLine1}
        {location.city && `, ${location.city}, ${location.state} ${location.postalCode}`}
      </p>
      {location.phone && (
        <p className="catch-location-meta">
          <a href={`tel:${location.phone}`} style={{ textDecoration: "underline" }}>
            {location.phone}
          </a>
        </p>
      )}

      <div className="catch-location-actions">
        {location.directionsUrl && (
          <a className="catch-action-link" href={location.directionsUrl} target="_blank" rel="noopener noreferrer">
            Directions
          </a>
        )}
        <Link className="catch-action-link" href={`/locations/${location.slug}`}>
          Details
        </Link>
      </div>

      <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
        {location.revelUrl && (
          <a className="catch-ordering-pill" href={location.revelUrl} target="_blank" rel="noopener noreferrer">
            Order (Revel)
          </a>
        )}
        {location.doordashUrl && (
          <a className="catch-ordering-pill" href={location.doordashUrl} target="_blank" rel="noopener noreferrer">
            DoorDash
          </a>
        )}
        {location.uberEatsUrl && (
          <a className="catch-ordering-pill" href={location.uberEatsUrl} target="_blank" rel="noopener noreferrer">
            Uber Eats
          </a>
        )}
      </div>
    </article>
  );
}
