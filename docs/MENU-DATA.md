# Menu Data Guide

This document explains where menu data lives, how it gets there, how to make edits, and how changes appear on the website and TV displays.

---

## Where Does the Menu Data Live?

All menu data lives in **Sanity** — a cloud-based content management system (CMS). Think of Sanity as the single source of truth for everything on the menu: item names, descriptions, prices, categories, and which items appear at which locations.

**Sanity Dashboard:** https://thecatch.sanity.studio/

---

## How Data Gets Into Sanity

There are two ways menu data enters Sanity:

### 1. Manual Entry
Staff can add or edit menu items directly in the Sanity dashboard:
1. Log in to Sanity Studio
2. Navigate to **Menu Items** in the sidebar
3. Click an item to edit, or click **+ Create** to add a new one
4. Fill in the fields (name, description, price, category, etc.)
5. Click **Publish** to make changes live

### 2. Bulk Import (Technical)
For large-scale data migrations (like importing from Revel or another system), developers can run import scripts that push data directly to Sanity via its API. These scripts are located in the `/scripts` folder.

---

## Making Edits

### Editing a Single Item
1. Go to https://thecatch.sanity.studio/
2. Find the item under **Menu Items**
3. Make your changes
4. Click **Publish**

### Location-Specific Settings
Each menu item can have **location overrides** — settings that apply only to specific locations:

- **Price Override:** Set a different price for a specific location
- **Availability:** Hide an item at a specific location by setting `available: false`

To configure location overrides:
1. Open a menu item in Sanity
2. Scroll to the **Location Overrides** section
3. Add an override for the location you want to customize
4. Set the price and/or availability
5. Publish

### Bulk Formatting Corrections
A script exists to automatically fix common formatting issues across all menu items:

**What it fixes:**
- Spelling corrections (e.g., "Etouffee" → "Étouffée", "Monterrey" → "Monterey")
- Quantity formatting (e.g., "8 Catfish" → "Catfish (8)")
- Capitalization (e.g., "jumbo shrimp" → "Jumbo Shrimp")
- Measurement formatting (e.g., "1 Pound" → "1lb")
- Removes trailing periods from descriptions
- Fixes markdown formatting artifacts

**To preview changes (dry run):**
```bash
npx tsx scripts/menu-formatting-rules.ts --dry-run
```

**To apply changes:**
```bash
npx tsx scripts/menu-formatting-rules.ts
```

**To see all changes (not just first 20):**
```bash
npx tsx scripts/menu-formatting-rules.ts --dry-run --verbose
```

---

## How Changes Appear on the Website

### Update Frequency

| Where | How Often Updates Appear |
|-------|-------------------------|
| Main website (`/menu`, `/menu2`) | Within **1 hour** of publishing |
| TV Menu Display (`/menu-display`) | Within **5 minutes** of publishing |
| TV displays also auto-refresh | Every **5 minutes** on their own |

### Technical Details (for developers)

The website uses **Incremental Static Regeneration (ISR)**:
- Pages are pre-built for fast loading
- After a set time (revalidation period), the next visitor triggers a rebuild
- The rebuild fetches fresh data from Sanity

Revalidation periods:
- `/menu` and `/menu2`: 1 hour (`revalidate = 3600`)
- `/menu-display/[location]`: 5 minutes (`revalidate = 300`)

You can also trigger an immediate refresh by calling:
```
POST /api/revalidate?path=/menu
```

---

## TV Menu Display

The TV menu display (`/menu-display/[location]`) is designed for in-store flatscreen TVs.

### Features
- Optimized for ~100 menu items across 2 screens
- Auto-rotates between pages every 12 seconds
- Auto-refreshes data every 5 minutes
- Location-specific: each TV shows only items available at that location

### URL Format
```
https://yoursite.com/menu-display/arlington
https://yoursite.com/menu-display/denton
https://yoursite.com/menu-display/conroe
```

### Setup Instructions
See `/menu-display` for the setup guide (kiosk mode configuration for Mac Minis).

---

## Current Item Counts

To check how many items each location is showing:

```bash
npx tsx scripts/check-locations.ts
```

As of the last check, all locations show **234 items** because no location-specific availability has been configured yet. Once items are marked as unavailable at specific locations, each location will show its unique menu.

---

## Data Structure (for developers)

### Menu Item Fields
| Field | Description |
|-------|-------------|
| `name` | Display name of the item |
| `description` | Optional description text |
| `basePrice` | Default price (can be overridden per location) |
| `category` | Reference to a menu category |
| `badges` | Tags like "Spicy", "Gluten-Free", etc. |
| `image` | Optional item photo |
| `locationOverrides` | Array of location-specific price/availability settings |

### Location Override Fields
| Field | Description |
|-------|-------------|
| `location` | Reference to a location |
| `price` | Override price for this location (optional) |
| `available` | `true` or `false` — whether item shows at this location |

### GROQ Query (how the website fetches items)
```groq
*[_type=="menuItem"]{
  _id,
  name,
  "slug": slug.current,
  description,
  "categorySlug": category->slug.current,
  "image": image.asset->url,
  badges,
  "basePrice": coalesce(basePrice, null),
  "overrides": coalesce(locationOverrides, [])[]{
    "loc": location->slug.current,
    price,
    available
  }
}
```

---

## Quick Reference

| Task | How To |
|------|--------|
| Edit an item | Sanity → Menu Items → Edit → Publish |
| Hide item at location | Sanity → Menu Items → Location Overrides → set `available: false` |
| Change price at location | Sanity → Menu Items → Location Overrides → set `price` |
| Fix spelling/formatting | Run `npx tsx scripts/menu-formatting-rules.ts` |
| Check item counts | Run `npx tsx scripts/check-locations.ts` |
| Force website refresh | `POST /api/revalidate?path=/menu` |
