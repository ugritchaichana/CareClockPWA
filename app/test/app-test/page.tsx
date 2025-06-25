'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { notificationManager } from '../../../lib/notificationManager'

export default function AppTestPage() {
  const router = useRouter()
  const [activeTestTab, setActiveTestTab] = useState('pwa')
  const [testResults, setTestResults] = useState<string[]>([])
  const [deviceInfo, setDeviceInfo] = useState<any>({})
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  
  // Test states
  const [isTestingAudio, setIsTestingAudio] = useState(false)
  const [isTestingVibration, setIsTestingVibration] = useState(false)
  const [isTestingNotification, setIsTestingNotification] = useState(false)

  useEffect(() => {
    // Detect device info
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

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      setInstallPrompt(e)
      addResult('💾 Install prompt detected (Android/Chrome)')
    })
  }, [])

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  const clearResults = () => {
    setTestResults([])
  }

  // PWA Tests
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

  const testOfflineCapability = async () => {
    try {
      addResult('📶 Testing Offline Capability...')
      
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        addResult(`📦 Cache storages: ${cacheNames.join(', ') || 'None'}`)
        
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
    
    const viewport = document.querySelector('meta[name="viewport"]')
    if (viewport) {
      addResult(`📱 Viewport: ${(viewport as HTMLMetaElement).content}`)
    }

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

    const iosIcon = document.querySelector('link[rel="apple-touch-icon"]')
    if (iosIcon) {
      addResult(`🍎 iOS Icon: ${(iosIcon as HTMLLinkElement).href}`)
    }

    if (deviceInfo.isStandalone) {
      addResult('✅ Running in standalone mode (installed)')
    } else {
      addResult('📱 Running in browser mode (not installed)')
    }
  }

  // Notification Tests
  const testNotifications = async () => {
    try {
      setIsTestingNotification(true)
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
    } finally {
      setIsTestingNotification(false)
    }
  }

  const testAudio = async () => {
    try {
      setIsTestingAudio(true)
      addResult('🔊 Testing Audio...')
      
      // Initialize audio with user interaction
      const audioReady = await notificationManager.initializeAudioWithUserInteraction()
      if (audioReady) {
        addResult('✅ Audio initialized successfully')
      } else {
        addResult('⚠️ Audio initialization partial success')
      }
      
      // Test sound playback directly
      const soundWorked = await notificationManager.testSoundPlayback()
      if (soundWorked) {
        addResult('🎵 Sound test completed successfully')
      } else {
        addResult('❌ Sound test failed')
      }
      
    } catch (error) {
      addResult(`❌ Audio error: ${error}`)
    } finally {
      setIsTestingAudio(false)
    }
  }

  const testAudioDirect = async () => {
    try {
      addResult('🎼 Testing Direct Audio...')
      
      // Create a simple beep using Web Audio API directly
      if ('AudioContext' in window || 'webkitAudioContext' in window) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContext();
        
        // Resume if suspended (iOS requirement)
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
          addResult('🔓 AudioContext resumed')
        }
        
        // Create oscillator
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
        
        addResult('🎵 Direct audio test played')
        
        // Clean up
        setTimeout(() => audioContext.close(), 1000);
      } else {
        addResult('❌ Web Audio API not supported')
      }
    } catch (error) {
      addResult(`❌ Direct audio error: ${error}`)
    }
  }

  const testVibration = () => {
    try {
      setIsTestingVibration(true)
      addResult('📳 Testing Vibration...')
      
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200])
        addResult('✅ Vibration triggered')
      } else {
        addResult('❌ Vibration not supported')
      }
    } catch (error) {
      addResult(`❌ Vibration error: ${error}`)
    } finally {
      setTimeout(() => setIsTestingVibration(false), 1000)
    }
  }

  const installPWA = async () => {
    if (installPrompt) {
      const result = await installPrompt.prompt()
      addResult(`💾 Install result: ${result.outcome}`)
      setInstallPrompt(null)
    } else if (deviceInfo.isIOS && !deviceInfo.isStandalone) {
      addResult('🍎 iOS Installation Instructions:')
      addResult('1. กด Share button ใน Safari')
      addResult('2. เลือก "Add to Home Screen"')
      addResult('3. กด "Add" เพื่อติดตั้ง PWA')
    } else {
      addResult('❌ Installation not available')
    }
  }

  const runAllPWATests = async () => {
    clearResults()
    addResult('🚀 Starting PWA Tests...')
    
    testIOSSpecific()
    await testServiceWorker()
    await testOfflineCapability()
    
    addResult('🏁 PWA tests completed!')
  }

  const runAllNotificationTests = async () => {
    clearResults()
    addResult('🔔 Starting Notification Tests...')
    
    await testNotifications()
    await testAudio()
    await testAudioDirect()
    testVibration()
    
    addResult('🏁 Notification tests completed!')
  }

  const renderPWATests = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-indigo-800 mb-4">🧪 PWA Feature Tests</h3>
      
      {/* Device Info */}
      <div className="bg-gray-50 rounded-2xl p-4">
        <h4 className="font-bold text-gray-800 mb-2">📱 Device Information</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <p><strong>iOS:</strong> {deviceInfo.isIOS ? '✅' : '❌'}</p>
          <p><strong>Standalone:</strong> {deviceInfo.isStandalone ? '✅' : '❌'}</p>
          <p><strong>Safari:</strong> {deviceInfo.isSafari ? '✅' : '❌'}</p>
          <p><strong>Service Worker:</strong> {deviceInfo.serviceWorkerSupport ? '✅' : '❌'}</p>
          <p><strong>Notifications:</strong> {deviceInfo.notificationSupport ? '✅' : '❌'}</p>
          <p><strong>Cache API:</strong> {deviceInfo.cacheSupport ? '✅' : '❌'}</p>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={runAllPWATests}
          className="col-span-2 bg-indigo-600 text-white rounded-xl p-3 font-semibold text-sm"
        >
          🚀 Run All PWA Tests
        </button>
        
        <button
          onClick={testServiceWorker}
          className="bg-blue-500 text-white rounded-xl p-2 text-xs font-medium"
        >
          🔧 Service Worker
        </button>
        
        <button
          onClick={testOfflineCapability}
          className="bg-purple-500 text-white rounded-xl p-2 text-xs font-medium"
        >
          📶 Offline Test
        </button>
        
        <button
          onClick={testIOSSpecific}
          className="bg-pink-500 text-white rounded-xl p-2 text-xs font-medium"
        >
          🍎 iOS Features
        </button>
        
        <button
          onClick={installPWA}
          className="bg-green-500 text-white rounded-xl p-2 text-xs font-medium"
        >
          💾 Install PWA
        </button>
      </div>
    </div>
  )

  const renderNotificationTests = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-indigo-800 mb-4">🔔 Notification & Audio Tests</h3>
      
      {/* Quick Status */}
      <div className="bg-gray-50 rounded-2xl p-4">
        <h4 className="font-bold text-gray-800 mb-2">📊 Feature Support</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <p><strong>Notifications:</strong> {deviceInfo.notificationSupport ? '✅' : '❌'}</p>
          <p><strong>Push:</strong> {deviceInfo.pushSupport ? '✅' : '❌'}</p>
          <p><strong>Vibration:</strong> {deviceInfo.vibrationSupport ? '✅' : '❌'}</p>
          <p><strong>Audio:</strong> {deviceInfo.audioSupport ? '✅' : '❌'}</p>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={runAllNotificationTests}
          className="col-span-2 bg-green-600 text-white rounded-xl p-3 font-semibold text-sm"
        >
          🔔 Run All Notification Tests
        </button>
        
        <button
          onClick={testNotifications}
          disabled={isTestingNotification}
          className="bg-blue-500 text-white rounded-xl p-2 text-xs font-medium disabled:opacity-50"
        >
          {isTestingNotification ? '⏳ Testing...' : '🔔 Notifications'}
        </button>
        
        <button
          onClick={testAudio}
          disabled={isTestingAudio}
          className="bg-yellow-500 text-white rounded-xl p-2 text-xs font-medium disabled:opacity-50"
        >
          {isTestingAudio ? '⏳ Testing...' : '🔊 Audio'}
        </button>
        
        <button
          onClick={testAudioDirect}
          className="bg-orange-500 text-white rounded-xl p-2 text-xs font-medium"
        >
          🎼 Direct Audio
        </button>
        
        <button
          onClick={testVibration}
          disabled={isTestingVibration}
          className="bg-purple-500 text-white rounded-xl p-2 text-xs font-medium disabled:opacity-50"
        >
          {isTestingVibration ? '⏳ Testing...' : '📳 Vibration'}
        </button>
        
        <button
          onClick={clearResults}
          className="bg-gray-500 text-white rounded-xl p-2 text-xs font-medium"
        >
          🗑️ Clear Results
        </button>
      </div>

      {/* iOS Audio Warning */}
      {deviceInfo.isIOS && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mt-4">
          <div className="flex items-start gap-2">
            <span className="text-yellow-500 text-lg">⚠️</span>
            <div className="text-xs text-yellow-800">
              <p className="font-semibold mb-1">สำหรับ iOS:</p>
              <p>เสียงต้องการการกดปุ่มของผู้ใช้ก่อน กรุณากดปุ่มทดสอบเสียงเพื่อเปิดใช้งาน</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-indigo-800 mb-2">
              🧪 ทดสอบแอพ CareClock
            </h1>
            <p className="text-gray-600 text-sm">
              ทดสอบการทำงานของ PWA และ Notifications
            </p>
          </div>

          {/* Back Button */}
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl p-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mb-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>🏠 กลับไปหน้าแรก</span>
          </button>

          {/* Test Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
            <button
              onClick={() => setActiveTestTab('pwa')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                activeTestTab === 'pwa' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-600'
              }`}
            >
              🧪 PWA Tests
            </button>
            <button
              onClick={() => setActiveTestTab('notification')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                activeTestTab === 'notification' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-600'
              }`}
            >
              🔔 Notifications
            </button>
          </div>

          {/* Test Content */}
          {activeTestTab === 'pwa' && renderPWATests()}
          {activeTestTab === 'notification' && renderNotificationTests()}
        </div>

        {/* Test Results */}
        <div className="bg-white rounded-3xl shadow-xl p-6">
          <h3 className="font-bold text-indigo-800 mb-3">📋 Test Results</h3>
          <div className="bg-gray-900 text-green-400 rounded-2xl p-4 h-64 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">เลือกการทดสอบเพื่อดูผล...</p>
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
        <div className="bg-white rounded-3xl shadow-xl p-6 mt-6">
          <h3 className="font-bold text-indigo-800 mb-3">📖 คำแนะนำการทดสอบ</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <h4 className="font-semibold text-indigo-600">🍎 สำหรับ iOS:</h4>
              <ul className="list-disc list-inside ml-2 space-y-1 text-xs">
                <li>ใช้ Safari เท่านั้น</li>
                <li>ทดสอบบนอุปกรณ์จริง (ไม่ใช่ simulator)</li>
                <li>อนุญาต Notifications ในการตั้งค่า</li>
                <li>ติดตั้งแอพก่อนทดสอบ</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-green-600">✅ สิ่งที่ควรทำงาน:</h4>
              <ul className="list-disc list-inside ml-2 space-y-1 text-xs">
                <li>Service Worker registration</li>
                <li>Offline functionality</li>
                <li>Basic notifications</li>
                <li>Audio playback (หลัง user interaction)</li>
                <li>Vibration (บนอุปกรณ์จริง)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
