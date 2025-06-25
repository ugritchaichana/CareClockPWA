// Service Worker for PWA functionality
const CACHE_NAME = 'care-clock-pwa-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/asset/CareClockLOGO.PNG'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Claim all clients
  return self.clients.claim();
});

// Push event for notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'เวลากินยาแล้ว!',
    icon: '/asset/CareClockLOGO.PNG',
    badge: '/asset/CareClockLOGO.PNG',
    vibrate: [200, 100, 200],
    tag: 'medicine-reminder',
    requireInteraction: true,
    actions: [
      {
        action: 'taken',
        title: '✅ กินแล้ว'
      },
      {
        action: 'skip',
        title: '⏭️ ข้าม'
      },
      {
        action: 'snooze',
        title: '⏰ เลื่อน 5 นาที'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('CareClockPWA - แจ้งเตือนกินยา', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  if (event.action === 'taken') {
    // Handle medicine taken
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        if (clients.length > 0) {
          clients[0].postMessage({
            type: 'MEDICINE_TAKEN',
            notificationTag: event.notification.tag
          });
        }
      })
    );
  } else if (event.action === 'skip') {
    // Handle medicine skipped
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        if (clients.length > 0) {
          clients[0].postMessage({
            type: 'MEDICINE_SKIPPED',
            notificationTag: event.notification.tag
          });
        }
      })
    );
  } else if (event.action === 'snooze') {
    // Snooze for 5 minutes
    setTimeout(() => {
      self.registration.showNotification('CareClockPWA - แจ้งเตือนกินยา (เลื่อน)', {
        body: 'เวลากินยาแล้ว! (เลื่อนมา 5 นาที)',
        icon: '/asset/CareClockLOGO.PNG',
        badge: '/asset/CareClockLOGO.PNG',
        vibrate: [200, 100, 200],
        tag: 'medicine-reminder-snooze',
        requireInteraction: true
      });
    }, 5 * 60 * 1000); // 5 minutes
  } else {
    // Default action - open the app
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        if (clients.length > 0) {
          clients[0].focus();
        } else {
          self.clients.openWindow('/');
        }
      })
    );
  }
});

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);
  
  if (event.tag === 'sync-medicine-data') {
    event.waitUntil(syncMedicineData());
  }
});

// Function to sync medicine data when back online
async function syncMedicineData() {
  try {
    // Get pending notifications from IndexedDB or localStorage
    const pendingNotifications = await getPendingNotifications();
    
    // Send them to server when online
    for (const notification of pendingNotifications) {
      try {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(notification)
        });
        // Remove from pending after successful sync
        await removePendingNotification(notification.id);
      } catch (error) {
        console.error('Failed to sync notification:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Helper functions for managing pending notifications
async function getPendingNotifications() {
  // This would typically use IndexedDB
  // For now, return empty array
  return [];
}

async function removePendingNotification(id) {
  // This would typically remove from IndexedDB
  console.log('Removing pending notification:', id);
}