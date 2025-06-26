'use client'

import { useState, useEffect } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'
import LoadingButton from '@/components/LoadingButton'
import Toast, { useToast } from '@/components/Toast'
import { localStorageService } from '../../../lib/localStorage'
import { notificationManager, NotificationManager } from '../../../lib/notificationManager'
import { AlarmAudio, AlarmTypes, AlarmType } from '../../../lib/audio'
import { formatTimeToHHMM, THAILAND_TIMEZONE } from '../../../lib/timezone'

// Define interfaces
interface ConsumptionTimes {
  morning: boolean
  afternoon: boolean
  evening: boolean
  beforeBed: boolean
}

interface MedicineData {
  id: number
  medicineName: string
  dosage: number
  currentStock: number
  medicineImageUrl?: string
  consumptionType: string
  consumptionTimes: ConsumptionTimes
}

interface NotificationData {
  id: number
  medicineId: number
  title: string
  message?: string
  scheduledTime: string
  timeType: string // morning, afternoon, evening, before_bed
  groupId?: string // For grouping notifications
  isActive: boolean
  medicine: MedicineData
}

interface GroupedNotification {
  groupId: string
  title: string
  message?: string
  medicine: MedicineData
  isActive: boolean
  notifications: NotificationData[]
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
  const [scheduledTimes, setScheduledTimes] = useState<{
    morning?: string
    afternoon?: string
    evening?: string
    beforeBed?: string
  }>({})
  const [editingNotification, setEditingNotification] = useState<NotificationData | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // PWA Notification states
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const [alarmType, setAlarmType] = useState<AlarmType>(AlarmTypes.NORMAL)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [vibrationEnabled, setVibrationEnabled] = useState(true)
  
  // Toast notification
  const { toast, showToast } = useToast()
  
  // Track which notifications have been taken today
  const [takenToday, setTakenToday] = useState<Set<number>>(new Set())

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
      showToast('✅ การแจ้งเตือนได้รับการอนุญาตแล้ว! ตอนนี้คุณจะได้รับการแจ้งเตือนกินยาแม้เมื่อปิดแอพ', 'info')
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
    setScheduledTimes({})
    setEditingNotification(null)
  }

  // Helper function to format DateTime to HH:mm (use Thailand timezone)
  const formatTimeToHHMMLocal = (dateTime: string) => {
    return formatTimeToHHMM(dateTime, THAILAND_TIMEZONE)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedMedicine || !title) {
      showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error')
      return
    }

    // Get selected medicine to check consumption times
    const selectedMed = medicines.find(med => med.id === parseInt(selectedMedicine))
    if (!selectedMed) {
      showToast('ไม่พบข้อมูลยาที่เลือก', 'error')
      return
    }

    // Check if all required time slots have values and valid format
    const requiredTimes = Object.keys(selectedMed.consumptionTimes).filter(
      time => selectedMed.consumptionTimes[time as keyof ConsumptionTimes]
    )
    const hasAllTimes = requiredTimes.every(time => {
      const timeKey = time as keyof typeof scheduledTimes
      const timeValue = scheduledTimes[timeKey]
      if (!timeValue || timeValue.trim() === '') return false
      
      const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
      return timePattern.test(timeValue)
    })

    if (!hasAllTimes) {
      showToast('กรุณากรอกเวลาแจ้งเตือนให้ครบทุกช่วงเวลาในรูปแบบที่ถูกต้อง', 'error')
      return
    }

    setIsLoading(true)
    
    try {
      const patientData = localStorageService.getItem<PatientData>('patient-data')
      
      if (!patientData?.phoneNumber) {
        showToast('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบก่อน', 'error')
        return
      }

      // Create notifications for each selected time with the same group
      const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const notifications = Object.entries(scheduledTimes)
        .filter(([timeType, time]) => time && time.trim() !== '' && selectedMed.consumptionTimes[timeType as keyof ConsumptionTimes])
        .map(([timeType, time]) => {
          console.log('Processing time:', {
            timeType,
            originalTime: time,
            timezone: THAILAND_TIMEZONE
          }) // Debug log
          
          return {
            phoneNumber: patientData.phoneNumber,
            medicineId: parseInt(selectedMedicine),
            title: title, // Use original title
            message: message || null,
            scheduledTime: time, // Send as simple HH:mm string
            timeType,
            groupId, // Add group ID for grouping notifications
            isActive: true,
            timezone: THAILAND_TIMEZONE // All users are in Thailand
          }
        })

      // Send each notification
      for (const notificationData of notifications) {
        console.log('Sending notification data:', {
          ...notificationData,
          originalTimeInput: Object.entries(scheduledTimes).find(([type]) => type === notificationData.timeType)?.[1],
          scheduledTimeFormatted: new Date(notificationData.scheduledTime).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
        }) // Debug log
        
        const response = await fetch('/api/notifications', {
          method: editingNotification ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(notificationData)
        })

        if (!response.ok) {
          const errorResult = await response.json()
          console.error('API Error:', errorResult) // Debug log
          throw new Error(errorResult.error || errorResult.message || 'เกิดข้อผิดพลาดในการบันทึกการแจ้งเตือน')
        }

        const result = await response.json()
        console.log('API Response:', result) // Debug log
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
      
      showToast(`✅ สร้างการแจ้งเตือนสำเร็จแล้ว! (${notifications.length} ช่วงเวลา)`, 'success')
      
    } catch (error) {
      console.error('Error saving notification:', error)
      showToast(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึกการแจ้งเตือน', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to get time type label in Thai
  const getTimeTypeLabel = (timeType: string) => {
    switch (timeType) {
      case 'morning': return 'เช้า'
      case 'afternoon': return 'กลางวัน'
      case 'evening': return 'เย็น'
      case 'beforeBed': return 'ก่อนนอน'
      default: return timeType
    }
  }

  // Helper function to group notifications
  const groupNotifications = (notifications: NotificationData[]): GroupedNotification[] => {
    const grouped = new Map<string, GroupedNotification>()
    
    notifications.forEach(notification => {
      // Group by groupId first, then fallback to title + medicineId for older notifications
      const key = notification.groupId || `${notification.title}_${notification.medicineId}`
      
      if (!grouped.has(key)) {
        grouped.set(key, {
          groupId: key,
          title: notification.title,
          message: notification.message,
          medicine: notification.medicine,
          isActive: true, // Will be calculated after all notifications are added
          notifications: []
        })
      }
      
      grouped.get(key)!.notifications.push(notification)
    })
    
    // Calculate isActive for each group (true if all notifications in group are active)
    const groups = Array.from(grouped.values())
    groups.forEach(group => {
      group.isActive = group.notifications.every(n => n.isActive)
    })
    
    return groups
  }

  const recordMedicineConsumption = async (notificationId: number, medicineId: number, status: 'taken' | 'skipped' | 'cancel') => {
    try {
      const patientData = localStorageService.getItem<PatientData>('patient-data')
      
      if (!patientData?.phoneNumber) {
        showToast('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบก่อน', 'error')
        return
      }

      const response = await fetch('/api/medicines/consumption', {
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

  const handleToggleNotificationGroup = async (groupId: string, currentStatus: boolean) => {
    try {
      const patientData = localStorageService.getItem<PatientData>('patient-data')
      
      if (!patientData?.phoneNumber) {
        showToast('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบก่อน', 'error')
        return
      }

      // Find all notifications in this group
      const groupNotifications = notifications.filter(n => {
        const nKey = n.groupId || `${n.title}_${n.medicineId}`
        return nKey === groupId
      })

      // Toggle all notifications in the group
      for (const notification of groupNotifications) {
        const response = await fetch('/api/notifications', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phoneNumber: patientData.phoneNumber,
            notificationId: notification.id,
            isActive: !currentStatus
          })
        })

        if (!response.ok) {
          const errorResult = await response.json()
          throw new Error(errorResult.message || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะการแจ้งเตือน')
        }

        // Update notification manager
        if (!currentStatus) {
          // Enable notification - add to notification manager
          const scheduledDate = new Date(notification.scheduledTime)
          const timeString = scheduledDate.toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Asia/Bangkok'
          })
          
          notificationManager.addNotification({
            id: `server-${notification.id}`,
            medicineId: notification.medicineId,
            medicineName: notification.medicine.medicineName,
            title: notification.title,
            message: notification.message || `เวลากินยา ${notification.medicine.medicineName}`,
            scheduledTime: timeString,
            timeType: notification.timeType,
            isActive: true,
            dosage: notification.medicine.dosage,
            soundEnabled,
            vibrationEnabled
          })
        } else {
          // Disable notification - remove from notification manager
          notificationManager.removeNotification(`server-${notification.id}`)
        }
      }

      // Update local state
      setNotifications(prev => prev.map(notification => {
        const nKey = notification.groupId || `${notification.title}_${notification.medicineId}`
        const belongsToGroup = nKey === groupId
        return belongsToGroup 
          ? { ...notification, isActive: !currentStatus }
          : notification
      }))

      // Sync with notification manager
      await syncWithNotificationManager()
      
    } catch (error) {
      console.error('Error toggling notification group:', error)
      showToast(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะการแจ้งเตือน', 'error')
    }
  }

  const handleDeleteNotificationGroup = async (groupId: string) => {
    try {
      setIsDeleting(true) // Start loading state
      const patientData = localStorageService.getItem<PatientData>('patient-data')
      
      if (!patientData?.phoneNumber) {
        showToast('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบก่อน', 'error')
        return
      }

      // Find all notifications in this group
      const groupNotifications = notifications.filter(n => {
        const nKey = n.groupId || `${n.title}_${n.medicineId}`
        return nKey === groupId
      })

      // Delete all notifications in the group
      for (const notification of groupNotifications) {
        const response = await fetch(`/api/notifications?notificationId=${notification.id}&phoneNumber=${encodeURIComponent(patientData.phoneNumber)}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          const errorResult = await response.json()
          throw new Error(errorResult.error || errorResult.message || 'เกิดข้อผิดพลาดในการลบการแจ้งเตือน')
        }

        // Remove from notification manager
        notificationManager.removeNotification(`server-${notification.id}`)
      }

      // Reload notifications
      await loadNotifications()

      // Hide delete confirmation modal
      setShowDeleteConfirm(null)

      showToast(`🗑️ ลบการแจ้งเตือนกลุ่มสำเร็จแล้ว! (${groupNotifications.length} ช่วงเวลา)`, 'success')
      
    } catch (error) {
      console.error('Error deleting notification group:', error)
      showToast(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบการแจ้งเตือน', 'error')
      setShowDeleteConfirm(null)
    } finally {
      setIsDeleting(false) // End loading state
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

  return (
    <div className="flex-1 px-3 pb-28 overflow-y-auto min-h-screen" style={{ background: themeColors.bgGradient }}>
      <div className="container mx-auto max-w-md py-4">
        {showForm ? (
          // Notification Form View - Mobile First Design
          <div className="space-y-4">
            {/* Header - Mobile Optimized */}
            <div className="sticky top-0 z-10 pb-4 mb-2" style={{ background: themeColors.bgGradient }}>
              <div className="text-center mb-4">
                <h1 className="text-xl font-bold mb-1" style={{ color: themeColors.textPrimary }}>
                  {editingNotification ? '✏️ แก้ไขการแจ้งเตือน' : '⏰ ตั้งการแจ้งเตือนใหม่'}
                </h1>
                <p className="text-gray-500 text-xs">ตั้งเวลาแจ้งเตือนกินยา</p>
              </div>

              {/* Back Button - iOS Style */}
              <div className="mb-2">
                <button
                  onClick={() => {
                    resetForm()
                    setShowForm(false)
                    setTimeout(() => {
                      window.scrollTo({ 
                        top: 0, 
                        behavior: 'smooth' 
                      })
                    }, 100)
                  }}
                  className="flex items-center gap-2 px-4 py-3 rounded-full text-sm font-medium shadow-sm transition-all duration-200 active:scale-95 w-full justify-center"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    color: themeColors.textPrimary,
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${themeColors.lightPink}`
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>กลับไปหน้าหลัก</span>
                </button>
              </div>
            </div>

            {/* Form Card - Mobile Optimized */}
            <div className="card bg-white/95 shadow-lg rounded-3xl border-2 backdrop-blur-sm" style={{ borderColor: themeColors.lightPink }}>
              <div className="card-body p-4 sm:p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Medicine Selection - Mobile Friendly */}
                  <div>
                    <label className="label">
                      <span className="label-text font-medium text-gray-800 text-sm">📋 เลือกยา</span>
                    </label>
                    <select 
                      value={selectedMedicine} 
                      onChange={(e) => setSelectedMedicine(e.target.value)}
                      className="select select-bordered bg-gray-50 text-gray-800 font-medium w-full text-base"
                      style={{ 
                        borderColor: themeColors.pink,
                        minHeight: '48px' // Touch-friendly height
                      }}
                      required
                    >
                      <option disabled value="">เลือกยา</option>
                      {medicines.map(medicine => (
                        <option key={medicine.id} value={medicine.id}>
                          {medicine.medicineName} (ขนาด: {medicine.dosage} เม็ด/ครั้ง)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Title - Mobile Friendly */}
                  <div>
                    <label className="label">
                      <span className="label-text font-medium text-gray-800 text-sm">📝 หัวข้อการแจ้งเตือน</span>
                    </label>
                    <input 
                      type="text" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="เช่น กินยาความดันโลหิตสูง"
                      className="input input-bordered bg-gray-50 text-gray-800 font-medium w-full text-base"
                      style={{ 
                        borderColor: themeColors.pink,
                        minHeight: '48px' // Touch-friendly height
                      }}
                      required
                    />
                  </div>

                          {/* Dynamic Time Inputs - Mobile Optimized */}
                  {selectedMedicine && medicines.find(med => med.id === parseInt(selectedMedicine)) && (
                    <div>
                      <label className="label">
                        <span className="label-text font-medium text-gray-800 text-sm">⏰ เวลาแจ้งเตือน</span>
                      </label>
                      <div className="space-y-3">
                        {Object.entries(medicines.find(med => med.id === parseInt(selectedMedicine))!.consumptionTimes)
                          .filter(([_, isSelected]) => isSelected)
                          .map(([timeType, _]) => (
                            <div key={timeType} className="bg-gray-50 p-3 rounded-2xl border" style={{ borderColor: themeColors.lightPink }}>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                <div className="w-full sm:w-auto">
                                  <span className="text-sm font-medium px-3 py-2 rounded-full inline-block text-center w-full sm:w-auto" 
                                        style={{ backgroundColor: themeColors.lightPink, color: themeColors.textPrimary }}>
                                    {getTimeTypeLabel(timeType)}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <input 
                                    type="time" 
                                    value={scheduledTimes[timeType as keyof typeof scheduledTimes] || ''}
                                    onChange={(e) => {
                                      console.log(`Setting ${timeType} to ${e.target.value}`) // Debug log
                                      setScheduledTimes(prev => ({
                                        ...prev,
                                        [timeType]: e.target.value
                                      }))
                                    }}
                                    className="input input-bordered bg-white text-gray-800 font-medium w-full text-base"
                                    style={{ 
                                      borderColor: themeColors.pink,
                                      minHeight: '48px' // Touch-friendly height
                                    }}
                                    step="60" // Only allow full minutes
                                    required
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Message - Mobile Friendly */}
                  <div>
                    <label className="label">
                      <span className="label-text font-medium text-gray-800 text-sm">💬 ข้อความ (ไม่บังคับ)</span>
                    </label>
                    <textarea 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="ข้อความเพิ่มเติม..."
                      className="textarea textarea-bordered bg-gray-50 text-gray-800 font-medium w-full text-base"
                      style={{ 
                        borderColor: themeColors.pink,
                        minHeight: '96px' // Touch-friendly height
                      }}
                      rows={3}
                    />
                  </div>

                  {/* Form Actions - Mobile Optimized */}
                  <div className="space-y-3 mt-6 pt-4 border-t border-gray-200">
                    <LoadingButton
                      type="submit"
                      size="lg"
                      className="w-full py-4 rounded-2xl text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                      style={{ 
                        background: isLoading 
                          ? 'linear-gradient(135deg, #9ca3af, #6b7280)' 
                          : `linear-gradient(135deg, ${themeColors.pink}, ${themeColors.lightBlue})`,
                        border: 'none',
                        minHeight: '56px' // Extra touch-friendly height
                      }}
                      isLoading={isLoading}
                      loadingText="กำลังบันทึก..."
                      icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                      }
                    >
                      {editingNotification ? (
                        <span className="flex items-center justify-center gap-2">
                          <span>💾</span>
                          <span>บันทึกการแก้ไข</span>
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <span>⏰</span>
                          <span>ตั้งการแจ้งเตือน</span>
                        </span>
                      )}
                    </LoadingButton>
                    
                    {/* Cancel Button - Mobile Friendly */}
                    <button 
                      type="button"
                      onClick={() => {
                        resetForm()
                        setShowForm(false)
                      }}
                      className="w-full py-3 rounded-2xl font-semibold text-base border-2 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                      style={{ 
                        borderColor: themeColors.textSecondary,
                        color: themeColors.textSecondary,
                        backgroundColor: 'transparent',
                        minHeight: '48px'
                      }}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <span>❌</span>
                        <span>ยกเลิก</span>
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : (
          // Notification List View - Mobile Optimized
          <div className="space-y-4">
            {/* Header - Mobile Style */}
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold mb-1" style={{ color: themeColors.textPrimary }}>🔔 การแจ้งเตือน</h1>
              <p className="text-gray-500 text-xs">แจ้งเตือนการกินยาและนัดหมาย</p>
            </div>

            {/* Add Notification Button - Mobile Optimized */}
            <div className="flex justify-center mb-6">
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
                className="px-6 py-4 rounded-2xl text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 font-semibold text-base"
                style={{
                  background: `linear-gradient(135deg, ${themeColors.pink}, ${themeColors.lightBlue})`,
                  border: 'none',
                  minHeight: '56px' // Touch-friendly height
                }}
              >
                <span className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>⏰ ตั้งแจ้งเตือนใหม่</span>
                </span>
              </button>
            </div>

            {/* Notification Cards - Mobile First */}
            <div className="space-y-3">
              {isLoadingNotifications ? (
                <div className="text-center py-8">
                  <LoadingSpinner size="lg" color="primary" />
                  <p className="text-gray-700 mt-3 font-medium text-sm">กำลังโหลดการแจ้งเตือน...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-5xl mb-3">🔔</div>
                  <p className="text-gray-500 text-sm">ยังไม่มีการแจ้งเตือน</p>
                  <p className="text-gray-400 text-xs mt-1">กดปุ่ม "ตั้งแจ้งเตือนใหม่" เพื่อเพิ่มการแจ้งเตือน</p>
                </div>
              ) : (
                groupNotifications(notifications).map((group) => (
                  <div key={group.groupId} className="card bg-white/95 shadow-lg rounded-3xl border-2 backdrop-blur-sm" style={{ borderColor: themeColors.lightPink }}>
                    <div className="card-body p-4 sm:p-5">
                      {/* Group Header - Mobile Optimized */}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold mb-1 leading-tight" style={{ color: themeColors.textPrimary }}>
                            {group.title}
                          </h3>
                          {group.message && (
                            <p className="text-sm text-gray-600 mb-2">{group.message}</p>
                          )}
                        </div>
                        {/* Action Buttons - Mobile Stack */}
                        <div className="flex gap-2 w-full sm:w-auto sm:ml-3">
                          <button 
                            onClick={() => handleToggleNotificationGroup(group.groupId, group.isActive)}
                            title={`${group.isActive ? 'ปิด' : 'เปิด'}การแจ้งเตือนทั้งกลุ่ม`}
                            className="flex-1 sm:flex-none px-3 py-2 rounded-2xl text-xs font-medium text-white shadow-md hover:shadow-lg transition-all duration-300 transform active:scale-95"
                            style={{
                              background: group.isActive 
                                ? `linear-gradient(135deg, ${themeColors.pink}, ${themeColors.lightBlue})` 
                                : 'linear-gradient(135deg, #9ca3af, #6b7280)',
                              minHeight: '44px' // Touch-friendly
                            }}
                          >
                            <span className="flex items-center justify-center gap-1.5">
                              <span className="text-sm">
                                {group.isActive ? '🔔' : '🔕'}
                              </span>
                              <span>{group.isActive ? 'เปิดอยู่' : 'ปิดอยู่'}</span>
                            </span>
                          </button>
                          <button 
                            onClick={() => setShowDeleteConfirm(group.groupId)}
                            className="flex-1 sm:flex-none px-3 py-2 rounded-2xl text-xs font-medium text-white shadow-md hover:shadow-lg transition-all duration-300 transform active:scale-95"
                            style={{
                              background: 'linear-gradient(135deg, #f87171, #ef4444)',
                              minHeight: '44px' // Touch-friendly
                            }}
                            title="ลบการแจ้งเตือนทั้งกลุ่ม"
                          >
                            <span className="flex items-center justify-center gap-1.5">
                              <span className="text-sm">🗑️</span>
                              <span>ลบ</span>
                            </span>
                          </button>
                        </div>
                      </div>
                      
                      {/* Time Schedule Display - Mobile Optimized */}
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1.5">
                          {group.notifications
                            .sort((a, b) => {
                              const order = { morning: 1, afternoon: 2, evening: 3, beforeBed: 4 }
                              return (order[a.timeType as keyof typeof order] || 5) - (order[b.timeType as keyof typeof order] || 5)
                            })
                            .map((notification) => (
                              <span 
                                key={notification.id}
                                className="text-xs px-2.5 py-1.5 rounded-full font-medium" 
                                style={{ backgroundColor: themeColors.lightBlue, color: themeColors.textPrimary }}
                              >
                                {getTimeTypeLabel(notification.timeType)} {formatTimeToHHMMLocal(notification.scheduledTime)}
                              </span>
                            ))}
                        </div>
                      </div>
                      
                      {/* Medicine Information - Mobile Card Style */}
                      <div className="p-3 rounded-2xl mb-3" style={{ backgroundColor: themeColors.white }}>
                        <p className="text-sm font-medium mb-1" style={{ color: themeColors.textPrimary }}>
                          💊 {group.medicine.medicineName}
                        </p>
                        <p className="text-xs mb-2" style={{ color: themeColors.textSecondary }}>
                          ขนาด: {group.medicine.dosage} เม็ด/ครั้ง
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <p className={`text-xs font-medium ${
                            group.medicine.currentStock > 10 
                              ? 'text-green-600' 
                              : group.medicine.currentStock > 5 
                              ? 'text-yellow-600' 
                              : 'text-red-600'
                          }`}>
                            📦 คงเหลือ: {group.medicine.currentStock} เม็ด
                          </p>
                          {group.medicine.currentStock <= 5 && group.medicine.currentStock > 0 && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">⚠️ ยาเหลือน้อย</span>
                          )}
                          {group.medicine.currentStock === 0 && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">❌ หมดยา</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Status indicators - Mobile Friendly */}
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1.5">
                          {group.notifications.map((notification) => {
                            const isTakenToday = takenToday.has(notification.id)
                            return isTakenToday ? (
                              <span key={notification.id} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                                ✓ {getTimeTypeLabel(notification.timeType)}
                              </span>
                            ) : null
                          })}
                        </div>
                      </div>

                      {/* Action Buttons - Mobile Optimized */}
                      <div className="space-y-2">
                        {group.notifications.map((notification) => {
                          const isTakenToday = takenToday.has(notification.id)
                          return (
                            <div key={notification.id} className="flex items-center gap-2 p-2 rounded-xl bg-gray-50">
                              <span className="text-xs font-medium w-16 text-center" style={{ color: themeColors.textPrimary }}>
                                {getTimeTypeLabel(notification.timeType)}
                              </span>
                              <div className="flex gap-2 flex-1">
                                {isTakenToday ? (
                                  <button
                                    onClick={() => recordMedicineConsumption(notification.id, notification.medicineId, 'cancel')}
                                    className="flex-1 px-3 py-2 rounded-xl text-xs font-medium text-white shadow-md transition-all duration-200 active:scale-95"
                                    style={{ 
                                      background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                                      minHeight: '40px' // Touch-friendly
                                    }}
                                  >
                                    <span className="flex items-center justify-center gap-1">
                                      <span>↶</span>
                                      <span>ยกเลิก</span>
                                    </span>
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => recordMedicineConsumption(notification.id, notification.medicineId, 'taken')}
                                      className="flex-1 px-3 py-2 rounded-xl text-xs font-medium text-white shadow-md transition-all duration-200 active:scale-95"
                                      style={{ 
                                        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                        minHeight: '40px' // Touch-friendly
                                      }}
                                    >
                                      <span className="flex items-center justify-center gap-1">
                                        <span>✓</span>
                                        <span>กิน</span>
                                      </span>
                                    </button>
                                    <button
                                      onClick={() => recordMedicineConsumption(notification.id, notification.medicineId, 'skipped')}
                                      className="flex-1 px-3 py-2 rounded-xl text-xs font-medium text-white shadow-md transition-all duration-200 active:scale-95"
                                      style={{ 
                                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                        minHeight: '40px' // Touch-friendly
                                      }}
                                    >
                                      <span className="flex items-center justify-center gap-1">
                                        <span>⏭</span>
                                        <span>ข้าม</span>
                                      </span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {/* Delete Confirmation Modal - Mobile Optimized */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full mx-auto shadow-2xl border-2" style={{ borderColor: themeColors.lightPink }}>
              <div className="text-center">
                <div className="text-4xl mb-4">🗑️</div>
                <h3 className="text-lg font-bold mb-2" style={{ color: themeColors.textPrimary }}>
                  ยืนยันการลบ
                </h3>
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                  คุณแน่ใจหรือไม่ที่จะลบการแจ้งเตือนทั้งกลุ่มนี้? การดำเนินการนี้ไม่สามารถยกเลิกได้
                </p>
                
                {/* Show notification group details */}
                {(() => {
                  const groupToDelete = groupNotifications(notifications).find(g => g.groupId === showDeleteConfirm)
                  return groupToDelete ? (
                    <div className="mb-4 p-3 rounded-2xl text-left bg-gray-50">
                      <p className="font-medium text-sm mb-1" style={{ color: themeColors.textPrimary }}>
                        📋 {groupToDelete.title}
                      </p>
                      <p className="text-xs text-gray-600 mb-2">
                        💊 {groupToDelete.medicine.medicineName}
                      </p>
                      <div className="text-xs text-gray-600">
                        <p className="font-medium mb-1">ช่วงเวลาที่จะถูกลบ:</p>
                        {groupToDelete.notifications.map((notif) => (
                          <p key={notif.id} className="text-xs">
                            • ⏰ {formatTimeToHHMMLocal(notif.scheduledTime)} ({formatTimeType(notif.timeType)})
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : null
                })()}
                
                {/* Action Buttons - Mobile Stack */}
                <div className="flex flex-col gap-3">
                  <LoadingButton
                    onClick={() => handleDeleteNotificationGroup(showDeleteConfirm)}
                    className="w-full py-3 rounded-2xl text-white font-semibold text-sm transition-all duration-200 active:scale-95"
                    style={{ 
                      background: isDeleting 
                        ? 'linear-gradient(135deg, #9ca3af, #6b7280)' 
                        : 'linear-gradient(135deg, #f87171, #ef4444)',
                      minHeight: '48px',
                      border: 'none'
                    }}
                    isLoading={isDeleting}
                    loadingText="กำลังลบ..."
                    disabled={isDeleting}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span>🗑️</span>
                      <span>ลบทั้งกลุ่ม</span>
                    </span>
                  </LoadingButton>
                  <button 
                    onClick={() => setShowDeleteConfirm(null)}
                    disabled={isDeleting}
                    className="w-full py-3 rounded-2xl font-semibold text-sm border-2 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                      borderColor: themeColors.textSecondary,
                      color: themeColors.textSecondary,
                      backgroundColor: 'transparent',
                      minHeight: '48px'
                    }}
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Toast Notification */}
        <Toast toast={toast} onClose={() => {}} />
      </div>
    </div>
  )
}
