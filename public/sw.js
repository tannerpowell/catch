// Kitchen Dashboard Service Worker
// Provides offline functionality and caching for the kitchen app

const CACHE_NAME = 'catch-kitchen-v1';
const OFFLINE_URL = '/kitchen';

// Assets to cache on install
const STATIC_ASSETS = [
  '/kitchen',
  '/app/styles/kitchen.css',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Network-first strategy for API calls
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response before caching
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Return cached version if network fails
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200) {
          return response;
        }

        // Clone the response before caching
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Background sync for offline order updates
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
});

/**
 * Synchronize pending order status updates that were created while the client was offline.
 *
 * Intended to be invoked by the service worker's background sync (tagged "sync-orders") to
 * process and send any queued order updates to the server. Currently the function logs
 * "Syncing orders..." and serves as a placeholder for the actual sync implementation.
 */
async function syncOrders() {
  // This would sync any pending order status updates
  // that were made while offline
  console.log('Syncing orders...');
}

// Push notifications (for future use)
self.addEventListener('push', (event) => {
  // Default notification content
  let title = 'New Order';
  let body = 'You have a new order in the kitchen.';
  
  // Safely parse push event data
  if (event.data) {
    try {
      const data = event.data.json();
      title = data.title || title;
      body = data.body || body;
    } catch (error) {
      console.error('Failed to parse push notification data:', error);
      // Continue with default title and body
    }
  }

  const options = {
    body: body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'new-order',
    requireInteraction: true,
  };

  event.waitUntil(
    self.registration.showNotification(title, options).catch((error) => {
      console.error('Failed to show notification:', error);
      // Silent failure - don't throw to prevent service worker errors
    })
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/kitchen')
  );
});