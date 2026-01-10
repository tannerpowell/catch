import fs from 'fs';
import path from 'path';
import colorData from '../lib/design/colors.json';

/**
 * Generates theme CSS from colors.json
 * Run this whenever colors.json is updated
 */

function generateThemeCSS(): string {
  const brandColors = Object.entries(colorData.brand)
    .map(([key, data]) => {
      const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `  --color-${cssVar}: ${data.light};`;
    })
    .join('\n');

  const badgeColors = Object.entries(colorData.badges)
    .map(([key, data]) => {
      const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `  --color-badge-${cssVar}: ${data.value};`;
    })
    .join('\n');

  const semantic = Object.entries(colorData.semantic)
    .map(([key, ref]) => {
      const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      // Resolve reference if it points to another color
      const value = typeof ref === 'string' && ref.startsWith('brand.')
        ? `var(--color-${ref.split('.')[1].replace(/([A-Z])/g, '-$1').toLowerCase()})`
        : ref;
      return `  --color-${cssVar}: ${value};`;
    })
    .join('\n');

  return `/**
 * AUTO-GENERATED from lib/design/colors.json
 * DO NOT EDIT MANUALLY - run 'bun run generate:theme' instead
 */

@theme {
  /* === Brand Colors === */
${brandColors}

  /* === Badge Colors === */
${badgeColors}

  /* === Semantic Mappings === */
${semantic}
}
`;
}

// Write to a partial that gets imported by globals.css
const output = generateThemeCSS();
const outputPath = path.join(process.cwd(), 'app/styles/generated-theme.css');
fs.writeFileSync(outputPath, output, 'utf-8');
console.log('✅ Generated app/styles/generated-theme.css');
