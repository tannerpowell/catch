#!/usr/bin/env tsx
/**
 * Finds all hardcoded hex colors in the codebase
 *
 * Searches TypeScript, TSX, CSS, and SCSS files for hex color patterns.
 * Excludes:
 * - Generated files
 * - Node modules
 * - Design source files (colors.json intentionally has hex values)
 * - Lock files
 *
 * Run: bun run find:colors
 */

import { execSync } from 'child_process';

const hexPattern = '#[0-9a-fA-F]{6}\\b|#[0-9a-fA-F]{3}\\b';

const ignorePatterns = [
  'node_modules',
  'bun.lockb',
  '.next',
  'dist',
  'build',
  // Intentionally have hex values:
  'lib/design/colors.json',
  'app/styles/generated-theme.css',
  'scripts/verify-color-contrast.ts',
  'scripts/find-hardcoded-colors.ts',
  'scripts/generate-theme-css.ts',
  // Legacy Catch design system files (copied from original site):
  'app/styles/catch-base.css',
  'app/styles/dark-theme.css',
  // SVG and image files:
  '*.svg',
  '*.png',
  '*.jpg',
  '*.ico',
];

const includeExtensions = [
  'ts',
  'tsx',
  'js',
  'jsx',
  'css',
  'scss',
];

try {
  const globArgs = [
    ...ignorePatterns.map(p => `--glob=!${p}`),
    ...includeExtensions.map(ext => `--glob=*.${ext}`),
  ];

  const cmd = [
    'rg',
    `"${hexPattern}"`,
    ...globArgs,
    '--color=always',
    '--line-number',
    '--column',
    '--no-heading',
  ].join(' ');

  console.log('🔍 Searching for hardcoded hex colors in codebase...\n');
  console.log('Excluding:');
  ignorePatterns.forEach(p => console.log(`  - ${p}`));
  console.log('');

  const result = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });

  if (result.trim()) {
    console.log('Found hardcoded colors:\n');
    console.log(result);
    console.log('\n⚠️  Replace these with CSS custom properties or Tailwind classes');
    console.log('   See lib/design/colors.json for available colors');
    process.exit(1);
  } else {
    console.log('✅ No hardcoded hex colors found!\n');
    console.log('All colors are properly centralized in the theme system.\n');
    process.exit(0);
  }
} catch (error: any) {
  if (error.status === 1 && !error.stdout?.toString().trim()) {
    // rg exit code 1 with no output means no matches found
    console.log('✅ No hardcoded hex colors found!\n');
    console.log('All colors are properly centralized in the theme system.\n');
    process.exit(0);
  } else {
    console.error('Error running search:', error.message);
    process.exit(1);
  }
}
