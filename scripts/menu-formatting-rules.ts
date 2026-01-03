/**
 * Menu Formatting Rules - Batch Script
 *
 * This script applies standardized formatting to menu item names and descriptions.
 * Run with: npx tsx scripts/menu-formatting-rules.ts
 *
 * Options:
 *   --dry-run    Preview changes without applying them
 *   --verbose    Show all changes (not just first 20)
 *
 * Formatting rules are defined in: lib/menu-formatting.ts
 */

import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
import { formatMenuItemName, formatMenuItemDescription } from '../lib/menu-formatting';

dotenv.config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_WRITE_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

// ============================================================================
// MAIN SCRIPT
// ============================================================================

interface Fix {
  id: string;
  itemName: string;
  field: 'name' | 'description';
  oldValue: string;
  newValue: string;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const verbose = args.includes('--verbose');

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║           MENU FORMATTING RULES - CONSOLIDATED                 ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be applied\n');
  }

  console.log('Fetching all menu items...\n');

  const items = await client.fetch(`
    *[_type == "menuItem"] {
      _id,
      name,
      description
    }
  `);

  console.log(`Found ${items.length} items\n`);

  const fixes: Fix[] = [];

  items.forEach((item: { _id: string; name?: string; description?: string }) => {
    // Check name
    if (item.name) {
      const fixedName = formatMenuItemName(item.name);
      if (fixedName !== item.name) {
        fixes.push({
          id: item._id,
          itemName: item.name,
          field: 'name',
          oldValue: item.name,
          newValue: fixedName,
        });
      }
    }

    // Check description
    if (item.description) {
      const fixedDesc = formatMenuItemDescription(item.description);
      if (fixedDesc !== item.description) {
        fixes.push({
          id: item._id,
          itemName: item.name || 'Untitled',
          field: 'description',
          oldValue: item.description,
          newValue: fixedDesc,
        });
      }
    }
  });

  console.log(`Found ${fixes.length} fields to fix:\n`);

  // Show fixes
  const displayCount = verbose ? fixes.length : Math.min(20, fixes.length);
  fixes.slice(0, displayCount).forEach((fix, idx) => {
    console.log(`${idx + 1}. ${fix.itemName} [${fix.field}]:`);
    console.log(`   FROM: "${fix.oldValue}"`);
    console.log(`   TO:   "${fix.newValue}"`);
    console.log('');
  });

  if (!verbose && fixes.length > 20) {
    console.log(`... and ${fixes.length - 20} more (use --verbose to see all)\n`);
  }

  if (fixes.length > 0 && !dryRun) {
    console.log('\nApplying fixes...\n');

    for (const fix of fixes) {
      await client.patch(fix.id).set({ [fix.field]: fix.newValue }).commit();
      console.log(`✓ Fixed: ${fix.itemName} [${fix.field}]`);
    }

    console.log(`\n✅ Fixed ${fixes.length} fields!`);
  } else if (dryRun && fixes.length > 0) {
    console.log('\n⚠️  Run without --dry-run to apply these changes');
  } else {
    console.log('\n✅ No fields need fixing!');
  }
}

main().catch(console.error);
