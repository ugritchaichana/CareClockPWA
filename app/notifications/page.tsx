'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { localStorageService } from '../../lib/localStorage'

// --- NEW THEME COLORS ---
const themeColors = {
  bgGradient: 'linear-gradient(135deg, #FFF6F6 0%, #FFDFDF 50%, #AEDEFC 100%)',
  pink: '#FB929E',
  lightPink: '#FFDFDF',
  lightBlue: '#AEDEFC',
  white: '#FFF6F6',
  textPrimary: '#575757',
  textSecondary: '#757575',
};
// --- END NEW THEME COLORS ---

interface Medicine {
  id: string
  name: string
  dosage: string
  timeSchedule: string[]
  isActive: boolean
  remainingDays: number
  notes: string
}

interface Notification {
  id: string
  type: 'medicine-reminder' | 'reminder'
  title: string
  message: string
  time: string
  isRead: boolean
  isImportant: boolean
  medicineId?: string
  createdAt: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const generateMedicineNotifications = useCallback(() => {
    const medicineList = localStorageService.getItem<Medicine[]>('medicines') || []
    const now = new Date()
    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    const todayDateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD

    let newNotifications: Notification[] = []

    medicineList.forEach(medicine => {
      if (!medicine.isActive) return

      // Generate reminders for upcoming medication times
      medicine.timeSchedule.forEach(time => {
        if (time === currentTimeStr) {
          const notificationId = `med-${medicine.id}-${todayDateStr}-${time}`
          const existing = notifications.find(n => n.id === notificationId)
          if (!existing) {
            newNotifications.push({
              id: notificationId,
              type: 'medicine-reminder',
              title: `⏰ ได้เวลาทานยา: ${medicine.name}`,
              message: `ขนาด ${medicine.dosage}. ${medicine.notes || ''}`,
              time: currentTimeStr,
              isRead: false,
              isImportant: true,
              medicineId: medicine.id,
              createdAt: now.toISOString()
            })
          }
        }
      })

      // Generate low stock warnings
      if (medicine.remainingDays <= 3 && medicine.remainingDays > 0) {
        const lowStockId = `low-stock-${medicine.id}-${todayDateStr}`
        const existing = notifications.find(n => n.id === lowStockId)
        if (!existing) {
          newNotifications.push({
            id: lowStockId,
            type: 'reminder',
            title: `⚠️ ยาใกล้หมด: ${medicine.name}`,
            message: `เหลือสำหรับ ${medicine.remainingDays} วันสุดท้าย กรุณาเตรียมยาเพิ่ม`,
            time: currentTimeStr,
            isRead: false,
            isImportant: true,
            medicineId: medicine.id,
            createdAt: now.toISOString()
          })
        }
      }
    })

    if (newNotifications.length > 0) {
      setNotifications(prev => {
        const all = [...newNotifications, ...prev]
        localStorageService.setItem('notifications', all)
        return all
      })
    }
  }, [notifications]) // Dependency on notifications to avoid duplicates

  useEffect(() => {
    const savedNotifications = localStorageService.getItem<Notification[]>('notifications') || []
    setNotifications(savedNotifications)

    // Initial generation
    generateMedicineNotifications()

    // Set up interval to check for new notifications every minute
    const timer = setInterval(generateMedicineNotifications, 60000)
    return () => clearInterval(timer)
  }, [generateMedicineNotifications])

  const markAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
    setNotifications(updated)
    localStorageService.setItem('notifications', updated)
  }

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, isRead: true }))
    setNotifications(updated)
    localStorageService.setItem('notifications', updated)
  }

  const deleteNotification = (id: string) => {
    const updated = notifications.filter(n => n.id !== id)
    setNotifications(updated)
    localStorageService.setItem('notifications', updated)
  }

  const clearAllNotifications = () => {
    if (confirm('คุณต้องการลบการแจ้งเตือนทั้งหมดใช่หรือไม่?')) {
      setNotifications([])
      localStorageService.removeItem('notifications')
    }
  }

  const getFilteredNotifications = () => {
    const filtered = filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'medicine-reminder': return '💊'
      case 'reminder': return '⚠️'
      default: return '🔔'
    }
  }

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000)

    if (diffSeconds < 60) return `เมื่อสักครู่`
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} นาทีที่แล้ว`
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} ชั่วโมงที่แล้ว`
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="min-h-screen flex flex-col" style={{ background: themeColors.bgGradient }}>
      {/* Header */}
      <div className="navbar bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-30" style={{ borderBottom: `1px solid ${themeColors.lightPink}` }}>
        <div className="flex-none">
          <Link href="/" className="btn btn-ghost btn-circle">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </Link>
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold" style={{ color: themeColors.textPrimary }}>การแจ้งเตือน</h1>
        </div>
        <div className="flex-none">
          <button onClick={clearAllNotifications} className="btn btn-ghost btn-circle" disabled={notifications.length === 0}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {/* Filter Tabs */}
        <div className="flex justify-center mb-4">
            <div className="tabs tabs-boxed bg-white/60">
                <a className={`tab ${filter === 'all' ? 'tab-active !bg-pink-200 !text-pink-800' : ''}`} onClick={() => setFilter('all')}>ทั้งหมด</a> 
                <a className={`tab ${filter === 'unread' ? 'tab-active !bg-pink-200 !text-pink-800' : ''}`} onClick={() => setFilter('unread')}>
                    ยังไม่อ่าน {unreadCount > 0 && <div className="badge badge-sm ml-2 bg-pink-500 text-white border-0">{unreadCount}</div>}
                </a>
            </div>
        </div>

        {getFilteredNotifications().length === 0 ? (
          <div className="text-center mt-20 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full flex items-center justify-center bg-white/80 mb-4">
                <span className="text-5xl">🎉</span>
            </div>
            <h2 className="text-xl font-bold text-gray-600">ไม่มีการแจ้งเตือน</h2>
            <p className="text-gray-500">ทุกอย่างเรียบร้อยดี!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {getFilteredNotifications().map(n => (
              <div key={n.id} className={`card bg-white/90 shadow-md transition-all duration-300 ${n.isRead ? 'opacity-60' : ''}`}>
                <div className="card-body p-4">
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${n.type === 'medicine-reminder' ? 'bg-pink-100' : 'bg-yellow-100'}`}>
                      {getNotificationIcon(n.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-md" style={{ color: themeColors.textPrimary }}>{n.title}</h3>
                        {!n.isRead && <div className="w-2.5 h-2.5 bg-blue-400 rounded-full"></div>}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                      <span className="text-xs text-gray-400 mt-2 block">{formatTimeAgo(n.createdAt)}</span>
                    </div>
                  </div>
                  {!n.isRead && (
                    <div className="card-actions justify-end mt-2">
                      <button onClick={() => markAsRead(n.id)} className="btn btn-xs" style={{backgroundColor: themeColors.lightBlue, color: themeColors.textPrimary, border: 'none'}}>อ่านแล้ว</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {notifications.length > 0 && (
            <div className="text-center mt-6">
                <button onClick={markAllAsRead} className="btn btn-sm btn-ghost text-gray-500">ทำเครื่องหมายว่าอ่านทั้งหมด</button>
            </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <div className="btm-nav bg-white/90 backdrop-blur-sm shadow-lg" style={{ borderTop: `1px solid ${themeColors.lightPink}` }}>
        <Link href="/" className="text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          <span className="btm-nav-label text-xs">หน้าแรก</span>
        </Link>
        <Link href="/patient-info" className="text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          <span className="btm-nav-label text-xs">ข้อมูล</span>
        </Link>
        <Link href="/medicine" className="text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
          <span className="btm-nav-label text-xs">ยา</span>
        </Link>
        <button className="active text-white" style={{ backgroundColor: themeColors.pink }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="btm-nav-label text-xs">แจ้งเตือน</span>
        </button>
        <Link href="/test" className="text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          <span className="btm-nav-label text-xs">สรุป</span>
        </Link>
      </div>
    </div>
  )
}
