'use client'

import { useState, useEffect } from 'react'

export default function PWAiOSTest() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [deviceInfo, setDeviceInfo] = useState<any>({})
  const [installPrompt, setInstallPrompt] = useState<any>(null)

  useEffect(() => {
    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isStandalone = 'standalone' in (navigator as any) && (navigator as any).standalone
    const isChrome = /CriOS/.test(navigator.userAgent)
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
    
    setDeviceInfo({
      userAgent: navigator.userAgent,
      isIOS,
      isStandalone,
      isChrome,
      isSafari,
      platform: navigator.platform,
      touchSupport: 'ontouchstart' in window,
      serviceWorkerSupport: 'serviceWorker' in navigator,
      notificationSupport: 'Notification' in window,
      pushSupport: 'PushManager' in window,
      vibrationSupport: 'vibrate' in navigator,
      audioSupport: 'Audio' in window,
      cacheSupport: 'caches' in window
    })

    // Listen for beforeinstallprompt (Android/Chrome)
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      setInstallPrompt(e)
      addResult('💾 Install prompt detected (Android/Chrome)')
    })

  }, [])

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  const testServiceWorker = async () => {
    try {
      addResult('🔧 Testing Service Worker...')
      
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/sw.js')
        addResult('✅ Service Worker registered successfully')
        
        if (registration.active) {
          addResult('✅ Service Worker is active')
        } else {
          addResult('⏳ Service Worker is installing...')
        }
      } else {
        addResult('❌ Service Worker not supported')
      }
    } catch (error) {
      addResult(`❌ Service Worker error: ${error}`)
    }
  }

  const testNotifications = async () => {
    try {
      addResult('🔔 Testing Notifications...')
      
      if (!('Notification' in window)) {
        addResult('❌ Notifications not supported')
        return
      }

      const permission = await Notification.requestPermission()
      addResult(`📋 Notification permission: ${permission}`)

      if (permission === 'granted') {
        const notification = new Notification('🧪 CareClock Test', {
          body: 'PWA Notification test สำเร็จ!',
          icon: '/asset/CareClockLOGO.PNG',
          badge: '/asset/CareClockLOGO.PNG',
          tag: 'test-notification',
          requireInteraction: true,
          silent: false
        })

        notification.onclick = () => {
          addResult('👆 Notification clicked')
          notification.close()
        }

        setTimeout(() => {
          notification.close()
        }, 5000)

        addResult('✅ Test notification sent')
      }
    } catch (error) {
      addResult(`❌ Notification error: ${error}`)
    }
  }

  const testVibration = () => {
    try {
      addResult('📳 Testing Vibration...')
      
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200])
        addResult('✅ Vibration triggered')
      } else {
        addResult('❌ Vibration not supported')
      }
    } catch (error) {
      addResult(`❌ Vibration error: ${error}`)
    }
  }

  const testAudio = () => {
    try {
      addResult('🔊 Testing Audio...')
      
      const audio = new Audio()
      audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+PwzmUcBjiP2e7MfiMFl'
      
      audio.play().then(() => {
        addResult('✅ Audio playback successful')
      }).catch((error) => {
        addResult(`❌ Audio error: ${error.message}`)
      })
    } catch (error) {
      addResult(`❌ Audio error: ${error}`)
    }
  }

  const testOfflineCapability = async () => {
    try {
      addResult('📶 Testing Offline Capability...')
      
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        addResult(`📦 Cache storages: ${cacheNames.join(', ') || 'None'}`)
        
        // Test offline page
        const offlineResponse = await fetch('/offline.html')
        if (offlineResponse.ok) {
          addResult('✅ Offline page accessible')
        } else {
          addResult('❌ Offline page not found')
        }
      } else {
        addResult('❌ Cache API not supported')
      }
    } catch (error) {
      addResult(`❌ Offline test error: ${error}`)
    }
  }

  const testIOSSpecific = () => {
    addResult('🍎 Testing iOS Specific Features...')
    
    // Test iOS viewport
    const viewport = document.querySelector('meta[name="viewport"]')
    if (viewport) {
      addResult(`📱 Viewport: ${(viewport as HTMLMetaElement).content}`)
    }

    // Test iOS meta tags
    const iosCapable = document.querySelector('meta[name="apple-mobile-web-app-capable"]')
    if (iosCapable) {
      addResult(`🍎 iOS Web App Capable: ${(iosCapable as HTMLMetaElement).content}`)
    }

    const iosStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
    if (iosStatusBar) {
      addResult(`🍎 iOS Status Bar: ${(iosStatusBar as HTMLMetaElement).content}`)
    }

    const iosTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]')
    if (iosTitle) {
      addResult(`🍎 iOS Title: ${(iosTitle as HTMLMetaElement).content}`)
    }

    // Test iOS icon
    const iosIcon = document.querySelector('link[rel="apple-touch-icon"]')
    if (iosIcon) {
      addResult(`🍎 iOS Icon: ${(iosIcon as HTMLLinkElement).href}`)
    }

    // Test standalone mode
    if (deviceInfo.isStandalone) {
      addResult('✅ Running in standalone mode (installed)')
    } else {
      addResult('📱 Running in browser mode (not installed)')
    }
  }

  const installPWA = async () => {
    if (installPrompt) {
      // Android/Chrome installation
      const result = await installPrompt.prompt()
      addResult(`💾 Install result: ${result.outcome}`)
      setInstallPrompt(null)
    } else if (deviceInfo.isIOS && !deviceInfo.isStandalone) {
      // iOS installation instructions
      addResult('🍎 iOS Installation Instructions:')
      addResult('1. กด Share button ใน Safari')
      addResult('2. เลือก "Add to Home Screen"')
      addResult('3. กด "Add" เพื่อติดตั้ง PWA')
    } else {
      addResult('❌ Installation not available')
    }
  }

  const runAllTests = async () => {
    setTestResults([])
    addResult('🚀 Starting PWA iOS Tests...')
    
    testIOSSpecific()
    await testServiceWorker()
    await testNotifications()
    testVibration()
    testAudio()
    await testOfflineCapability()
    
    addResult('🏁 All tests completed!')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
          <h1 className="text-2xl font-bold text-center mb-2 text-indigo-800">
            🧪 PWA iOS Test Center
          </h1>
          <p className="text-center text-gray-600 text-sm mb-4">
            ทดสอบการทำงานของ PWA บน iOS
          </p>

          {/* Device Info */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <h2 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              📱 Device Information
            </h2>
            <div className="space-y-1 text-xs">
              <p><strong>Platform:</strong> {deviceInfo.platform}</p>
              <p><strong>iOS:</strong> {deviceInfo.isIOS ? '✅' : '❌'}</p>
              <p><strong>Standalone:</strong> {deviceInfo.isStandalone ? '✅' : '❌'}</p>
              <p><strong>Safari:</strong> {deviceInfo.isSafari ? '✅' : '❌'}</p>
              <p><strong>Chrome iOS:</strong> {deviceInfo.isChrome ? '✅' : '❌'}</p>
              <p><strong>Touch Support:</strong> {deviceInfo.touchSupport ? '✅' : '❌'}</p>
              <p><strong>Service Worker:</strong> {deviceInfo.serviceWorkerSupport ? '✅' : '❌'}</p>
              <p><strong>Notifications:</strong> {deviceInfo.notificationSupport ? '✅' : '❌'}</p>
              <p><strong>Push:</strong> {deviceInfo.pushSupport ? '✅' : '❌'}</p>
              <p><strong>Vibration:</strong> {deviceInfo.vibrationSupport ? '✅' : '❌'}</p>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={runAllTests}
              className="col-span-2 bg-indigo-600 text-white rounded-2xl p-3 font-semibold shadow-lg hover:bg-indigo-700 transition-colors"
            >
              🚀 Run All Tests
            </button>
            
            <button
              onClick={testServiceWorker}
              className="bg-blue-500 text-white rounded-xl p-2 text-sm font-medium shadow-md hover:bg-blue-600 transition-colors"
            >
              🔧 SW Test
            </button>
            
            <button
              onClick={testNotifications}
              className="bg-green-500 text-white rounded-xl p-2 text-sm font-medium shadow-md hover:bg-green-600 transition-colors"
            >
              🔔 Notification
            </button>
            
            <button
              onClick={testVibration}
              className="bg-purple-500 text-white rounded-xl p-2 text-sm font-medium shadow-md hover:bg-purple-600 transition-colors"
            >
              📳 Vibration
            </button>
            
            <button
              onClick={testAudio}
              className="bg-yellow-500 text-white rounded-xl p-2 text-sm font-medium shadow-md hover:bg-yellow-600 transition-colors"
            >
              🔊 Audio
            </button>
            
            <button
              onClick={testOfflineCapability}
              className="bg-red-500 text-white rounded-xl p-2 text-sm font-medium shadow-md hover:bg-red-600 transition-colors"
            >
              📶 Offline
            </button>
            
            <button
              onClick={installPWA}
              className="bg-pink-500 text-white rounded-xl p-2 text-sm font-medium shadow-md hover:bg-pink-600 transition-colors"
            >
              💾 Install
            </button>
          </div>

          {/* Test Results */}
          <div className="bg-gray-900 text-green-400 rounded-2xl p-4 h-64 overflow-y-auto">
            <h3 className="font-bold mb-2 text-white">📋 Test Results:</h3>
            {testResults.length === 0 ? (
              <p className="text-gray-500">กด "Run All Tests" เพื่อเริ่มทดสอบ...</p>
            ) : (
              testResults.map((result, index) => (
                <p key={index} className="text-xs mb-1 font-mono leading-relaxed">
                  {result}
                </p>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-3xl shadow-xl p-6">
          <h2 className="font-bold text-indigo-800 mb-3 flex items-center gap-2">
            📖 iOS PWA Testing Instructions
          </h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <h3 className="font-semibold text-indigo-600">🍎 สำหรับ iOS Safari:</h3>
              <ol className="list-decimal list-inside ml-2 space-y-1 text-xs">
                <li>เปิดเว็บไซต์ใน Safari บน iPhone/iPad</li>
                <li>กดปุ่ม Share (ไอคอนกล่อง + ลูกศร)</li>
                <li>เลือก "Add to Home Screen"</li>
                <li>กด "Add" เพื่อติดตั้ง PWA</li>
                <li>เปิดแอพจาก Home Screen</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-semibold text-green-600">✅ สิ่งที่ควรทดสอบ:</h3>
              <ul className="list-disc list-inside ml-2 space-y-1 text-xs">
                <li>การติดตั้งและเปิดแอพ</li>
                <li>การทำงาน offline</li>
                <li>การแจ้งเตือน (ต้องให้สิทธิ์)</li>
                <li>การสั่น (บน device จริง)</li>
                <li>เสียงแจ้งเตือน</li>
                <li>UI/UX บนหน้าจอ touch</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-red-600">⚠️ ข้อจำกัด iOS:</h3>
              <ul className="list-disc list-inside ml-2 space-y-1 text-xs">
                <li>ต้องใช้ Safari เท่านั้น (ไม่ใช่ Chrome)</li>
                <li>การแจ้งเตือนมีข้อจำกัด</li>
                <li>ต้องเปิดแอพก่อนถึงจะได้รับ notification</li>
                <li>บาง API อาจไม่รองรับ</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
