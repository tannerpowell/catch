# Sanity CMS Configuration

## Project Details

- **Project ID:** `cwo08xml`
- **Dataset:** `production`
- **API Version:** `2025-01-01`
- **Studio:** Embedded at `/studio` (uses `sanity.config.ts`)

## Environment Variables

```bash
# Required
NEXT_PUBLIC_SANITY_PROJECT_ID=cwo08xml
NEXT_PUBLIC_SANITY_DATASET=production

# Optional - for asset uploads and mutations
SANITY_WRITE_TOKEN=<token-with-create-permissions>
```

## Image Handling

### Current Approach: Local Compressed JPEGs

We serve images from `/public/images/jpeg/` rather than Sanity's CDN. This avoids CDN costs while still providing good performance:

- **Original PNGs:** ~110MB (44 images, AI-enhanced)
- **Compressed JPEGs:** ~12MB (89% reduction, 85% quality)
- **Served by:** Vercel edge network with automatic caching

Images are compressed using:
```bash
./scripts/compress-images.sh
```

### Future Option: Sanity CDN

Sanity's CDN provides automatic WebP conversion and responsive sizing. To enable:

1. **Get a write token** with "Create" permissions from [manage.sanity.io](https://manage.sanity.io)
2. **Add to `.env.local`:**
   ```bash
   SANITY_WRITE_TOKEN=sk...
   ```
3. **Run the upload script:**
   ```bash
   npx tsx scripts/upload-images-to-sanity.ts
   ```
4. **Update `lib/utils/imageMap.ts`** to use Sanity CDN URLs

The upload script outputs a mapping file at `scripts/sanity-image-mapping.json`.

### Ignored Directories

Large image directories are gitignored to keep the repo small:

```
public/images/compare/after/   # Large PNGs (~110MB)
public/images/dfw/             # Duplicate originals
```

## Caching & Performance

### Server-Side Caching

Sanity data is cached using Next.js `unstable_cache` with these tags:

| Tag | Content |
|-----|---------|
| `sanity-categories` | Menu categories |
| `sanity-locations` | Restaurant locations |
| `sanity-items` | Menu items |
| `sanity-content` | All Sanity content (parent tag) |

Cache revalidates every 60 seconds, or immediately via webhook.

### Circuit Breaker

External calls to Sanity are protected by a circuit breaker (`lib/utils/circuit-breaker.ts`):

- **Failure threshold:** 3 failures
- **Reset timeout:** 30 seconds
- **Fallback:** Demo data when Sanity is unavailable

Check circuit status at `/api/health`.

## Webhook Configuration

The webhook endpoint at `/api/sanity-webhook` handles cache invalidation:

### Revalidated Paths
- `/` (homepage)
- `/menu`, `/menu2`, `/menu3`
- `/tv-menu-display`
- `/print-menu`
- `/locations`

### Revalidated Tags
- `sanity-content` (invalidates all cached Sanity data)

### Sanity Webhook Setup

1. Go to [manage.sanity.io](https://manage.sanity.io) → Project → API → Webhooks
2. Create webhook:
   - **URL:** `https://your-domain.com/api/sanity-webhook`
   - **Trigger:** Create, Update, Delete
   - **Filter:** `_type in ["location", "category", "menuItem"]`
   - **Secret:** Set and add to `SANITY_WEBHOOK_SECRET` env var

## Health Check

`GET /api/health` returns:

```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "version": "abc1234",
  "checks": {
    "sanity": { "status": "up", "latencyMs": 45 }
  },
  "circuitBreakers": {
    "sanity-categories": { "state": "CLOSED", "failures": 0 },
    "sanity-locations": { "state": "CLOSED", "failures": 0 },
    "sanity-items": { "state": "CLOSED", "failures": 0 }
  }
}
```

## Key Files

| File | Purpose |
|------|---------|
| `lib/adapters/sanity-catch.ts` | Main Sanity client with caching |
| `lib/sanity/constants.ts` | Shared constants (API version, timeouts) |
| `lib/utils/circuit-breaker.ts` | Circuit breaker for resilience |
| `app/api/sanity-webhook/route.ts` | Cache invalidation webhook |
| `app/api/health/route.ts` | Health check endpoint |
| `sanity/` | Schema definitions |
| `studio/` | Embedded Sanity Studio |
| `scripts/upload-images-to-sanity.ts` | Image upload script |
| `scripts/compress-images.sh` | Image compression script |
