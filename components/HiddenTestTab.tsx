'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HiddenTestTab() {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(false)

  const goToTestPage = () => {
    router.push('/test/app-test')
    setIsExpanded(false)
  }

  return (
    <div className="fixed right-0 bottom-24 z-[60]">
      {/* Hidden Tab */}
      <div 
        className={`transition-all duration-300 ease-in-out ${
          isExpanded ? 'translate-x-0' : 'translate-x-[calc(100%-12px)]'
        }`}
      >
        <div className="bg-gray-300/80 hover:bg-gray-400/80 text-gray-600 rounded-l-sm shadow-sm hover:shadow-md transition-all duration-300">
          {/* Tab Content */}
          <div className="flex items-center">
            {/* Expandable Content */}
            <div 
              className={`transition-all duration-300 overflow-hidden ${
                isExpanded ? 'w-16 opacity-100' : 'w-0 opacity-0'
              }`}
            >
              <div className="px-1.5 py-1">
                <button
                  onClick={goToTestPage}
                  className="text-xs bg-white/50 hover:bg-white/70 px-1.5 py-0.5 rounded transition-colors w-full text-center text-gray-700"
                >
                  ทดสอบ
                </button>
              </div>
            </div>
            
            {/* Toggle Button - ส่วนที่จะแสดงเสมอ */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-0.5 py-1.5 hover:bg-gray-500/20 transition-all duration-300 rounded-l-sm flex items-center justify-center min-w-[12px] min-h-[24px]"
              title={isExpanded ? 'ซ่อน' : 'ทดสอบ'}
            >
              <div className="text-[10px] font-normal text-gray-500">
                {isExpanded ? '>' : '<'}
              </div>
            </button>
          </div>
        </div>
      </div>
      
      {/* Backdrop overlay when expanded */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/5 -z-10"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  )
}
