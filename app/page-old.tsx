'use client'

import { useEffect, useState } from 'react'
import { localStorageService } from '@/lib/localStorage'

export default function Home() {
  const [isOnline, setIsOnline] = useState(true)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [dbStatus, setDbStatus] = useState<string>('ยังไม่ได้ทดสอบ')
  const [dbTesting, setDbTesting] = useState(false)

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine)
    
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Load data from localStorage
    const savedData = localStorageService.getItem('app-data')
    if (savedData) {
      setData(savedData)
    }
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleSaveData = () => {
    const newData = {
      timestamp: new Date().toISOString(),
      message: 'สวัสดี! นี่คือ PWA ของคุณ',
      count: (data?.count || 0) + 1
    }
    
    setData(newData)
    localStorageService.setItem('app-data', newData)
  }

  const handleLoadFromServer = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      const serverData = {
        timestamp: new Date().toISOString(),
        message: 'ข้อมูลจากเซิร์ฟเวอร์',
        serverSync: true
      }
      setData(serverData)
      localStorageService.setItem('server-data', serverData)
    } catch (error) {
      console.error('Error loading from server:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTestDatabase = async () => {
    setDbTesting(true)
    try {
      const response = await fetch('/api/test-db')
      const result = await response.json()
      
      if (result.success) {
        setDbStatus(`✅ เชื่อมต่อสำเร็จ (${result.collections.length} collections)`)
        setData({
          ...data,
          dbTest: result
        })
      } else {
        setDbStatus(`❌ เชื่อมต่อไม่สำเร็จ: ${result.error}`)
      }
    } catch (error) {
      setDbStatus(`❌ ข้อผิดพลาด: ${error}`)
    } finally {
      setDbTesting(false)
    }
  }

  const handleSaveToDatabase = async () => {
    setLoading(true)
    try {
      const testData = {
        message: 'ทดสอบบันทึกข้อมูลจาก PWA',
        timestamp: new Date().toISOString(),
        type: 'test-data',
        count: (data?.count || 0) + 1
      }

      const response = await fetch('/api/test-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      })

      const result = await response.json()
      
      if (result.success) {
        setData({
          ...testData,
          savedToDb: result
        })
        localStorageService.setItem('last-db-save', result)
      } else {
        console.error('Database save failed:', result.error)
      }
    } catch (error) {
      console.error('Error saving to database:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pwa-container safe-area-top safe-area-bottom">
      {/* Header */}
      <header className="bg-white shadow-sm border-b p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">CareClockPWA</h1>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4">
        <div className="card mb-4">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            ยินดีต้อนรับสู่ PWA ของคุณ
          </h2>
          <p className="text-gray-600 mb-4">
            แอพนี้ถูกออกแบบมาเพื่อการใช้งานบนมือถือเป็นหลัก 
            รองรับการทำงานแบบออฟไลน์และ LocalStorage
          </p>
          
          {/* Feature Cards */}
          <div className="grid grid-1 gap-4 mb-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">📱 Mobile-First Design</h3>
              <p className="text-blue-600 text-sm">ออกแบบมาเพื่อมือถือเป็นหลัก</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800 mb-2">💾 LocalStorage</h3>
              <p className="text-green-600 text-sm">เก็บข้อมูลในเครื่องได้</p>
            </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-800 mb-2">🔄 Offline Support</h3>
              <p className="text-purple-600 text-sm">ใช้งานได้แม้ไม่มีอินเทอร์เน็ต</p>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h3 className="font-semibold text-orange-800 mb-2">🗄️ MongoDB Atlas</h3>
              <p className="text-orange-600 text-sm">เชื่อมต่อฐานข้อมูลคลาวด์</p>
              <p className="text-xs text-orange-500 mt-1">สถานะ: {dbStatus}</p>
            </div>
          </div>

          {/* Data Display */}
          {data && (
            <div className="p-4 bg-gray-50 rounded-lg mb-4">
              <h3 className="font-semibold mb-2">ข้อมูลที่บันทึก:</h3>
              <pre className="text-sm text-gray-700 bg-white p-2 rounded border overflow-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}          {/* Action Buttons */}
          <div className="grid grid-1 gap-3">
            <button 
              onClick={handleTestDatabase}
              disabled={dbTesting}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {dbTesting ? (
                <span className="flex items-center justify-center">
                  <div className="spinner mr-2"></div>
                  กำลังทดสอบ MongoDB...
                </span>
              ) : (
                '🗄️ ทดสอบการเชื่อมต่อ MongoDB Atlas'
              )}
            </button>

            <button 
              onClick={handleSaveData}
              className="btn-primary w-full"
            >
              💾 บันทึกข้อมูลใน LocalStorage
            </button>

            <button 
              onClick={handleSaveToDatabase}
              disabled={loading || !isOnline}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="spinner mr-2"></div>
                  กำลังบันทึกใน DB...
                </span>
              ) : (
                '☁️ บันทึกข้อมูลใน MongoDB Atlas'
              )}
            </button>
            
            <button 
              onClick={handleLoadFromServer}
              disabled={loading || !isOnline}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="spinner mr-2"></div>
                  กำลังโหลด...
                </span>
              ) : (
                '🌐 โหลดข้อมูลจากเซิร์ฟเวอร์'
              )}
            </button>

            {/* Database Test & Save Buttons */}
            <div className="grid grid-1 gap-3">
              <button 
                onClick={handleTestDatabase}
                disabled={dbTesting}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {dbTesting ? (
                  <span className="flex items-center justify-center">
                    <div className="spinner mr-2"></div>
                    กำลังทดสอบ...
                  </span>
                ) : (
                  '🛠️ ทดสอบการเชื่อมต่อฐานข้อมูล'
                )}
              </button>
              
              <button 
                onClick={handleSaveToDatabase}
                disabled={loading || !data}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="spinner mr-2"></div>
                    กำลังบันทึก...
                  </span>
                ) : (
                  '💾 บันทึกข้อมูลลงฐานข้อมูล'
                )}
              </button>
            </div>

            {/* Database Status Display */}
            <div className="p-4 bg-gray-50 rounded-lg mb-4">
              <h3 className="font-semibold mb-2">สถานะการเชื่อมต่อฐานข้อมูล:</h3>
              <p className="text-sm text-gray-700">
                {dbStatus}
              </p>
            </div>
          </div>
        </div>

        {/* PWA Info */}
        <div className="card">
          <h3 className="font-semibold mb-2">📋 ข้อมูล PWA</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• สามารถติดตั้งเป็นแอพได้</p>
            <p>• ทำงานแบบออฟไลน์</p>
            <p>• เหมาะสำหรับมือถือ</p>
            <p>• เชื่อมต่อ MongoDB ได้</p>
            <p>• ใช้ LocalStorage ในการเก็บข้อมูล</p>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className="mobile-nav">
        <div className="flex justify-around items-center py-2">
          <button className="flex flex-col items-center p-2 text-blue-600">
            <span className="text-lg">🏠</span>
            <span className="text-xs">หน้าแรก</span>
          </button>
          <button className="flex flex-col items-center p-2 text-gray-400">
            <span className="text-lg">📊</span>
            <span className="text-xs">ข้อมูล</span>
          </button>
          <button className="flex flex-col items-center p-2 text-gray-400">
            <span className="text-lg">⚙️</span>
            <span className="text-xs">ตั้งค่า</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
