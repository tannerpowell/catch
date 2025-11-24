#!/usr/bin/env node

/**
 * Generate PWA icons (PNG) from SVG source using Sharp
 * Runs as part of the build process
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

/**
 * Generate an SVG document for a kitchen-pot-with-steam icon at the specified square size.
 *
 * The returned string is a complete SVG file (UTF-8 XML) with a dark background and a white pot-and-steam graphic whose coordinates and stroke widths scale with the provided size.
 * @param {number} size - Icon dimension in pixels; used for both width and height and to scale all SVG elements.
 * @returns {string} The SVG document as a string sized to `${size}x${size}` pixels.
 */
function generateIconSvg(size) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="#1c1c1e"/>
  
  <!-- Kitchen icon (pot with steam) -->
  <g transform="translate(${size/2}, ${size/2})">
    <!-- Pot body -->
    <rect x="${-size/4}" y="${-size/8}" width="${size/2}" height="${size/4}" rx="${size/20}" fill="white" opacity="0.95"/>
    
    <!-- Left handle -->
    <path d="M ${-size/4} ${-size/16} Q ${-size/3} ${-size/16} ${-size/3} ${size/16}"
          stroke="white" stroke-width="${size/40}" fill="none" opacity="0.9" stroke-linecap="round"/>
    
    <!-- Right handle -->
    <path d="M ${size/4} ${-size/16} Q ${size/3} ${-size/16} ${size/3} ${size/16}"
          stroke="white" stroke-width="${size/40}" fill="none" opacity="0.9" stroke-linecap="round"/>
    
    <!-- Steam wisps -->
    <path d="M ${-size/8} ${-size/4} Q ${-size/8} ${-size/3.2} ${-size/10} ${-size/3.8}"
          stroke="white" stroke-width="${size/50}" fill="none" opacity="0.7" stroke-linecap="round"/>
    <path d="M 0 ${-size/4.5} Q 0 ${-size/3.2} ${size/40} ${-size/3.8}"
          stroke="white" stroke-width="${size/50}" fill="none" opacity="0.7" stroke-linecap="round"/>
    <path d="M ${size/8} ${-size/4} Q ${size/8} ${-size/3.2} ${size/10} ${-size/3.8}"
          stroke="white" stroke-width="${size/50}" fill="none" opacity="0.7" stroke-linecap="round"/>
  </g>
</svg>`;
}

/**
 * Create a PNG icon file of the given square size from the inline SVG template.
 *
 * @param {number} size - Target icon size in pixels (width and height).
 * @returns {boolean} `true` if the PNG file was written successfully, `false` otherwise.
 */
async function generateIconPng(size) {
  const svg = generateIconSvg(size);
  const filename = path.join(iconsDir, `icon-${size}x${size}.png`);
  
  try {
    await sharp(Buffer.from(svg))
      .png({ quality: 90 })
      .resize(size, size, { fit: 'contain', background: { r: 28, g: 28, b: 30, alpha: 1 } })
      .toFile(filename);
    console.log(`✓ Created ${filename}`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to create ${filename}: ${error.message}`);
    return false;
  }
}

/**
 * Generate all configured PWA icon PNGs and return an overall exit code.
 *
 * Runs icon generation for each configured size in parallel, logs progress and a final summary,
 * and returns an exit code indicating overall success.
 * @returns {number} 0 if all icons were generated successfully, 1 if any icon failed.
 */
async function generateAllIcons() {
  console.log('🎨 Generating PWA icons...');
  const results = await Promise.all(sizes.map(size => generateIconPng(size)));
  
  const success = results.every(r => r === true);
  if (success) {
    console.log(`\n✅ Successfully generated ${sizes.length} PWA icons`);
    console.log(`📁 Output directory: ${iconsDir}`);
    return 0;
  } else {
    const failed = results.filter(r => r === false).length;
    console.error(`\n❌ Failed to generate ${failed} icon(s)`);
    return 1;
  }
}

generateAllIcons().then(exitCode => process.exit(exitCode));