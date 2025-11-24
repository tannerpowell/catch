'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Synchronizes the current route pathname to the document <html> element's `data-route` attribute.
 *
 * This component runs an effect that updates `document.documentElement.dataset.route` whenever the pathname changes.
 *
 * @returns `null` — the component renders nothing.
 */
export function RouteMarker() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.setAttribute('data-route', pathname);
  }, [pathname]);

  return null;
}