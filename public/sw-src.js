// public/sw-src.js

// Import Workbox (จะถูกเติมให้โดย workbox-cli)
importScripts("https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js");

// ----------------- Workbox Precaching -----------------
// จุดนี้ Workbox จะแทรกรายชื่อไฟล์ทั้งหมดที่ Next.js build ให้โดยอัตโนมัติ
// ทำให้แอปฯ สามารถทำงาน offline ได้
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);

// ----------------- Workbox Runtime Caching Strategies -----------------

// Cache a Google Fonts
workbox.routing.registerRoute(
  ({url}) => url.origin === 'https://fonts.googleapis.com',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
  })
);

// Cache a Supabase Images
workbox.routing.registerRoute(
  ({url}) => url.hostname === 'fcktqdzssxqvuzgdlemo.supabase.co',
  new workbox.strategies.CacheFirst({
    cacheName: 'supabase-images',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

// Cache API calls (Network First)
workbox.routing.registerRoute(
  ({url}) => url.pathname.startsWith('/api/'),
  new workbox.strategies.NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 1 Day
      }),
    ],
  })
);

// ----------------- Custom Push & Notification Logic (จากโค้ดเดิมของคุณ) -----------------

// Handle incoming push events and display notifications
self.addEventListener('push', (event) => {
  // Parse payload – fallback to empty object if none
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_) {
    // If payload is not JSON, treat it as text
    payload = { title: event.data?.text() };
  }

  // Notification details with sensible defaults
  const title = payload.title || 'CareClock – แจ้งเตือน';
  const options = {
    body: payload.body || 'คุณมีการแจ้งเตือนใหม่',
    icon: payload.icon || '/asset/CareClockLOGO.PNG',
    badge: payload.badge || '/asset/CareClockLOGO.PNG',
    data: payload.data || {},
    // Vibrate on devices that support it (Android)
    vibrate: [200, 100, 200],
  };

  // Ensure the promise lives until showNotification resolves
  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle tap on the notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Re-use an existing tab if one is already open for our PWA
      for (const client of clientList) {
        if ('url' in client && client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new tab / window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// ----------------- Other Service Worker Events -----------------
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('sync', (event) => {
  // ... (โค้ด sync event handler เดิมของคุณ) ...
});