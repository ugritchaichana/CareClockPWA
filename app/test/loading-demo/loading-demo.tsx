'use client'

import { useState } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'
import LoadingButton from '@/components/LoadingButton'

export default function LoadingDemo() {
  const [isLoading, setIsLoading] = useState(false)

  const handleTest = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          🎨 Loading Animation Demo
        </h1>

        {/* LoadingSpinner Examples */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* White Spinners */}
          <div className="bg-gradient-to-r from-pink-400 to-blue-400 rounded-2xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-4">White Spinners</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm mb-2">Small</p>
                <LoadingSpinner size="sm" color="white" />
              </div>
              <div>
                <p className="text-sm mb-2">Medium</p>
                <LoadingSpinner size="md" color="white" />
              </div>
              <div>
                <p className="text-sm mb-2">Large</p>
                <LoadingSpinner size="lg" color="white" />
              </div>
            </div>
          </div>

          {/* Primary Spinners */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-pink-100">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Primary Spinners</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm mb-2 text-gray-600">Small</p>
                <LoadingSpinner size="sm" color="primary" />
              </div>
              <div>
                <p className="text-sm mb-2 text-gray-600">Medium</p>
                <LoadingSpinner size="md" color="primary" />
              </div>
              <div>
                <p className="text-sm mb-2 text-gray-600">Large</p>
                <LoadingSpinner size="lg" color="primary" />
              </div>
            </div>
          </div>

          {/* Color Variants */}
          <div className="bg-gray-50 rounded-2xl p-6 shadow-lg border-2 border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Color Variants</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm mb-2 text-gray-600">Pink</p>
                <LoadingSpinner size="md" color="pink" />
              </div>
              <div>
                <p className="text-sm mb-2 text-gray-600">Blue</p>
                <LoadingSpinner size="md" color="blue" />
              </div>
              <div>
                <p className="text-sm mb-2 text-gray-600">Gray</p>
                <LoadingSpinner size="md" color="gray" />
              </div>
            </div>
          </div>
        </div>

        {/* LoadingButton Examples */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-pink-100 mb-8">
          <h3 className="text-2xl font-semibold mb-6 text-gray-800">Loading Button Examples</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <LoadingButton
                isLoading={isLoading}
                onClick={handleTest}
                size="lg"
                style={{
                  background: 'linear-gradient(135deg, #FB929E, #AEDEFC)',
                  border: 'none'
                }}
                loadingText="กำลังประมวลผล..."
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                }
              >
                ทดสอบปุ่มโหลด
              </LoadingButton>

              <LoadingButton
                isLoading={isLoading}
                onClick={handleTest}
                variant="outline"
                size="md"
                loadingText="กำลังบันทึก..."
              >
                ปุ่มแบบ Outline
              </LoadingButton>

              <LoadingButton
                isLoading={isLoading}
                onClick={handleTest}
                variant="ghost"
                size="sm"
                loadingText="กำลังส่ง..."
              >
                ปุ่มแบบ Ghost
              </LoadingButton>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-blue-50 rounded-xl p-6">
              <h4 className="font-semibold mb-4 text-gray-700">การใช้งาน:</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• 🟡 วงกลม 3 ลูกแสดงการโหลด</li>
                <li>• 🎯 ปรับสีตามพื้นหลัง</li>
                <li>• 📏 ขนาดที่หลากหลาย (sm, md, lg)</li>
                <li>• ⚡ Animation ที่นุ่มนวล</li>
                <li>• 🎨 รองรับหลายสี</li>
                <li>• 🔄 ใช้ซ้ำได้ทั้งโปรเจ็ค</li>
                <li>• ✨ ตัวหนังสือชัดเจน มี font-weight และ drop-shadow</li>
                <li>• 🌟 ใช้ text-gray-700 แทน text-gray-500 เพื่อความชัด</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Usage Guide */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 shadow-lg border-2 border-green-200">
          <h3 className="text-2xl font-semibold mb-4 text-gray-800">📚 วิธีการใช้งาน</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2 text-gray-700">LoadingSpinner</h4>
              <div className="bg-gray-100 rounded-lg p-4 text-sm font-mono">
                {'<LoadingSpinner size="lg" color="primary" />'}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-gray-700">LoadingButton</h4>
              <div className="bg-gray-100 rounded-lg p-4 text-sm font-mono">
                {'<LoadingButton isLoading={loading} loadingText="กำลังบันทึก...">บันทึก</LoadingButton>'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
