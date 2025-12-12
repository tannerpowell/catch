# Sanity User Guide (property editors)

## How to log in
- Go to the Studio at `/studio` (e.g., `https://<your-site>/studio`).
- Enter your email; Sanity sends a magic-link email. Click the link to sign in. No password required.

## What you can edit
- Menu Items: names, descriptions, prices, badges, images, and per-location overrides.
- Categories: titles/positions.
- Locations: view settings; editing is typically reserved for admins.
- Deleting/duplicating menu items and categories is disabled to prevent accidents.

## Where to click
- After login, you’ll see “Menu by Location.” Pick your location to see only your items.
- Categories are shared across locations.
- Use the “All Menu Items/Categories” lists if you need to search everything.

## Making per-location changes
- Open a menu item → “Per‑location Overrides” → select your location and set price/availability.
- Publish to save. (Drafts are not live until published.)

## Going live
- Publishing triggers an automatic refresh of `/menu`, `/menu2`, and `/locations` if the webhook is configured.
- If you don’t see changes after publishing, wait ~1–2 minutes and refresh the site. If still missing, contact an admin.

## Safety notes
- Do not delete items/categories (action is disabled).
- Keep names and slugs clean; avoid emojis in slugs.
- Images: use high-quality photos; add alt text for accessibility.
- Validation errors appear in the right panel; resolve before publishing.

## Getting help
- If the magic link doesn’t arrive, check spam or request another. Editors are managed in the Sanity project members page by an admin.
- For new locations or structural changes, ask an admin rather than creating new schemas.
- Editors typically have the “Property Editor” role (read/create/update for menu items and categories, no delete). Admins handle roles, webhooks, and new locations.
- For a faster experience, use the “Menu Manager” tool in Studio (left sidebar) to filter by category, search, and edit items with a wider pane and per-location pricing tab.
