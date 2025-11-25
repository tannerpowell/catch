# Location-Based Menu Feature Plan

## Current Behavior
- `/menu` and `/menu2` default to **Denton** location on page load
- User must manually select their location from dropdown
- Geolocation is implemented in `LocationsMap.tsx` for the `/locations` page

## Desired Behavior
1. **Request user's geolocation** on page load
2. **If permission granted**: Calculate nearest location and auto-select it
3. **If permission denied/unavailable**: Fall back to Denton (current default)

## Location Coordinates

All 16 locations have geo coordinates stored in two places:
1. **Sanity CMS** - `geo` field (geopoint type)
2. **Fallback** - `lib/adapters/sanity-catch.ts` (`fallbackGeoCoordinates`)
3. **Map Display** - `components/catch/LocationsMap.tsx` (`locationCoords`)

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

## Implementation Steps

### 1. Add Geolocation Hook
Create `lib/hooks/useGeolocation.ts`:
- Request `navigator.geolocation.getCurrentPosition()`
- Return `{ latitude, longitude, loading, error }`
- Handle permission denied gracefully

### 2. Add Distance Calculator
Create `lib/utils/distance.ts`:
- Implement Haversine formula to calculate distance between two lat/lng points
- Function signature: `getDistance(lat1, lng1, lat2, lng2): number` (returns km)

### 3. Find Nearest Location
Create `lib/utils/findNearestLocation.ts`:
- Input: user's lat/lng, array of Location objects
- Output: Location slug of nearest location
- Iterate through locations, calculate distances, return closest

### 4. Update Menu Components
Modify `components/catch/Menu2PageClient.tsx`:
- Import `useGeolocation` hook
- Import `findNearestLocation` utility
- On mount:
  ```tsx
  const { latitude, longitude, loading } = useGeolocation();

  useEffect(() => {
    if (latitude && longitude && locations.length > 0) {
      const nearestSlug = findNearestLocation(latitude, longitude, locations);
      setSelectedSlug(nearestSlug);
    }
  }, [latitude, longitude, locations]);
  ```
- Keep Denton as initial default in `useState` (fallback)

### 5. Update Menu1 (if needed)
Apply same pattern to `/menu` page if it needs location detection

## Technical Notes
- **Permissions**: Browser will prompt user for location access
- **Privacy**: Only calculate distance, don't store coordinates
- **Performance**: Geolocation happens async, page loads immediately with Denton default
- **UX**: User sees Denton briefly, then auto-switches to nearest location (if permission granted)
- **Edge cases**: Handle errors silently (just stay on Denton default)

## Files to Modify
- `lib/hooks/useGeolocation.ts` (new)
- `lib/utils/distance.ts` (new)
- `lib/utils/findNearestLocation.ts` (new)
- `components/catch/Menu2PageClient.tsx` (modify)
- `app/menu/page.tsx` or menu client component (modify if needed)

## Testing
1. Grant location permission → Should select nearest location
2. Deny location permission → Should stay on Denton
3. Browser without geolocation API → Should stay on Denton
4. Multiple locations → Verify correct distance calculations

## Future Enhancements
- Save user's preferred location to localStorage (override geolocation)
- Show "We detected you're near [Location]. Switch to it?" toast
- Add manual override button: "Use my location" in location dropdown
