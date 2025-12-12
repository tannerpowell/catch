# Sanity access & soft isolation

## Where editors log in
- Studio runs at `/studio` in this Next app (locally `npm run dev` → http://localhost:3000/studio). On Vercel, append `/studio` to the deploy URL.
- Sanity uses email-based login (magic link). Invite editors from https://manage.sanity.io/ → Project → Members. No password reset flow to build; they request a new magic link if needed.

## Soft isolation by location
- The Studio desk now groups menu content by location. Editors can pick a location under “Menu by Location” to see only items that reference that location in `locationOverrides`. Categories are shared.
- Deleting/duplicating menu items and categories is disabled to reduce accidents. Editing/publishing remains available.
- This is soft isolation (UI-level). To truly restrict data access, use separate datasets and tokens per property.

## Roles (recommended)
- Create a “Property Editor” role in Sanity with `read/create/update` on `menuItem` and `menuCategory` (no delete, no deploy/schema). Assign it to non-technical users.
- Keep an “Admin” role for yourself for full access (locations, orders, schemas).
- Example role payload (create in Sanity UI or CLI):
  - Title: `Property Editor`
  - ID: `property-editor`
  - Grants:
    - `read/create/update` on `menuItem`
    - `read/create/update` on `menuCategory`
    - (optional) `read` on `location`
  - Deny: delete, deploy, manage schemas/datasets/tokens
  - New: a custom “Menu Manager” tool is available at `/studio/menu-manager` for faster editing.

## Make changes go live automatically
1) Set `SANITY_WEBHOOK_SECRET` in your Next/Vercel env.
2) In Sanity: Project Settings → API → Webhooks → “Add webhook”.
   - URL: `https://<your-site>/api/sanity-webhook?secret=THE_SAME_SECRET`
   - Trigger on publish/update for `menuItem`, `menuCategory`, `location`.
3) Publishing in Studio will trigger ISR revalidation for `/menu`, `/menu2`, and `/locations`.

## Onboarding checklist
- Invite editors (emails) in Sanity.
- Confirm they can open `/studio` and see the “Menu by Location” lists.
- Fill `locationOverrides` on menu items so the location filters work for each property.
- (Optional) Set up the webhook so they don’t have to redeploy after edits.
