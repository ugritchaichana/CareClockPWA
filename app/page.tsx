'use client'

import { useEffect, useState } from 'react'
import BottomNav from '@/components/BottomNav'
import Welcome from './page/welcome/welcome'
import UserInfo from './page/userinfo/userinfo'
import Medicine from './page/medicine/medicine'
import Notification from './page/notification/notification'
import Summary from './page/summary/summary'
import { localStorageService } from '../lib/localStorage'

interface PatientData {
  prefix: string
  firstName: string
  lastName: string
  age: number
  phoneNumber: string
  medicalRight: string
  chronicDiseases: string
  profileImage: string
  registeredAt: string
}

export default function Home() {
  const [isOnline, setIsOnline] = useState(true)
  const [activeTab, setActiveTab] = useState('welcome')
  const [patientData, setPatientData] = useState<PatientData | null>(null)

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine)
    
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Load patient data
    const savedData = localStorageService.getItem<PatientData>('patient-data')
    if (savedData) {
      setPatientData(savedData)
    }

    // Listen for storage changes (when user data is updated)
    const handleStorageChange = () => {
      const updatedData = localStorageService.getItem<PatientData>('patient-data')
      setPatientData(updatedData)
    }

    // Check for data changes periodically
    const interval = setInterval(handleStorageChange, 1000)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])
  const renderContent = () => {
    switch (activeTab) {
      case 'welcome':
        return <Welcome onTabChange={setActiveTab} />
      case 'userinfo':
        return <UserInfo />
      case 'medicine':
        return <Medicine />
      case 'notification':
        return <Notification />
      case 'summary':
        return <Summary />
      default:
        return <Welcome onTabChange={setActiveTab} />
    }
  }
  const getPageTitle = () => {
    switch (activeTab) {
      case 'welcome':
        return 'CareClock'
      case 'userinfo':
        return 'ข้อมูลผู้ใช้'
      case 'medicine':
        return 'ยาของคุณ'
      case 'notification':
        return 'การแจ้งเตือน'
      case 'summary':
        return 'สรุปรายการ'
      default:
        return 'CareClock'
    }
  }
  
  return (
    <div className="min-h-screen max-h-screen overflow-hidden flex flex-col" style={{ background: 'linear-gradient(135deg, #FFF6F6 0%, #FFDFDF 50%, #AEDEFC 100%)' }}>
      {/* Header */}
      <div className="navbar bg-white/80 backdrop-blur-sm shadow-sm" style={{ borderBottom: '1px solid #FFDFDF' }}>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-xl font-bold text-gray-700">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg, #FB929E, #AEDEFC)' }}>
              <span className="text-white text-sm">💊</span>
            </div>
            {getPageTitle()}
          </div>        </div>
        {/* User Profile with Online/Offline Status */}
        <div className="flex-none">
          <div className="relative">
            {/* Profile Avatar */}
            <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-md border-2 border-white" style={{
              background: patientData?.profileImage ? 'none' : 'linear-gradient(to-br, #FB929E, #AEDEFC)'
            }}>
              {patientData?.profileImage ? (
                <img 
                  src={patientData.profileImage} 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-lg">👤</span>
              )}
            </div>
            {/* Online/Offline Status Indicator */}
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderContent()}
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
