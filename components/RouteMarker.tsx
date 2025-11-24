'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function RouteMarker() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.setAttribute('data-route', pathname);
  }, [pathname]);

  return null;
}
