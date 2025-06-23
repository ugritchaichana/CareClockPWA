'use client'

import { useEffect, useState } from 'react'

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallButton(true)
    }

    const handleAppInstalled = () => {
      setShowInstallButton(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration)
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error)
        })
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('PWA installed')
    } else {
      console.log('PWA installation declined')
    }

    setDeferredPrompt(null)
    setShowInstallButton(false)
  }
  if (!showInstallButton) return null

  return (
    <div className="alert alert-info fixed top-4 left-4 right-4 z-50 max-w-md mx-auto">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <div className="flex-1">
        <div className="font-bold">ติดตั้งแอพ CareClockPWA</div>
        <div className="text-xs">เพื่อประสบการณ์ที่ดีขึ้น</div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setShowInstallButton(false)}
          className="btn btn-ghost btn-sm"
        >
          ไม่ใช่ตอนนี้
        </button>
        <button
          onClick={handleInstallClick}
          className="btn btn-primary btn-sm"
        >
          ติดตั้ง
        </button>
      </div>
    </div>
  )
}
