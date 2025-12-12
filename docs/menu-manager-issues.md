# Menu Manager Issues Summary

## What Happened
- The custom Menu Manager tool in Studio showed blank Location Pricing/Advanced tabs and sometimes crashed with Sanity context/version errors.
- Multiple Sanity versions were present: root `sanity@4.19.0`, stray `studio/node_modules` with `sanity@4.18.0` and later `4.20.3`, causing duplicate-context runtime errors.
- Additional runtime warnings/errors:
  - Non-boolean `wrap` prop on Inline.
  - TypeError reading `value` on the category select.
  - Location fetch failures leading to blank tabs (no inline error shown initially).
  - WebSocket connection to Sanity sometimes blocked (network), making tabs appear empty.

## What Was Changed
- Upgraded manifests to target `sanity@4.20.3` + `@sanity/vision@4.20.3` (root and `/studio`).
- Added a root override for `date-fns@2.30.0` to match Sanity’s expected API.
- Removed `studio/node_modules` to avoid duplicate Sanity runtimes; Studio now uses root deps.
- Fixed UI/logic bugs:
  - `Inline wrap` replaced with `flexWrap` style.
  - Category select guards null value to prevent TypeError.
  - Added field-level labels in Basics/Advanced.
  - Added controlled tabs.
  - Added inline error states for item fetch and location fetch (shows error text instead of blank panels).

## Current State
- Env files present in `/studio`: `.env` and `.env.local` both set `NEXT_PUBLIC_SANITY_PROJECT_ID=cwo08xml` and `NEXT_PUBLIC_SANITY_DATASET=production`.
- No `studio/node_modules` (removed).
- Menu Manager tabs render labels; if Sanity fetch fails (e.g., blocked websocket), the tab should show an error message instead of staying blank.
- “revel” tag in the list comes from the `source` field on menu items (Sanity data), not descriptions.

## Remaining Issues / Next Steps
- Network: WebSocket to `cwo08xml.api.sanity.io` sometimes blocked in this environment; tabs may appear empty if fetch/subscription fails. With inline error, you should see the message; if not, check the console/network.
- Install deps: run `npm install` at repo root to pull `sanity@4.20.3`, `@sanity/vision@4.20.3`, and `date-fns@2.30.0`. Do **not** reinstall under `/studio` to avoid reintroducing a duplicate runtime.
- Optional cleanup: keep only `/studio/.env.local` (remove duplicate `.env`) if you want a single source of truth.
- Image updater: not yet integrated; can add an image upload/select panel to patch `image`/`imageUrl` in the Menu Manager if desired.
