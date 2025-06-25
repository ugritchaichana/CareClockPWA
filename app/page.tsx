'use client'
import { useEffect, useState } from 'react'
import BottomNav from '@/components/BottomNav'
import HiddenTestTab from '@/components/HiddenTestTab'
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
  chronicDiseases: string | null
  drugAllergy: string | null
  profileImageUrl: string | null
  registeredAt?: string
}

export default function Home() {
  const [isOnline, setIsOnline] = useState(true)
  const [activeTab, setActiveTab] = useState('welcome')
  const [patientData, setPatientData] = useState<PatientData | null>(null)
  const [dataSource, setDataSource] = useState<'database' | 'loading' | 'offline' | null>(null)

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine)
    
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)    // Load patient data
    const savedData = localStorageService.getItem<PatientData>('patient-data')
    if (savedData) {
      setPatientData(savedData)
      setDataSource('loading') // Set loading state initially
      
      // Check if data exists in database
      if (savedData.phoneNumber) {
        fetch(`/api/data?type=patient-data&phoneNumber=${savedData.phoneNumber}`)
          .then(response => {
            if (response.ok) {
              return response.json()
            }
            throw new Error('Patient not found in database')
          })
          .then(result => {
            setDataSource('database') // Successfully got data from server
            // Update if data is different
            if (JSON.stringify(result.data) !== JSON.stringify(savedData)) {
              setPatientData(result.data)
              localStorageService.setItem('patient-data', result.data)
            }
          })
          .catch(error => {
            console.log('Database sync failed, using localStorage')
            setDataSource(isOnline ? 'offline' : 'offline') // Failed to get data or offline
          })
      } else {
        setDataSource('offline') // No phone number to check against database
      }
    }    // Listen for storage changes (when user data is updated)
    const handleStorageChange = () => {
      const updatedData = localStorageService.getItem<PatientData>('patient-data')
      setPatientData(updatedData)
      if (!updatedData) {
        setDataSource(null)
      }
    }

    // Check for data changes periodically (only for updates, not server sync)
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
            {/* <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg, #FB929E, #AEDEFC)' }}>
              <span className="text-white text-sm">
                <img src='https://fcktqdzssxqvuzgdlemo.supabase.co/storage/v1/object/public/app-image//CareClockLOGO.PNG' />
              </span>
            </div> */}
            <div className="w-9 h-9">
              <img 
                src='https://fcktqdzssxqvuzgdlemo.supabase.co/storage/v1/object/public/app-image//CareClockLOGO.PNG' 
                alt="CareClock Logo"
                className="w-full h-full object-contain select-none"
                onDragStart={(e) => e.preventDefault()}
              />
            </div>
            {getPageTitle()}
          </div>        </div>
        {/* User Profile with Online/Offline Status */}
        <div className="flex-none">
          <div className="relative">            {/* Profile Avatar */}
            <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-md border-2 border-white" style={{
              background: patientData?.profileImageUrl ? 'none' : 'linear-gradient(to-br, #FB929E, #AEDEFC)'
            }}>
              {patientData?.profileImageUrl ? (
                <img 
                  src={patientData.profileImageUrl} 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-lg">👤</span>
              )}
            </div>            {/* Data Source Status Indicator */}
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
              dataSource === 'database' 
                ? 'bg-green-500' 
                : dataSource === 'loading'
                  ? 'bg-yellow-500'
                  : 'bg-gray-400'
            }`}></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderContent()}
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Hidden Test Tab */}
      <HiddenTestTab />
    </div>
  )
}
