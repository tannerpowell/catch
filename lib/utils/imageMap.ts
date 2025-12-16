import fs from 'node:fs';
import path from 'node:path';
import { slugify } from './slugify';

export type ImageMap = Record<string, string>;

/**
 * Builds a map of slugified image names to their URLs for the DFW images directory.
 * Used by menu pages to associate menu items with images.
 *
 * @returns A record mapping slugified base names to image URLs
 */
export function buildDfwImageMap(): ImageMap {
  try {
    const dir = path.resolve('public/dfw-images');
    if (!fs.existsSync(dir)) return {};
    const entries = fs.readdirSync(dir).filter(f => /\.(png|jpe?g|webp|avif)$/i.test(f));
    const map: ImageMap = {};
    for (const file of entries) {
      const base = file.replace(/\.[^.]+$/, '');
      const key = slugify(base);
      if (!key) continue; // Skip files that produce empty slugs
      map[key] = `/dfw-images/${file}`;
    }
    return map;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to build DFW image map:', err);
    return {};
  }
}
