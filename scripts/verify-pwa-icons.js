#!/usr/bin/env node

/**
 * Verify that all required PWA icons exist
 * Runs as part of build verification to ensure icons are available
 * Fails if critical sizes (192x192, 512x512) are missing
 */

const fs = require('fs');
const path = require('path');

const requiredSizes = [192, 512]; // Minimum required for PWA
const recommendedSizes = [72, 96, 128, 144, 152, 384]; // Recommended for best coverage
const iconsDir = path.join(__dirname, '../public/icons');

console.log('\n📋 Verifying PWA icons...\n');

let allRequiredPresent = true;
let missingRequired = [];
let missingRecommended = [];

// Check required sizes
requiredSizes.forEach((size) => {
  const filename = path.join(iconsDir, `icon-${size}x${size}.png`);
  if (!fs.existsSync(filename)) {
    missingRequired.push(size);
    allRequiredPresent = false;
  } else {
    const stats = fs.statSync(filename);
    console.log(`✓ ${size}x${size}: ${(stats.size / 1024).toFixed(1)}KB`);
  }
});

// Check recommended sizes
recommendedSizes.forEach((size) => {
  const filename = path.join(iconsDir, `icon-${size}x${size}.png`);
  if (!fs.existsSync(filename)) {
    missingRecommended.push(size);
  } else {
    const stats = fs.statSync(filename);
    console.log(`✓ ${size}x${size}: ${(stats.size / 1024).toFixed(1)}KB`);
  }
});

// Report results
if (missingRequired.length > 0) {
  console.error(`\n❌ CRITICAL: Missing required icons: ${missingRequired.map(s => `${s}x${s}`).join(', ')}`);
  console.error('The PWA will not install on devices without these icons.');
  console.error('\nTo fix, run: npm run generate-icons');
  process.exit(1);
} else if (missingRecommended.length > 0) {
  console.warn(`\n⚠️  WARNING: Missing recommended icons: ${missingRecommended.map(s => `${s}x${s}`).join(', ')}`);
  console.warn('PWA will work but may not display optimally on all devices.');
} else {
  console.log(`\n✅ All ${requiredSizes.length + recommendedSizes.length} PWA icons present`);
}

process.exit(missingRequired.length > 0 ? 1 : 0);
