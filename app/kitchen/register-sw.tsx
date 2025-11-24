'use client';

import { useEffect } from 'react';

export function RegisterServiceWorker() {
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;

    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration.scope);

          // Check for updates every hour
          intervalId = setInterval(() => {
            registration.update();
          }, 3600000);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }

    // Cleanup: clear the interval when component unmounts
    return () => {
      if (intervalId !== undefined) {
        clearInterval(intervalId);
      }
    };
  }, []);

  return null;
}
