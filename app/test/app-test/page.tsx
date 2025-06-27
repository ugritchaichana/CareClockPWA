'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { notificationManager } from '../../../lib/notificationManager'
import NotificationModal, { NotificationModalData } from '../../../components/NotificationModal'

export default function AppTestPage() {
  const router = useRouter()
  const [testResults, setTestResults] = useState<string[]>([])
  
  // NotificationModal states
  const [showTestModal, setShowTestModal] = useState(false)
  const [testModalData, setTestModalData] = useState<NotificationModalData | null>(null)

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  const clearResults = () => {
    setTestResults([])
  }

  // Test notification modal
  const testNotificationModal = async () => {
    try {
      addResult('🔔 Testing Notification Modal...')
      
      const testData: NotificationModalData = {
        medicineId: 1,
        medicineName: 'ยาทดสอบ (Test Medicine)',
        dosage: 2,
        medicineImageUrl: '/asset/CareClockLOGO.PNG',
        title: 'ทดสอบการแจ้งเตือน',
        message: 'นี่คือการทดสอบ NotificationModal สำหรับระบบแจ้งเตือนกินยา',
        timeType: 'morning',
        scheduledTime: new Date().toISOString()
      }
      
      setTestModalData(testData)
      setShowTestModal(true)
      
      addResult('✅ Test modal opened successfully')
      addResult('📋 Medicine: ยาทดสอบ (Test Medicine)')
      addResult('💊 Dosage: 2 เม็ด')
      addResult('⏰ Time: เช้า (morning)')
      addResult('🔊 Sound and vibration should be playing')
      
    } catch (error) {
      addResult(`❌ Modal test error: ${error}`)
    }
  }

  // Handle test modal actions
  const handleTestModalTake = () => {
    addResult('✅ Test: User selected "กินยาแล้ว"')
    setShowTestModal(false)
    setTestModalData(null)
  }

  const handleTestModalSkip = () => {
    addResult('⏭️ Test: User selected "ข้ามการกินยา"')
    setShowTestModal(false)
    setTestModalData(null)
  }

  const handleTestModalDismiss = () => {
    addResult('❌ Test: User dismissed modal')
    setShowTestModal(false)
    setTestModalData(null)
  }

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
            className="w-full bg-gray-500 text-white rounded-xl p-3 font-semibold text-sm hover:bg-gray-600 transition-colors"
          >
            🏠 กลับหน้าหลัก
          </button>
        </div>

        {/* Test Notification Modal Button */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">🔔 ทดสอบ NotificationModal</h3>
          <button
            onClick={testNotificationModal}
            className="w-full bg-red-600 text-white rounded-xl p-4 font-semibold text-lg hover:bg-red-700 transition-all duration-300 transform active:scale-95"
          >
            🔔 เปิดทดสอบ Modal แจ้งเตือน
          </button>
        </div>

        {/* Test Results */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">📊 Test Results</h3>
            <button
              onClick={clearResults}
              className="text-xs bg-gray-500 text-white px-3 py-1 rounded-lg hover:bg-gray-600 transition-colors"
            >
              🗑️ Clear
            </button>
          </div>
          
          <div className="bg-gray-900 text-green-400 rounded-2xl p-4 max-h-64 overflow-y-auto font-mono text-xs">
            {testResults.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No tests run yet...</p>
            ) : (
              testResults.map((result, index) => (
                <p key={index} className="mb-1 leading-relaxed">
                  {result}
                </p>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-3xl shadow-xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📖 คำแนะนำการทดสอบ Modal</h3>
          <div className="space-y-3 text-sm">
            <div>
              <h4 className="font-semibold text-blue-600">🔔 ทดสอบ NotificationModal:</h4>
              <ul className="list-disc list-inside ml-2 space-y-1 text-xs">
                <li>กดปุ่ม "เปิดทดสอบ Modal แจ้งเตือน"</li>
                <li>Modal จะเด้งขึ้นพร้อมเสียงแจ้งเตือน</li>
                <li>ทดสอบการสั่น (บนมือถือ)</li>
                <li>ทดสอบปุ่ม "กินยาแล้ว", "ข้าม", "ปิด"</li>
                <li>ดู countdown timer 5 นาที</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-yellow-600">⚠️ หมายเหตุ iOS:</h4>
              <ul className="list-disc list-inside ml-2 space-y-1 text-xs">
                <li>เสียงต้องมี user interaction ก่อน</li>
                <li>การสั่นอาจไม่ทำงานใน browser</li>
                <li>ใช้ Safari สำหรับผลลัพธ์ที่ดีที่สุด</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-green-600">✅ ฟีเจอร์ที่ควรทำงาน:</h4>
              <ul className="list-disc list-inside ml-2 space-y-1 text-xs">
                <li>Modal แสดงขึ้นกลางหน้าจอ</li>
                <li>เสียงปลุกเล่นต่อเนื่อง (หลัง user interaction)</li>
                <li>การสั่นทุก 30 วินาที</li>
                <li>Countdown timer 5 นาที</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Access to Notification Page */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mt-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">🔗 ลิงก์เร็ว</h3>
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => router.push('/page/notification')}
              className="bg-blue-500 text-white rounded-xl p-3 font-semibold text-sm hover:bg-blue-600 transition-colors"
            >
              📋 ไปหน้าการแจ้งเตือน
            </button>
            <button
              onClick={() => router.push('/page/medicine')}
              className="bg-green-500 text-white rounded-xl p-3 font-semibold text-sm hover:bg-green-600 transition-colors"
            >
              💊 ไปหน้าจัดการยา
            </button>
            <button
              onClick={() => router.push('/')}
              className="bg-purple-500 text-white rounded-xl p-3 font-semibold text-sm hover:bg-purple-600 transition-colors"
            >
              🏠 กลับหน้าหลัก
            </button>
          </div>
        </div>
      </div>
      
      {/* Test NotificationModal */}
      <NotificationModal
        isOpen={showTestModal}
        data={testModalData}
        onTake={handleTestModalTake}
        onSkip={handleTestModalSkip}
        onDismiss={handleTestModalDismiss}
        soundEnabled={true}
        vibrationEnabled={true}
      />
    </div>
  )
}