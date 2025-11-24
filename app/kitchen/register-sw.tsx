'use client';

import { useEffect } from 'react';

/**
 * Registers a service worker in production and schedules hourly update checks for its registration while the component is mounted.
 *
 * The component registers '/sw.js' when running in a browser environment with service worker support and when NODE_ENV is 'production'. It schedules periodic calls to `registration.update()` every hour and clears that timer when the component unmounts.
 *
 * @returns A React element that renders nothing (`null`).
 */
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