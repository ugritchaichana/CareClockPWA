'use client'

import { useState, useEffect } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'
import LoadingButton from '@/components/LoadingButton'
import { localStorageService } from '../../../lib/localStorage'
import { notificationManager, NotificationManager } from '../../../lib/notificationManager'
import { AlarmAudio, AlarmTypes, AlarmType } from '../../../lib/audio'

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

  // Helper function to format DateTime to HH:mm
  const formatTimeToHHMM = (dateTime: string) => {
    const date = new Date(dateTime)
    return date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
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
      
      // Validate time format (HH:mm)
      const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
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
        .map(([timeType, time]) => ({
          phoneNumber: patientData.phoneNumber,
          medicineId: parseInt(selectedMedicine),
          title: title, // Use original title
          message: message || null,
          scheduledTime: time, // Send time as HH:mm string format
          timeType,
          groupId, // Add group ID for grouping notifications
          isActive: true
        }))

      // Send each notification
      for (const notificationData of notifications) {
        console.log('Sending notification data:', notificationData) // Debug log
        
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
          notificationManager.addNotification({
            id: `server-${notification.id}`,
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
    <div className="flex-1 px-4 pb-24 overflow-y-auto">
      <div className="container mx-auto max-w-2xl py-8">
        {showForm ? (
          // Notification Form View - Full Screen
          <div>
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-1" style={{ color: themeColors.textPrimary }}>
                {editingNotification ? 'แก้ไขการแจ้งเตือน' : 'ตั้งการแจ้งเตือนใหม่'}
              </h1>
              <p className="text-gray-500 text-sm">ตั้งเวลาแจ้งเตือนกินยา</p>
            </div>

            {/* Back Button */}
            <div className="mb-6">
              <button
                onClick={() => {
                  resetForm()
                  setShowForm(false)
                  // Scroll to top when going back to list
                  setTimeout(() => {
                    window.scrollTo({ 
                      top: 0, 
                      behavior: 'smooth' 
                    })
                  }, 100)
                }}
                className="btn btn-ghost"
                style={{ color: themeColors.textPrimary }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                กลับ
              </button>
            </div>

            <div className="card bg-white/90 shadow-xl rounded-3xl border-2" style={{ borderColor: themeColors.lightPink }}>
              <div className="card-body p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Medicine Selection */}
                  <div>
                    <label className="label">
                      <span className="label-text font-medium text-gray-800">เลือกยา</span>
                    </label>
                    <select 
                      value={selectedMedicine} 
                      onChange={(e) => setSelectedMedicine(e.target.value)}
                      className="select select-bordered bg-gray-50 text-gray-800 font-medium w-full"
                      style={{ borderColor: themeColors.pink }}
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

                  {/* Title */}
                  <div>
                    <label className="label">
                      <span className="label-text font-medium text-gray-800">หัวข้อการแจ้งเตือน</span>
                    </label>
                    <input 
                      type="text" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="เช่น กินยาความดันโลหิตสูง"
                      className="input input-bordered bg-gray-50 text-gray-800 font-medium w-full"
                      style={{ borderColor: themeColors.pink }}
                      required
                    />
                  </div>

                  {/* Dynamic Time Inputs based on selected medicine */}
                  {selectedMedicine && medicines.find(med => med.id === parseInt(selectedMedicine)) && (
                    <div>
                      <label className="label">
                        <span className="label-text font-medium text-gray-800">เวลาแจ้งเตือน</span>
                      </label>
                      <div className="space-y-4">
                        {Object.entries(medicines.find(med => med.id === parseInt(selectedMedicine))!.consumptionTimes)
                          .filter(([_, isSelected]) => isSelected)
                          .map(([timeType, _]) => (
                            <div key={timeType} className="flex items-center gap-4">
                              <div className="w-24">
                                <span className="text-sm font-medium px-3 py-2 rounded-full inline-block text-center" 
                                      style={{ backgroundColor: themeColors.lightPink, color: themeColors.textPrimary }}>
                                  {getTimeTypeLabel(timeType)}
                                </span>
                              </div>
                              <div className="flex-1">
                                <input 
                                  type="time" 
                                  value={scheduledTimes[timeType as keyof typeof scheduledTimes] || ''}
                                  onChange={(e) => setScheduledTimes(prev => ({
                                    ...prev,
                                    [timeType]: e.target.value
                                  }))}
                                  className="input input-bordered bg-gray-50 text-gray-800 font-medium w-full"
                                  style={{ borderColor: themeColors.pink }}
                                  required
                                />
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Message */}
                  <div>
                    <label className="label">
                      <span className="label-text font-medium text-gray-800">ข้อความ (ไม่บังคับ)</span>
                    </label>
                    <textarea 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="ข้อความเพิ่มเติม..."
                      className="textarea textarea-bordered bg-gray-50 text-gray-800 font-medium w-full"
                      style={{ borderColor: themeColors.pink }}
                      rows={3}
                    />
                  </div>

                  {/* Form Actions */}
                  <div className="space-y-4 mt-6">
                    <LoadingButton
                      type="submit"
                      size="lg"
                      className="w-full"
                      style={{ 
                        background: isLoading 
                          ? 'linear-gradient(135deg, #9ca3af, #6b7280)' 
                          : `linear-gradient(135deg, ${themeColors.pink}, ${themeColors.lightBlue})`,
                        border: 'none'
                      }}
                      isLoading={isLoading}
                      loadingText="กำลังบันทึก..."
                      icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                      }
                    >
                      {editingNotification ? 'บันทึกการแก้ไข' : 'สร้างการแจ้งเตือน'}
                    </LoadingButton>
                    
                    <button 
                      type="button"
                      onClick={() => {
                        resetForm()
                        setShowForm(false)
                      }}
                      className="btn btn-lg btn-outline w-full"
                      style={{ 
                        borderColor: themeColors.textSecondary,
                        color: themeColors.textSecondary
                      }}
                    >
                      ยกเลิก
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : (
          // Notification List View
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-1" style={{ color: themeColors.textPrimary }}>การแจ้งเตือน</h1>
              <p className="text-gray-500 text-sm">แจ้งเตือนการกินยาและนัดหมาย</p>
            </div>

            {/* Add Notification Button */}
            <div className="flex justify-center">
              <button
                onClick={() => {
                  resetForm()
                  setShowForm(true)
                  // Scroll to top when opening form
                  setTimeout(() => {
                    window.scrollTo({ 
                      top: 0, 
                      behavior: 'smooth' 
                    })
                  }, 100)
                }}
                className="btn btn-lg text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${themeColors.pink}, ${themeColors.lightBlue})`,
                  border: 'none',
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span className="hover:animate-bounce">ตั้งแจ้งเตือน</span>
              </button>
            </div>

            {/* Notification Cards */}
            <div className="space-y-4">
              {isLoadingNotifications ? (
                <div className="text-center py-12">
                  <LoadingSpinner size="lg" color="primary" />
                  <p className="text-gray-700 mt-4 font-medium">กำลังโหลดการแจ้งเตือน...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">🔔</div>
                  <p className="text-gray-500">ยังไม่มีการแจ้งเตือน</p>
                  <p className="text-gray-400 text-sm">กดปุ่ม "ตั้งแจ้งเตือน" เพื่อเพิ่มการแจ้งเตือนใหม่</p>
                </div>
              ) : (
                groupNotifications(notifications).map((group) => (
                  <div key={group.groupId} className="card bg-white/90 shadow-xl rounded-3xl border-2" style={{ borderColor: themeColors.lightPink }}>
                    <div className="card-body p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold mb-1" style={{ color: themeColors.textPrimary }}>
                            {group.title}
                          </h3>
                          {group.message && (
                            <p className="text-sm text-gray-600 mb-2">{group.message}</p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-3">
                          <button 
                            onClick={() => handleToggleNotificationGroup(group.groupId, group.isActive)}
                            title={`${group.isActive ? 'ปิด' : 'เปิด'}การแจ้งเตือนทั้งกลุ่ม (ปัจจุบัน${group.isActive ? 'เปิดอยู่' : 'ปิดอยู่'})`}
                            className="px-3 py-2 rounded-full text-xs font-medium text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                            style={{
                              background: group.isActive 
                                ? `linear-gradient(135deg, ${themeColors.pink}, ${themeColors.lightBlue})` 
                                : 'linear-gradient(135deg, #9ca3af, #6b7280)'
                            }}
                          >
                            <span className="flex items-center gap-1.5">
                              <span className="text-sm">
                                {group.isActive ? '🔔' : '🔕'}
                              </span>
                              <span>{group.isActive ? 'เปิดอยู่' : 'ปิดอยู่'}</span>
                            </span>
                          </button>
                          <button 
                            onClick={() => setShowDeleteConfirm(group.groupId)}
                            className="px-3 py-2 rounded-full text-xs font-medium text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                            style={{
                              background: 'linear-gradient(135deg, #f87171, #ef4444)'
                            }}
                            title="ลบการแจ้งเตือนทั้งกลุ่ม"
                          >
                            <span className="flex items-center gap-1.5">
                              <span className="text-sm">🗑️</span>
                              <span>ลบ</span>
                            </span>
                          </button>
                        </div>
                      </div>
                      
                      {/* Time Schedule Display */}
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-2">
                          {group.notifications
                            .sort((a, b) => {
                              const order = { morning: 1, afternoon: 2, evening: 3, beforeBed: 4 }
                              return (order[a.timeType as keyof typeof order] || 5) - (order[b.timeType as keyof typeof order] || 5)
                            })
                            .map((notification) => (
                              <span 
                                key={notification.id}
                                className="text-sm px-3 py-1 rounded-full" 
                                style={{ backgroundColor: themeColors.lightBlue, color: themeColors.textPrimary }}
                              >
                                {getTimeTypeLabel(notification.timeType)} | {formatTimeToHHMM(notification.scheduledTime)}
                              </span>
                            ))}
                        </div>
                      </div>
                      
                      {/* Medicine Information */}
                      <div className="p-3 rounded-lg mb-3" style={{ backgroundColor: themeColors.white }}>
                        <p className="text-sm font-medium" style={{ color: themeColors.textPrimary }}>
                          💊 {group.medicine.medicineName}
                        </p>
                        <p className="text-sm" style={{ color: themeColors.textSecondary }}>
                          ขนาด: {group.medicine.dosage} เม็ด/ครั้ง
                        </p>
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${
                            group.medicine.currentStock > 10 
                              ? 'text-green-600' 
                              : group.medicine.currentStock > 5 
                              ? 'text-yellow-600' 
                              : 'text-red-600'
                          }`}>
                            คงเหลือ: {group.medicine.currentStock} เม็ด
                          </p>
                          {group.medicine.currentStock <= 5 && group.medicine.currentStock > 0 && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">⚠️ ยาเหลือน้อย</span>
                          )}
                          {group.medicine.currentStock === 0 && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">❌ หมดยา</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Status indicators for each time slot */}
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-2">
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

                      {/* Action Buttons for each notification */}
                      <div className="space-y-2">
                        {group.notifications.map((notification) => {
                          const isTakenToday = takenToday.has(notification.id)
                          return (
                            <div key={notification.id} className="flex items-center gap-2">
                              <span className="text-sm font-medium w-20" style={{ color: themeColors.textPrimary }}>
                                {getTimeTypeLabel(notification.timeType)}:
                              </span>
                              <div className="flex gap-2 flex-1">
                                {isTakenToday ? (
                                  <button
                                    onClick={() => recordMedicineConsumption(notification.id, notification.medicineId, 'cancel')}
                                    className="flex-1 px-3 py-1 rounded-lg text-xs font-medium text-white shadow-md hover:shadow-lg transition-all"
                                    style={{ background: 'linear-gradient(135deg, #6b7280, #4b5563)' }}
                                  >
                                    ↶ ยกเลิก
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => recordMedicineConsumption(notification.id, notification.medicineId, 'taken')}
                                      className="flex-1 px-3 py-1 rounded-lg text-xs font-medium text-white shadow-md hover:shadow-lg transition-all"
                                      style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                                    >
                                      ✓ กิน
                                    </button>
                                    <button
                                      onClick={() => recordMedicineConsumption(notification.id, notification.medicineId, 'skipped')}
                                      className="flex-1 px-3 py-1 rounded-lg text-xs font-medium text-white shadow-md hover:shadow-lg transition-all"
                                      style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                                    >
                                      ⏭ ข้าม
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
        
        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full mx-auto shadow-2xl border-2" style={{ borderColor: themeColors.lightPink }}>
              <div className="text-center">
                <div className="text-5xl mb-4">🗑️</div>
                <h3 className="text-xl font-bold mb-2" style={{ color: themeColors.textPrimary }}>
                  ยืนยันการลบการแจ้งเตือนกลุ่ม
                </h3>
                <p className="text-gray-600 mb-6">
                  คุณแน่ใจหรือไม่ที่จะลบการแจ้งเตือนทั้งกลุ่มนี้? การดำเนินการนี้จะลบการแจ้งเตือนทุกช่วงเวลาในกลุ่มและไม่สามารถยกเลิกได้
                </p>
                
                {/* Show notification group details */}
                {(() => {
                  const groupToDelete = groupNotifications(notifications).find(g => g.groupId === showDeleteConfirm)
                  return groupToDelete ? (
                    <div className="mb-6 p-4 rounded-lg text-left" style={{ backgroundColor: themeColors.white }}>
                      <p className="font-medium text-sm mb-2" style={{ color: themeColors.textPrimary }}>
                        📋 {groupToDelete.title}
                      </p>
                      <p className="text-xs text-gray-600 mb-2">
                        💊 {groupToDelete.medicine.medicineName}
                      </p>
                      <div className="text-xs text-gray-600">
                        <p className="font-medium mb-1">ช่วงเวลาที่จะถูกลบ:</p>
                        {groupToDelete.notifications.map((notif, idx) => (
                          <p key={notif.id}>
                            • ⏰ {formatTimeToHHMM(notif.scheduledTime)} ({formatTimeType(notif.timeType)})
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : null
                })()}
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 btn btn-outline"
                    style={{ 
                      borderColor: themeColors.textSecondary,
                      color: themeColors.textSecondary
                    }}
                  >
                    ยกเลิก
                  </button>
                  <button 
                    onClick={() => handleDeleteNotificationGroup(showDeleteConfirm)}
                    className="flex-1 btn text-white"
                    style={{ 
                      background: 'linear-gradient(135deg, #f87171, #ef4444)',
                      border: 'none'
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg">🗑️</span>
                      <span>ลบทั้งกลุ่ม</span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Toast Notification */}
        {toast.show && (
          <div className="fixed top-4 right-4 z-50 animate-bounce">
            <div className={`alert shadow-xl rounded-2xl border-2 ${
              toast.type === 'success' 
                ? 'bg-gradient-to-r from-green-400 to-green-500 text-white border-green-300' 
                : toast.type === 'error'
                ? 'bg-gradient-to-r from-red-400 to-red-500 text-white border-red-300'
                : 'bg-gradient-to-r from-blue-400 to-blue-500 text-white border-blue-300'
            }`}>
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{toast.message}</p>
                </div>
                <button 
                  onClick={() => setToast(prev => ({ ...prev, show: false }))}
                  className="btn btn-ghost btn-sm text-white hover:bg-white/20"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
