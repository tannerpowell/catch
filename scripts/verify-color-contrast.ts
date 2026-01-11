#!/usr/bin/env tsx
/**
 * WCAG AA Contrast Ratio Verifier
 *
 * Checks all brand and badge colors for WCAG AA compliance:
 * - Normal text: 4.5:1 minimum
 * - Large text (18pt+): 3:1 minimum
 *
 * Run: bun run verify:contrast
 */

import colorData from '../lib/design/colors.json';

interface RGB {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): RGB {
  // Match both 3-char (#FFF) and 6-char (#FFFFFF) hex formats
  const result = /^#?([a-f\d]{3}){1,2}$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  let h = hex.replace('#', '');
  // Expand 3-char shorthand to 6-char (e.g., "FFF" -> "FFFFFF")
  if (h.length === 3) {
    h = h.split('').map(c => c + c).join('');
  }

  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const lum1 = luminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = luminance(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

function getContrastGrade(ratio: number, isLargeText = false): string {
  const threshold = isLargeText ? 3.0 : 4.5;
  if (ratio >= 7.0) return '✅ AAA';
  if (ratio >= threshold) return '✅ AA';
  // AA Large is a valid WCAG compliance level for large text (18pt+/14pt bold+)
  if (ratio >= 3.0 && isLargeText) return '✅ AA Large';
  return '❌ Fail';
}

/** Verify brand colors against a background and count issues */
function verifyBrandColors(
  mode: 'light' | 'dark',
  background: string
): number {
  let issues = 0;

  Object.entries(colorData.brand).forEach(([name, data]) => {
    if (name === 'cremaFresca' || name === 'pureWhite') {
      console.log(`⏭️  ${name.padEnd(20)} (surface color, not tested as text)\n`);
      return;
    }

    const color = mode === 'light' ? data.light : data.dark;
    const ratio = contrastRatio(color, background);
    const grade = getContrastGrade(ratio);

    if (grade.includes('❌')) {
      issues++;
    }

    console.log(`${grade} ${name.padEnd(20)} ${ratio.toFixed(2)}:1`);
    console.log(`   ${color.padEnd(10)} "${data.description}"\n`);
  });

  return issues;
}

console.log('🎨 WCAG AA Contrast Verification\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const lightBg = colorData.brand.cremaFresca.light;
const darkBg = colorData.brand.cremaFresca.dark;
const cardBg = '#ffffff';

console.log('📊 Brand Colors on Page Background\n');
console.log('Light Mode (on Crema Fresca #FDF8ED):');
console.log('────────────────────────────────────────────────────\n');

const lightModeIssues = verifyBrandColors('light', lightBg);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('Dark Mode (on Dark Crema #0f172a):');
console.log('────────────────────────────────────────────────────\n');

const darkModeIssues = verifyBrandColors('dark', darkBg);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('🏷️  Badge Colors (Large Text - 3:1 minimum)\n');
console.log('Light Mode (on white card background):');
console.log('────────────────────────────────────────────────────\n');

let badgeIssues = 0;

Object.entries(colorData.badges).forEach(([name, data]) => {
  const ratio = contrastRatio(data.value, cardBg);
  const grade = getContrastGrade(ratio, true); // Large text threshold

  if (grade.includes('❌')) {
    badgeIssues++;
  }

  console.log(`${grade} ${data.label.padEnd(15)} ${ratio.toFixed(2)}:1`);
  console.log(`   ${data.value}\n`);
});

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📋 Summary\n');
console.log(`Light mode issues: ${lightModeIssues}`);
console.log(`Dark mode issues:  ${darkModeIssues}`);
console.log(`Badge issues:      ${badgeIssues}`);

const totalIssues = lightModeIssues + darkModeIssues + badgeIssues;

if (totalIssues === 0) {
  console.log('\n✅ All colors pass WCAG AA compliance!\n');
  process.exit(0);
} else {
  console.log(`\n⚠️  Found ${totalIssues} color contrast issue(s)\n`);
  console.log('Update colors in lib/design/colors.json and regenerate theme.\n');
  process.exit(1);
}
