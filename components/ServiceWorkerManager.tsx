'use client'

import { useEffect } from 'react'

export default function ServiceWorkerManager() {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration.scope)
          
          // Handle service worker updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker is available
                  console.log('New service worker available!')
                  
                  // You could show a notification to user here
                  if (confirm('มีการอัพเดตใหม่! ต้องการรีเฟรชแอพหรือไม่?')) {
                    window.location.reload()
                  }
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Message from service worker:', event.data)
        
        const { type } = event.data
        if (type === 'NOTIFICATION_CLICKED') {
          // Handle notification click
          console.log('Notification was clicked')
        }
      })
    }    // Handle background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      // Register for background sync when offline
      navigator.serviceWorker.ready.then((registration) => {
        return (registration as any).sync.register('sync-medicine-data')
      }).catch((error) => {
        console.error('Background sync registration failed:', error)
      })
    }

    // Handle push subscription (for future use with push server)
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then((registration) => {
        // Check if user is already subscribed
        return registration.pushManager.getSubscription()
      }).then((subscription) => {
        if (subscription) {
          console.log('User is already subscribed to push notifications')
        }
      }).catch((error) => {
        console.error('Error checking push subscription:', error)
      })
    }

    // Handle online/offline events
    const handleOnline = () => {
      console.log('App is back online')      // Trigger background sync when back online
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          if ('sync' in registration) {
            return (registration as any).sync.register('sync-medicine-data')
          }
        }).catch((error) => {
          console.error('Background sync failed:', error)
        })
      }
    }

    const handleOffline = () => {
      console.log('App is offline')
      // You could show an offline indicator here
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return null // This component doesn't render anything
}
