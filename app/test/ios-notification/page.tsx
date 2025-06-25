// iOS Notification Test Page
'use client'

import { useState } from 'react'
import { notificationManager } from '../../../lib/notificationManager'

export default function IOSNotificationTest() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [isTestingAudio, setIsTestingAudio] = useState(false)
  const [isTestingVibration, setIsTestingVibration] = useState(false)
  const [isTestingNotification, setIsTestingNotification] = useState(false)

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  const testAudio = async () => {
    setIsTestingAudio(true)
    addResult('🔊 เริ่มทดสอบเสียง...')
    
    try {
      // Initialize audio with user interaction
      await notificationManager.initializeAudioWithUserInteraction()
      addResult('✅ เสียงเริ่มต้นสำเร็จ')
      
      // Create test notification to trigger sound
      const testNotification = {
        id: 'test-audio',
        medicineId: 1,
        medicineName: 'ทดสอบ',
        title: 'ทดสอบเสียง',
        message: 'ทดสอบเสียงแจ้งเตือน',
        scheduledTime: new Date().toTimeString().substring(0, 5),
        timeType: 'test',
        isActive: true,
        dosage: 1,
        soundEnabled: true,
        vibrationEnabled: false
      }
      
      notificationManager.addNotification(testNotification)
      addResult('🎵 เล่นเสียงทดสอบ')
      
      setTimeout(() => {
        notificationManager.removeNotification('test-audio')
        addResult('🔇 หยุดเสียงทดสอบ')
      }, 3000)
      
    } catch (error) {
      addResult(`❌ เสียงล้มเหลว: ${error}`)
    } finally {
      setIsTestingAudio(false)
    }
  }

  const testVibration = () => {
    setIsTestingVibration(true)
    addResult('📳 เริ่มทดสอบการสั่น...')
    
    try {
      if ('vibrate' in navigator) {
        // iOS-compatible vibration pattern
        const pattern = [200, 100, 200, 100, 200]
        navigator.vibrate(pattern)
        addResult('✅ การสั่นทำงาน')
        
        // Test again after 2 seconds
        setTimeout(() => {
          navigator.vibrate([300, 150, 300])
          addResult('🔄 การสั่นครั้งที่ 2')
        }, 2000)
      } else {
        addResult('❌ เบราว์เซอร์ไม่รองรับการสั่น')
      }
    } catch (error) {
      addResult(`❌ การสั่นล้มเหลว: ${error}`)
    } finally {
      setTimeout(() => setIsTestingVibration(false), 3000)
    }
  }

  const testNotification = async () => {
    setIsTestingNotification(true)
    addResult('🔔 เริ่มทดสอบการแจ้งเตือน...')
    
    try {
      // Request permission
      const hasPermission = await notificationManager.requestNotificationPermission()
      
      if (!hasPermission) {
        addResult('❌ ไม่ได้รับอนุญาตการแจ้งเตือน')
        setIsTestingNotification(false)
        return
      }
      
      addResult('✅ ได้รับอนุญาตการแจ้งเตือนแล้ว')
      
      // Show test notification
      const notificationOptions: NotificationOptions = {
        body: 'ทดสอบการแจ้งเตือนบน iOS พร้อมเสียงและการสั่น',
        icon: '/asset/CareClockLOGO.PNG',
        badge: '/asset/CareClockLOGO.PNG',
        tag: 'ios-test',
        requireInteraction: true,
        silent: false, // Enable sound
      }

      // Add vibration for supported browsers
      if ('vibrate' in navigator) {
        (notificationOptions as any).vibrate = [200, 100, 200, 100, 200]
      }

      const testNotif = new Notification('CareClock - ทดสอบ iOS', notificationOptions)
      
      addResult('🎯 แสดงการแจ้งเตือนทดสอบ')
      
      testNotif.onclick = () => {
        addResult('👆 คลิกการแจ้งเตือน')
        testNotif.close()
      }
      
      // Auto close after 10 seconds
      setTimeout(() => {
        testNotif.close()
        addResult('⏰ ปิดการแจ้งเตือนอัตโนมัติ')
      }, 10000)
      
    } catch (error) {
      addResult(`❌ การแจ้งเตือนล้มเหลว: ${error}`)
    } finally {
      setIsTestingNotification(false)
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  const checkPlatform = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const userAgent = navigator.userAgent
    const platform = navigator.platform
    
    addResult(`📱 Platform: ${platform}`)
    addResult(`🌐 User Agent: ${userAgent}`)
    addResult(`🍎 Is iOS: ${isIOS ? 'Yes' : 'No'}`)
    addResult(`🔔 Notification Support: ${'Notification' in window ? 'Yes' : 'No'}`)
    addResult(`📳 Vibration Support: ${'vibrate' in navigator ? 'Yes' : 'No'}`)
    addResult(`🎵 Audio Context Support: ${'AudioContext' in window || 'webkitAudioContext' in window ? 'Yes' : 'No'}`)
    addResult(`🔐 Notification Permission: ${Notification.permission}`)
  }

  return (
    <div className="container mx-auto max-w-2xl p-6">
      {/* Back to Home Button */}
      <div className="mb-6">
        <button
          onClick={() => window.location.href = '/'}
          className="bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl px-4 py-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>🏠 กลับไปหน้าแรก</span>
        </button>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          ทดสอบ Notification สำหรับ iOS
        </h1>
        <p className="text-gray-600">
          ทดสอบฟีเจอร์เสียง การสั่น และการแจ้งเตือนบนอุปกรณ์ iOS
        </p>
      </div>

      {/* Test Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={checkPlatform}
          className="btn btn-info text-white"
        >
          📱 ตรวจสอบแพลตฟอร์ม
        </button>
        
        <button
          onClick={testAudio}
          disabled={isTestingAudio}
          className="btn btn-primary text-white"
        >
          {isTestingAudio ? '🔊 กำลังทดสอบ...' : '🔊 ทดสอบเสียง'}
        </button>
        
        <button
          onClick={testVibration}
          disabled={isTestingVibration}
          className="btn btn-secondary text-white"
        >
          {isTestingVibration ? '📳 กำลังสั่น...' : '📳 ทดสอบการสั่น'}
        </button>
        
        <button
          onClick={testNotification}
          disabled={isTestingNotification}
          className="btn btn-success text-white"
        >
          {isTestingNotification ? '🔔 กำลังทดสอบ...' : '🔔 ทดสอบการแจ้งเตือน'}
        </button>
      </div>

      {/* Clear Results Button */}
      <div className="text-center mb-6">
        <button
          onClick={clearResults}
          className="btn btn-outline btn-sm"
        >
          🗑️ ล้างผลลัพธ์
        </button>
      </div>

      {/* Test Results */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">📋 ผลการทดสอบ</h2>
          
          {testResults.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              ยังไม่มีผลการทดสอบ กดปุ่มเพื่อเริ่มทดสอบ
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded-lg text-sm font-mono"
                >
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 alert alert-info">
        <div>
          <h3 className="font-bold">💡 คำแนะนำสำหรับ iOS:</h3>
          <ul className="list-disc list-inside text-sm mt-2 space-y-1">
            <li>กดปุ่ม "ตรวจสอบแพลตฟอร์ม" ก่อนเพื่อดูข้อมูลระบบ</li>
            <li>สำหรับ iOS ต้องมี user interaction ก่อนเล่นเสียง</li>
            <li>การสั่นจะทำงานบน iPhone (ไม่ใช่ iPad)</li>
            <li>การแจ้งเตือนต้องได้รับอนุญาตจากผู้ใช้ก่อน</li>
            <li>ถ้าเป็น iOS Safari ลองเพิ่มเว็บไซต์ลง Home Screen</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
