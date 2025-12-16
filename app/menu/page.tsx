import Menu3PageClient from '@/components/menu3/Menu3PageClient';
import { getBrand } from '@/lib/brand';
import { buildDfwImageMap } from '@/lib/utils/imageMap';
import type { Metadata } from 'next';

// Import menu3 typography styles
import '../styles/menu3-fonts.css';

// Enable ISR - regenerate page every hour
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Menu | The Catch',
  description: 'Browse our full menu of Gulf Coast seafood - baskets, boils, salads, and more. Fresh seafood at 16 locations across Texas and Oklahoma.',
  openGraph: {
    title: 'The Catch Menu — Fresh Seafood Baskets & Boils',
    description: 'Explore our menu of fresh Gulf Coast seafood: catfish baskets, shrimp boils, crawfish tails, and more.',
    images: ['/dfw-images/Different%20menu%20items%20served%20on%20the%20table,%20top%20view.jpg'],
  },
};

/**
 * Premium 3-pane menu page.
 *
 * This page implements a text-forward menu design with:
 * - Location-first filtering (mandatory)
 * - MixItUp for instant-feeling performance
 * - Louize Italic typography for item names
 * - Subway tile texture aesthetic
 * - Hover peek preview in right pane
 */
export default async function Menu3Page() {
  const brand = getBrand();
  const [categories, items, rawLocations] = await Promise.all([
    brand.getCategories(),
    brand.getItems(),
    brand.getLocations(),
  ]);

  // Sort locations with Denton first (default), then alphabetically
  const locations = [...rawLocations].sort((a, b) => {
    if (a.slug === 'denton') return -1;
    if (b.slug === 'denton') return 1;
    return a.name.localeCompare(b.name);
  });

  const dfwImageMap = buildDfwImageMap();

  return (
    <Menu3PageClient
      categories={categories}
      items={items}
      locations={locations}
      imageMap={dfwImageMap}
    />
  );
}
