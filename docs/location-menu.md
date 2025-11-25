# Location-Based Menu Feature

## Current Implementation

### Locations Page (`/locations`)
- **"Find Nearest Location" button** triggers on-demand geolocation
- Uses Haversine formula to calculate distance to each location
- Flies map to user location and highlights nearest restaurant
- Implemented in `components/catch/LocationsMap.tsx`

### Menu Pages (`/menu` and `/menu2`)
- Default to **Denton** location on page load
- User manually selects their location from dropdown
- **Future enhancement**: Auto-detect nearest location (see below)

## Location Coordinates

All 16 locations have geo coordinates stored in:

1. **Sanity CMS** - `geo` field (geopoint type)
2. **Fallback** - `lib/adapters/sanity-catch.ts` (`fallbackGeoCoordinates`)
3. **Map Display** - Derived from fallbackGeoCoordinates in `LocationsMap.tsx`

### Oklahoma Locations

| Slug | Latitude | Longitude |
|------|----------|-----------|
| `okc-memorial` | 35.610210 | -97.550766 |
| `midwest-city` | 35.440914 | -97.405760 |
| `moore` | 35.327000 | -97.491210 |

### Texas Locations

| Slug | Latitude | Longitude |
|------|----------|-----------|
| `arlington` | 32.675407 | -97.196220 |
| `atascocita` | 29.993227 | -95.177946 |
| `burleson` | 32.519184 | -97.348927 |
| `coit-campbell` | 32.977688 | -96.770851 |
| `conroe` | 30.317270 | -95.478130 |
| `denton` | 33.229110 | -97.150930 |
| `garland` | 32.949788 | -96.651562 |
| `longview` | 32.521200 | -94.747800 |
| `lubbock` | 33.519250 | -101.921089 |
| `s-post-oak` | 29.672800 | -95.460240 |
| `tyler` | 32.331307 | -95.289808 |
| `wichita-falls` | 33.880000 | -98.520000 |
| `willowbrook` | 29.963846 | -95.543372 |

## Scripts

### Seed Geo Coordinates
```bash
npx tsx scripts/seed-geo-coordinates.ts
```
Updates existing Sanity locations with geo coordinates from `fallbackGeoCoordinates`.

### Add New Locations
```bash
npx tsx scripts/add-new-locations.ts
```
Creates new location documents in Sanity with address, phone, hours, and geo data.

## Future Enhancement: Auto-Detect on Menu Pages

### Desired Behavior
1. Request user's geolocation on `/menu` or `/menu2` page load
2. If permission granted: Auto-select nearest location
3. If denied/unavailable: Fall back to Denton default

### Implementation Plan

**1. Create Geolocation Hook** (`lib/hooks/useGeolocation.ts`):
- Request `navigator.geolocation.getCurrentPosition()`
- Return `{ latitude, longitude, loading, error }`

**2. Create Distance Utility** (`lib/utils/findNearestLocation.ts`):
- Use Haversine formula (already in LocationsMap.tsx)
- Input: user coords + locations array
- Output: nearest location slug

**3. Update Menu Components**:
```tsx
const { latitude, longitude } = useGeolocation();

useEffect(() => {
  if (latitude && longitude && locations.length > 0) {
    const nearestSlug = findNearestLocation(latitude, longitude, locations);
    setSelectedSlug(nearestSlug);
  }
}, [latitude, longitude, locations]);
```

### Technical Notes
- **Privacy**: Only calculate distance, don't store user coordinates
- **Performance**: Async geolocation, page loads immediately with default
- **UX**: Brief flash of default location before auto-switch
- **Edge cases**: Silent fallback to Denton on any error
