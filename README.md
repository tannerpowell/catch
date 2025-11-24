# The Catch — Next.js + Sanity Starter

## What you get
- Next.js (app dir) + Tailwind
- Sanity embedded Studio at `/studio`
- Zod-validated adapter that normalizes data for pages/components
- Per-location menu pricing/availability

## 1) Setup Sanity (once)
1. Create a Sanity project at https://www.sanity.io/manage (or `npm i -g sanity && sanity init`).
2. Note your **projectId** and **dataset** (e.g., `production`).

## 2) Configure env
Create `.env.local` in the repo root:
```
BRAND=cms-catch
NEXT_PUBLIC_SANITY_PROJECT_ID=yourProjectId
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SITE_URL=http://localhost:3000
REVALIDATE_SECRET=devsecret
```

## 3) Install & run
```bash
npm install
npm run dev
# visit http://localhost:3000 (site) and http://localhost:3000/studio (CMS)
```

## 4) Create base content in Studio
- **Locations**: add the 4 starting locations (name, slug, address, phone, hours).
- **Menu Categories**: add in the order you want (e.g., Popular, Starters, Baskets, Combos, ...). Set `position` integers.
- **Menu Items**: assign a category and set `basePrice`. For per-location changes, add rows in **Per-location Overrides** (pick a location, set `price` and/or `available`).

## 5) See it live
- `/menu` renders categories + items.
- `/locations` lists locations; `/locations/[slug]` shows detail.
- Data will update instantly in dev. For prod, use Sanity webhooks → `/api/revalidate?secret=REVALIDATE_SECRET` to re-build/ISR.

## Optional: Deploy

### Vercel Deployment
Vercel works out-of-the-box with this configuration:

1. **Add environment variables** in Vercel project settings:
   - `NEXT_PUBLIC_SANITY_PROJECT_ID`
   - `NEXT_PUBLIC_SANITY_DATASET`
   - `REVALIDATE_SECRET`
   - All other vars from `.env.local`

2. **Point Sanity webhook** to your deploy's `/api/revalidate?secret=...`

3. **Branch Configuration**:
   - Production deploys from `main` branch
   - Feature branches create preview deployments

4. **Important**: The project requires `--legacy-peer-deps` flag for npm install
   - `vercel.json` is already configured with: `"installCommand": "npm install --legacy-peer-deps"`
   - This is needed due to peer dependency conflicts between Next.js 16 and next-sanity@11.4.2
   - These are soft conflicts - packages work fine despite version mismatches

## Notes
- Keep using the **adapter** as the only place you shape data coming from Sanity.
- You can later add JSON-LD, search/filters, and design tokens without changing the adapter API.


## (Optional) Image URLs — fast path

Because the public menu uses dynamic rendering, direct image URLs aren’t in the static HTML. Two easy options:

### A) Quick scrape (Playwright)
```bash
npm i -D playwright ts-node @types/node
npx playwright install
# scrape from the global menu (or set CATCH_MENU_URL to a specific location menu)
npx ts-node scripts/scrape-images.ts > scraped-images.json
# Manually map names→URLs (or build a small helper), then:
# Create image-map.json: { "captains-combo": "https://..." , ... }
export SANITY_WRITE_TOKEN=yourSanityToken
npx ts-node scripts/patch-images.ts image-map.json
```

### B) Manual attach in Studio
Open each Menu Item in `/studio` and upload an image or paste an external URL if you added a custom `externalUrl` field to the schema.



## Design tokens (fonts/colors) — tweak here
- Tokens live in `lib/tokens.ts` and Tailwind is wired to CSS variables via `app/layout.tsx` using Google fonts:
  - Display: **Playfair Display** (serif headlines)
  - Body: **Inter**
- Change the font families or hex colors in `lib/tokens.ts` to adjust globally.

## JSON-LD
Already included:
- `components/jsonld.tsx` with `LocationJsonLd` and `MenuJsonLd`.
- Imported in `/menu` and `/locations/[slug]` pages.

## Image fuzzy matcher
After you run the scraper:
```bash
# Build an image slug→URL map automatically
npx ts-node scripts/build-image-map.ts scraped-images.json sanity-seed.ndjson > image-map.json

# Then patch Sanity with the generated map
export SANITY_WRITE_TOKEN=your-sanity-token
npx ts-node scripts/patch-images.ts image-map.json
```
