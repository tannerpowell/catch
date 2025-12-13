# Menu Analysis Builder - Feature Plan

## Overview

Add an interactive "Menu Builder" mode to the Universal Menu tab that lets users construct a proposed universal menu by selecting items, then save/share that proposal for stakeholder review.

## Current State

The Menu Analysis page (`/categories-analysis`) currently:
- Displays live Sanity data (5-minute ISR cache)
- Shows 4 sections: Core, Recommended, Consider, Sunset
- Clicking an item opens a modal showing location availability
- Read-only — no way to build or save a custom proposal

## Proposed Feature

### 1. Selection State

Add component state to track selected items:

```typescript
const [proposedItems, setProposedItems] = useState<Set<string>>(new Set());
const [builderMode, setBuilderMode] = useState(false);
```

### 2. UI: Builder Toggle

Add a toggle button in the Universal Menu tab header:

```text
[View Mode] [Builder Mode]
```

When Builder Mode is active:
- Show checkboxes/toggles on each item card
- Display floating proposal panel
- Enable bulk action buttons

### 3. Bulk Actions

Quick-add buttons above each section:

| Button | Action |
|--------|--------|
| "Add All Core" | Select all core items |
| "Add All Recommended" | Select all recommended items |
| "Clear Selection" | Deselect all items |

Consider section gets per-category bulk actions:
- "Add All Appetizers"
- "Add All Entrees"
- etc.

### 4. Individual Item Selection

Each menu item card in Builder Mode gets:
- Checkbox or +/- toggle
- Visual indicator when selected (green border, checkmark overlay)
- Click anywhere on card to toggle selection

### 5. Proposal Panel

Floating/collapsible sidebar showing current proposal:

```text
┌─────────────────────────────┐
│ PROPOSED MENU          [×] │
├─────────────────────────────┤
│ 47 items selected           │
│                             │
│ APPETIZERS (8)              │
│   • Fried Calamari      [×] │
│   • Shrimp Cocktail     [×] │
│   • ...                     │
│                             │
│ ENTREES (24)                │
│   • Grilled Salmon      [×] │
│   • ...                     │
│                             │
│ ─────────────────────────── │
│ [Clear All]                 │
│ [Copy Link] [Export CSV]    │
└─────────────────────────────┘
```

Features:
- Grouped by category
- Individual remove buttons
- Scroll independently from main content
- Collapse/expand categories

### 6. Save/Share Options

#### Option A: URL Sharing (Recommended)

Encode selected item IDs in URL query params:

```bash
/categories-analysis?builder=1&items=abc123,def456,ghi789
```

Benefits:
- Shareable via Slack/email
- No backend required
- Anyone with link sees same proposal
- Bookmarkable

Implementation:
- Use `useSearchParams()` to read/write
- Compress item IDs if URL gets too long (use slugs or indices)
- "Copy Link" button copies to clipboard

#### Option B: LocalStorage Persistence

Auto-save proposals for returning users:

```typescript
// On selection change
localStorage.setItem('menuProposal', JSON.stringify({
  items: Array.from(proposedItems),
  savedAt: Date.now(),
  name: proposalName
}));
```

Benefits:
- Survives page refresh
- Multiple saved proposals
- No login required

#### Option C: Export Formats

"Export" dropdown with options:

| Format | Use Case |
|--------|----------|
| CSV | Import to spreadsheets |
| JSON | Developer/API use |
| Text | Paste into docs/email |
| PDF | Formal proposal document |

Text format example:
```text
PROPOSED UNIVERSAL MENU
Generated: 2025-01-15

APPETIZERS (8 items)
- Fried Calamari ($12.99)
- Shrimp Cocktail ($14.99)
...

ENTREES (24 items)
...

Total: 47 items
```

### 7. Comparison View

Optional: Show how the proposed menu compares to each location's current menu:

```text
┌─────────────────────────────────────────┐
│ LOCATION IMPACT                         │
├─────────────────────────────────────────┤
│ Conroe        +12 items  -3 items  ✓    │
│ Post Oak      +8 items   -5 items  ✓    │
│ Atascocita    +15 items  -18 items ⚠    │
│ Denton        +22 items  -0 items  ✓    │
└─────────────────────────────────────────┘
```

Shows:
- Items they'd need to ADD (currently missing)
- Items they'd need to REMOVE (sunset candidates)
- Warning indicator if major changes required

---

## Implementation Steps

### Phase 1: Core Selection (MVP)

1. Add `builderMode` and `proposedItems` state
2. Add Builder Mode toggle button
3. Add selection UI to item cards
4. Add floating proposal panel with item list
5. Add "Copy Link" with URL encoding

**Deliverable:** Users can select items and share a URL

### Phase 2: Bulk Actions

1. Add "Add All" buttons for Core/Recommended sections
2. Add per-category bulk actions for Consider section
3. Add "Clear All" button

**Deliverable:** Fast bulk selection

### Phase 3: Persistence & Export

1. Add LocalStorage auto-save
2. Add CSV export
3. Add text export for pasting

**Deliverable:** Save work and export for stakeholders

### Phase 4: Comparison View (Optional)

1. Calculate per-location deltas
2. Add collapsible comparison panel
3. Show add/remove counts and warnings

**Deliverable:** Understand rollout impact

---

## Technical Considerations

### URL Length Limits

If selecting 100+ items, URL may exceed browser limits (~2000 chars).

Mitigations:
- Use item indices instead of IDs: `items=0,5,12,45`
- Use compression: `items=base64(gzip(ids))`
- Fall back to LocalStorage for very large selections

### State Sync

When URL has `?items=...`:
1. Parse on mount
2. Validate items still exist in data
3. Remove stale items, warn user if any removed
4. Keep URL and state in sync

### Mobile Considerations

Floating panel should:
- Collapse to bottom sheet on mobile
- Show item count badge when collapsed
- Full-screen expand option

---

## Files to Modify

| File | Changes |
|------|---------|
| `app/categories-analysis/CategoryAnalysisClient.tsx` | Add builder state, selection UI, proposal panel |
| `app/categories-analysis/CategoryAnalysis.module.css` | Styles for builder mode, panel, selection states |
| `app/categories-analysis/page.tsx` | No changes (data fetching unchanged) |

New files (optional):
- `components/analysis/ProposalPanel.tsx` — extracted panel component
- `lib/utils/proposalUrl.ts` — URL encode/decode helpers

---

## Open Questions

1. **Named proposals?** Allow users to name their proposals ("Dave's Draft", "Q2 Menu")?

2. **Multiple proposals?** Save multiple proposals in LocalStorage with switcher?

3. **Diff view?** Show visual diff between current menu and proposal per location?

4. **Approval workflow?** Add comments/voting for stakeholder review? (Probably overkill for v1)

---

## Success Metrics

- Users can build a proposed menu in < 2 minutes
- Shared URLs work across browsers/devices
- Stakeholders can review without needing Sanity access
- Location operators can see exactly what changes affect them
