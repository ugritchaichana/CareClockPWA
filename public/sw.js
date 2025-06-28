// public/sw-src.js

// Import Workbox (จะถูกเติมให้โดย workbox-cli)
importScripts("https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js");

// ----------------- Workbox Precaching -----------------
// จุดนี้ Workbox จะแทรกรายชื่อไฟล์ทั้งหมดที่ Next.js build ให้โดยอัตโนมัติ
// ทำให้แอปฯ สามารถทำงาน offline ได้
workbox.precaching.precacheAndRoute([{"revision":"2c2126f37defbb37910a75e68370a252","url":"/asset/CareClockLOGO.PNG"},{"revision":"65cbbe64f39ddfdcc4c684dbb97c6102","url":"/manifest.json"},{"revision":"b8a65a31bfc3ff285abd003b84dc5f08","url":"/offline.html"}]);

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
  const targetUrl = event.notification?.data?.url || '/';
  event.notification.close();

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of allClients) {
        if (client.url === targetUrl && 'focus' in client) {
          client.postMessage({ type: 'USER_INTERACTION' });
          return client.focus();
        }
      }
      // เปิดใหม่พร้อมส่ง message เมื่อเปิดสำเร็จ
      if (self.clients.openWindow) {
        const newClient = await self.clients.openWindow(new URL(targetUrl, self.location.origin).href);
        if (newClient) newClient.postMessage({ type: 'USER_INTERACTION' });
      }
    })()
  );
});

// ----------------- Client-Triggered Notification via postMessage -----------------
// Allow the web app (in foreground) to ask the Service Worker to show a system
// notification. This is useful when the app detects that it is time to remind
// the user while the PWA might be in the background, suspended, or closed.
self.addEventListener('message', (event) => {
  if (event.data?.type) {
    console.log('[SW] message received type:', event.data.type);
  }
  if (!event.data || event.data.type !== 'SHOW_NOTIFICATION') return;

  const payload = event.data.notification || {};

  const {
    title = 'CareClock – แจ้งเตือน',
    body = 'คุณมีการแจ้งเตือนใหม่',
    icon = '/asset/CareClockLOGO.PNG',
    badge = '/asset/CareClockLOGO.PNG',
    tag,
    requireInteraction = false,
    silent = false,
    vibrate,
    data = {},
    actions = [],
  } = payload;

  const options = {
    body,
    icon,
    badge,
    tag,
    requireInteraction,
    silent,
    vibrate,
    data,
    actions,
  };

  event.waitUntil(self.registration.showNotification(title, options));
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