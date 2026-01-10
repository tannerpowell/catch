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
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
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
  if (ratio >= 3.0 && isLargeText) return '⚠️  AA Large';
  return '❌ Fail';
}

console.log('🎨 WCAG AA Contrast Verification\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Brand colors on light and dark backgrounds
const lightBg = colorData.brand.cremaFresca.light;
const darkBg = colorData.brand.cremaFresca.dark;
const white = '#ffffff';
const cardBg = '#ffffff';

console.log('📊 Brand Colors on Page Background\n');
console.log('Light Mode (on Crema Fresca #FDF8ED):');
console.log('────────────────────────────────────────────────────\n');

let lightModeIssues = 0;
let darkModeIssues = 0;

Object.entries(colorData.brand).forEach(([name, data]) => {
  // Skip background colors from being tested as foreground
  if (name === 'cremaFresca') {
    console.log(`⏭️  ${name.padEnd(20)} (background color, not tested as text)\n`);
    return;
  }

  const lightRatio = contrastRatio(data.light, lightBg);
  const lightGrade = getContrastGrade(lightRatio);

  if (lightGrade.includes('❌') || lightGrade.includes('⚠️')) {
    lightModeIssues++;
  }

  console.log(`${lightGrade} ${name.padEnd(20)} ${lightRatio.toFixed(2)}:1`);
  console.log(`   ${data.light.padEnd(10)} "${data.description}"\n`);
});

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('Dark Mode (on Dark Crema #0f172a):');
console.log('────────────────────────────────────────────────────\n');

Object.entries(colorData.brand).forEach(([name, data]) => {
  if (name === 'cremaFresca') {
    console.log(`⏭️  ${name.padEnd(20)} (background color, not tested as text)\n`);
    return;
  }

  const darkRatio = contrastRatio(data.dark, darkBg);
  const darkGrade = getContrastGrade(darkRatio);

  if (darkGrade.includes('❌') || darkGrade.includes('⚠️')) {
    darkModeIssues++;
  }

  console.log(`${darkGrade} ${name.padEnd(20)} ${darkRatio.toFixed(2)}:1`);
  console.log(`   ${data.dark.padEnd(10)} "${data.description}"\n`);
});

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
