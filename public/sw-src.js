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

// Enhanced push event for notifications
self.addEventListener('push', (event) => {
  // ... (โค้ด push event handler เดิมของคุณ) ...
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  // ... (โค้ด notificationclick event handler เดิมของคุณ) ...
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