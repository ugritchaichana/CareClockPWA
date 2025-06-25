'use client'

import { useState, useEffect } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'
import { localStorageService } from '../../../lib/localStorage'
import { notificationManager, NotificationManager } from '../../../lib/notificationManager'
import { AlarmAudio, AlarmTypes, AlarmType } from '../../../lib/audio'

// Define interfaces
interface MedicineData {
  id: number
  medicineName: string
  dosage: number
  currentStock: number
  medicineImageUrl?: string
  consumptionType: string
}

interface NotificationData {
  id: number
  medicineId: number
  title: string
  message?: string
  scheduledTime: string
  timeType: string // morning, afternoon, evening, before_bed
  isActive: boolean
  medicine: MedicineData
}

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

// Theme colors
const themeColors = {
  bgGradient: 'linear-gradient(135deg, #FFF6F6 0%, #FFDFDF 50%, #AEDEFC 100%)',
  pink: '#FB929E',
  lightPink: '#FFDFDF',
  lightBlue: '#AEDEFC',
  white: '#FFF6F6',
  textPrimary: '#575757',
  textSecondary: '#757575',
}

export default function Notification() {
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true)
  const [medicines, setMedicines] = useState<MedicineData[]>([])
  const [showForm, setShowForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Form states
  const [selectedMedicine, setSelectedMedicine] = useState('')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [timeType, setTimeType] = useState('')
  const [editingNotification, setEditingNotification] = useState<NotificationData | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)
  const [showMedicineModal, setShowMedicineModal] = useState<NotificationData | null>(null)
  
  // PWA Notification states
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const [alarmType, setAlarmType] = useState<AlarmType>(AlarmTypes.NORMAL)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [vibrationEnabled, setVibrationEnabled] = useState(true)
  
  // Toast notification state
  const [toast, setToast] = useState<{
    show: boolean
    message: string
    type: 'success' | 'error' | 'info'
  }>({
    show: false,
    message: '',
    type: 'info'
  })
  
  // Track which notifications have been taken today
  const [takenToday, setTakenToday] = useState<Set<number>>(new Set())

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }))
    }, 3000)
  }

  useEffect(() => {
    loadNotifications()
    loadMedicines()
    checkNotificationPermission()
    syncWithNotificationManager()
  }, [])

  const checkNotificationPermission = async () => {
    if (NotificationManager.isSupported()) {
      const permission = notificationManager.getPermissionStatus()
      setNotificationPermission(permission)
      
      if (permission === 'default') {
        setShowPermissionModal(true)
      }
    }
  }

  const syncWithNotificationManager = async () => {
    try {
      const patientData = localStorageService.getItem<PatientData>('patient-data')
      if (!patientData?.phoneNumber) return

      const response = await fetch(`/api/notifications?phoneNumber=${patientData.phoneNumber}`)
      if (response.ok) {
        const result = await response.json()
        await notificationManager.syncNotifications(result.notifications || [])
      }
    } catch (error) {
      console.error('Failed to sync with notification manager:', error)
    }
  }

  const requestNotificationPermission = async () => {
    const granted = await notificationManager.requestNotificationPermission()
    setNotificationPermission(granted ? 'granted' : 'denied')
    setShowPermissionModal(false)
    
    if (granted) {
      showToast('✅ การแจ้งเตือนได้รับการอนุญาตแล้ว! ตอนนี้คุณจะได้รับการแจ้งเตือนกินยาแม้เมื่อปิดแอพ', 'success')
    } else {
      showToast('❌ ไม่สามารถขออนุญาตการแจ้งเตือนได้ กรุณาเปิดในการตั้งค่าเบราว์เซอร์', 'error')
    }
  }

  const loadNotifications = async () => {
    try {
      setIsLoadingNotifications(true)
      const patientData = localStorageService.getItem<PatientData>('patient-data')
      
      if (!patientData?.phoneNumber) {
        console.log('No patient data found')
        setNotifications([])
        return
      }

      const response = await fetch(`/api/notifications?phoneNumber=${patientData.phoneNumber}`)
        if (response.ok) {
        const result = await response.json()
        setNotifications(result.notifications || [])
        
        // Update takenToday based on today's consumption records
        const today = new Date().toDateString()
        const takenNotificationsToday = new Set<number>()
        
        if (result.notifications) {
          result.notifications.forEach((notification: NotificationData) => {
            // Check if this notification was taken today
            // This would need to be implemented based on your consumption tracking
            // For now, we'll keep the existing local state
          })
        }
      } else {
        console.error('Failed to load notifications')
        setNotifications([])
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
      setNotifications([])
    } finally {
      setIsLoadingNotifications(false)
    }
  }

  const loadMedicines = async () => {
    try {
      const patientData = localStorageService.getItem<PatientData>('patient-data')
      
      if (!patientData?.phoneNumber) {
        setMedicines([])
        return
      }

      const response = await fetch(`/api/medicines?phoneNumber=${patientData.phoneNumber}`)
      
      if (response.ok) {
        const result = await response.json()
        setMedicines(result.medicines || [])
      } else {
        console.error('Failed to load medicines')
        setMedicines([])
      }
    } catch (error) {
      console.error('Error loading medicines:', error)
      setMedicines([])
    }
  }

  const resetForm = () => {
    setSelectedMedicine('')
    setTitle('')
    setMessage('')
    setScheduledTime('')
    setTimeType('')
    setEditingNotification(null)
  }

  // Helper function to format DateTime to HH:mm
  const formatTimeToHHMM = (dateTime: string) => {
    const date = new Date(dateTime)
    return date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  const recordMedicineConsumption = async (notificationId: number, medicineId: number, status: 'taken' | 'skipped' | 'cancel') => {
    try {
      const patientData = localStorageService.getItem<PatientData>('patient-data')
      
      if (!patientData?.phoneNumber) {
        showToast('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบก่อน', 'error')
        return
      }      const response = await fetch('/api/medicines/consumption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: patientData.phoneNumber,
          medicineId,
          notificationId,
          status,
          dosageTaken: status === 'taken' ? notifications.find(n => n.id === notificationId)?.medicine.dosage : undefined
        })
      })

      if (!response.ok) {
        const errorResult = await response.json()
        throw new Error(errorResult.message || 'เกิดข้อผิดพลาดในการบันทึกการกินยา')
      }
      
      // Reload notifications to update stock info
      await loadNotifications()
        // Update takenToday state
      setTakenToday(prev => {
        const newSet = new Set(prev)
        if (status === 'taken') {
          newSet.add(notificationId)
        } else if (status === 'cancel') {
          newSet.delete(notificationId)
        }
        return newSet
      })
      
    } catch (error) {
      console.error('Error recording consumption:', error)
      showToast(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึกการกินยา', 'error')
    }
  }

  const handleToggleNotification = async (notificationId: number, currentStatus: boolean) => {
    try {
      const patientData = localStorageService.getItem<PatientData>('patient-data')
      
      if (!patientData?.phoneNumber) {
        showToast('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบก่อน', 'error')
        return
      }

      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: patientData.phoneNumber,
          notificationId,
          isActive: !currentStatus
        })
      })

      if (!response.ok) {
        const errorResult = await response.json()
        throw new Error(errorResult.message || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะการแจ้งเตือน')
      }

      // Update local state
      setNotifications(prev => prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isActive: !currentStatus }
          : notification
      ))

      // Update notification manager
      if (!currentStatus) {
        // Enable notification - add to notification manager
        const notification = notifications.find(n => n.id === notificationId)
        if (notification) {
          notificationManager.addNotification({
            id: `server-${notificationId}`,
            medicineId: notification.medicineId,
            medicineName: notification.medicine.medicineName,
            title: notification.title,
            message: notification.message || `เวลากินยา ${notification.medicine.medicineName}`,
            scheduledTime: formatTimeToHHMM(notification.scheduledTime),
            timeType: notification.timeType,
            isActive: true,
            dosage: notification.medicine.dosage,
            soundEnabled,
            vibrationEnabled
          })
        }
      } else {
        // Disable notification - remove from notification manager
        notificationManager.removeNotification(`server-${notificationId}`)
      }      // Sync with notification manager
      await syncWithNotificationManager()
      
    } catch (error) {
      console.error('Error toggling notification:', error)
      showToast(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะการแจ้งเตือน', 'error')
    }
  }

  const formatTimeType = (timeType: string) => {
    switch (timeType) {
      case 'morning':
        return 'เช้า'
      case 'afternoon':
        return 'บ่าย'
      case 'evening':
        return 'เย็น'
      case 'before_bed':
        return 'ก่อนนอน'
      default:
        return ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedMedicine || !title || !scheduledTime || !timeType) {
      showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error')
      return
    }

    setIsLoading(true)
    
    try {
      const patientData = localStorageService.getItem<PatientData>('patient-data')
      
      if (!patientData?.phoneNumber) {
        showToast('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบก่อน', 'error')
        return
      }

      const requestBody = {
        phoneNumber: patientData.phoneNumber,
        medicineId: parseInt(selectedMedicine),
        title,
        message: message || null,
        scheduledTime: new Date(`1970-01-01T${scheduledTime}:00.000Z`).toISOString(),
        timeType,
        isActive: true
      }

      const url = editingNotification ? '/api/notifications' : '/api/notifications'
      const method = editingNotification ? 'PUT' : 'POST'
      
      if (editingNotification) {
        requestBody.notificationId = editingNotification.id
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorResult = await response.json()
        throw new Error(errorResult.message || 'เกิดข้อผิดพลาดในการบันทึกการแจ้งเตือน')
      }

      // Reload notifications
      await loadNotifications()
      
      // Reset form and close
      resetForm()
      setShowForm(false)
      
      // Scroll to top
      window.scrollTo({ 
        top: 0, 
        behavior: 'smooth' 
      })

      // Sync with notification manager
      await syncWithNotificationManager()
      
    } catch (error) {
      console.error('Error saving notification:', error)
      showToast(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึกการแจ้งเตือน', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (notification: NotificationData) => {
    setEditingNotification(notification)
    setSelectedMedicine(notification.medicineId.toString())
    setTitle(notification.title)
    setMessage(notification.message || '')
    setScheduledTime(formatTimeToHHMM(notification.scheduledTime))
    setTimeType(notification.timeType)
    setShowForm(true)
    
    // Scroll to top
    setTimeout(() => {
      window.scrollTo({ 
        top: 0, 
        behavior: 'smooth' 
      })
    }, 100)
  }

  const handleDelete = async (notificationId: number) => {
    try {
      const patientData = localStorageService.getItem<PatientData>('patient-data')
      
      if (!patientData?.phoneNumber) {
        showToast('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบก่อน', 'error')
        return
      }

      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: patientData.phoneNumber,
          notificationId
        })
      })

      if (!response.ok) {
        const errorResult = await response.json()
        throw new Error(errorResult.message || 'เกิดข้อผิดพลาดในการลบการแจ้งเตือน')
      }

      // Remove from notification manager
      notificationManager.removeNotification(`server-${notificationId}`)

      // Reload notifications
      await loadNotifications()
      setShowDeleteConfirm(null)
      
    } catch (error) {
      console.error('Error deleting notification:', error)
      showToast(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบการแจ้งเตือน', 'error')
    }
  }

  return (
    <div className="flex-1 px-4 pb-24 overflow-y-auto">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-700 mb-2">การแจ้งเตือน</h1>
          <p className="text-gray-600">แจ้งเตือนการกินยาและนัดหมาย</p>
        </div>
        
        <div className="card bg-white/90 shadow-xl rounded-3xl" style={{ border: '2px solid #FB929E' }}>
          <div className="card-body">
            <h2 className="card-title text-gray-700 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FB929E' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              การแจ้งเตือน
            </h2>
            
            {isLoadingNotifications ? (
              <LoadingSpinner />
            ) : notifications.length === 0 ? (
              <p className="text-gray-600">ยังไม่มีการแจ้งเตือน</p>
            ) : (
              <div>
                {notifications.map(notification => (
                  <div key={notification.id} className="card bg-white/90 shadow-xl rounded-3xl border-2 mb-4" style={{ borderColor: themeColors.lightPink }}>
                    <div className="card-body p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold mb-1" style={{ color: themeColors.textPrimary }}>
                            {notification.title}
                          </h3>
                          {notification.message && (
                            <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                          )}
                        </div>
                        <button 
                          onClick={() => handleToggleNotification(notification.id, notification.isActive)}
                          className="ml-3 px-4 py-2 rounded-full text-sm font-medium text-white shadow-lg hover:shadow-xl transition-all"
                          style={{
                            background: notification.isActive 
                              ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
                              : `linear-gradient(135deg, ${themeColors.pink}, ${themeColors.lightBlue})`
                          }}
                        >
                          {notification.isActive ? '🔕 ปิด' : '🔔 เปิด'}
                        </button>
                      </div>
                      
                      {/* Time and Type Info */}
                      <div className="flex gap-2 mb-3">
                        <span className="text-sm px-3 py-1 rounded-full" style={{ backgroundColor: themeColors.lightPink, color: themeColors.textPrimary }}>
                          {formatTimeType(notification.timeType)}
                        </span>
                        <span className="text-sm px-3 py-1 rounded-full" style={{ backgroundColor: themeColors.lightBlue, color: themeColors.textPrimary }}>
                          ⏰ {formatTimeToHHMM(notification.scheduledTime)}
                        </span>
                      </div>
                      
                      {/* Medicine Information */}
                      <div className="p-3 rounded-lg mb-3" style={{ backgroundColor: themeColors.white }}>
                        <p className="text-sm font-medium" style={{ color: themeColors.textPrimary }}>
                          💊 {notification.medicine.medicineName}
                        </p>                        <p className="text-sm" style={{ color: themeColors.textSecondary }}>
                          ขนาด: {notification.medicine.dosage} เม็ด/ครั้ง
                        </p>
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${
                            notification.medicine.currentStock > 10 
                              ? 'text-green-600' 
                              : notification.medicine.currentStock > 5 
                              ? 'text-yellow-600' 
                              : 'text-red-600'
                          }`}>
                            คงเหลือ: {notification.medicine.currentStock} เม็ด
                          </p>
                          {notification.medicine.currentStock <= 5 && notification.medicine.currentStock > 0 && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">⚠️ ยาเหลือน้อย</span>
                          )}
                          {notification.medicine.currentStock === 0 && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">❌ หมดยา</span>
                          )}                        </div>
                      </div>
                      
                      {/* Status indicator if taken today */}
                      {takenToday.has(notification.id) && (
                        <div className="mb-3">
                          <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                            ✓ กินยาวันนี้แล้ว
                          </span>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {takenToday.has(notification.id) ? (
                          // Show cancel button if taken today
                          <button
                            onClick={() => recordMedicineConsumption(notification.id, notification.medicineId, 'cancel')}
                            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-white shadow-md hover:shadow-lg transition-all"
                            style={{ background: 'linear-gradient(135deg, #6b7280, #4b5563)' }}
                          >
                            ↶ ยกเลิกการกินยา
                          </button>
                        ) : (
                          // Show normal buttons if not taken
                          <>
                            <button
                              onClick={() => recordMedicineConsumption(notification.id, notification.medicineId, 'taken')}
                              className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-white shadow-md hover:shadow-lg transition-all"
                              style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                            >
                              ✓ กินยาแล้ว
                            </button>
                            <button
                              onClick={() => recordMedicineConsumption(notification.id, notification.medicineId, 'skipped')}
                              className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-white shadow-md hover:shadow-lg transition-all"
                              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                            >
                              ⏭ ข้ามการกินยา
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
              
            <div className="card-actions justify-center mt-4">
              <button 
                onClick={() => {
                  resetForm()
                  setShowForm(true)
                  setTimeout(() => {
                    window.scrollTo({ 
                      top: 0, 
                      behavior: 'smooth' 
                    })
                  }, 100)
                }}
                className="btn gap-2 text-white shadow-lg" 
                style={{ 
                  background: 'linear-gradient(135deg, #FB929E, #AEDEFC)',
                  border: 'none'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                ตั้งแจ้งเตือน
              </button>
            </div>
          </div>
        </div>
        
        {/* Notification Form */}
        {showForm && (
          <div className="card bg-white/90 shadow-xl rounded-3xl mb-6" style={{ border: '2px solid #FB929E' }}>
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title text-gray-700">
                  {editingNotification ? 'แก้ไขการแจ้งเตือน' : 'ตั้งการแจ้งเตือนใหม่'}
                </h2>
                <button 
                  onClick={() => {
                    resetForm()
                    setShowForm(false)
                  }}
                  className="btn btn-ghost btn-sm"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Medicine Selection */}
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium">เลือกยา</span>
                  </label>
                  <select 
                    value={selectedMedicine} 
                    onChange={(e) => setSelectedMedicine(e.target.value)}
                    className="select select-bordered w-full"
                    required
                  >
                    <option value="">-- เลือกยา --</option>
                    {medicines.map(medicine => (
                      <option key={medicine.id} value={medicine.id}>
                        {medicine.medicineName} (ขนาด: {medicine.dosage} เม็ด/ครั้ง)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium">หัวข้อการแจ้งเตือน</span>
                  </label>
                  <input 
                    type="text" 
       