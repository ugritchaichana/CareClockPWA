'use client'

import { useEffect, useState } from 'react'
import { localStorageService } from '../../lib/localStorage'
import Link from 'next/link'

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

const medicineColorPalette = [
  { bg: '#FB929E', text: '#FFFFFF' }, // Pink
  { bg: '#AEDEFC', text: '#575757' }, // Blue
  { bg: '#FBC492', text: '#575757' }, // Peach
  { bg: '#A8E6CF', text: '#575757' }, // Mint
  { bg: '#D7BDE2', text: '#575757' }, // Lavender
  { bg: '#F7DC6F', text: '#575757' }, // Yellow
];
// --- END NEW THEME COLORS ---

interface Medicine {
  id: string
  name: string
  dosage: string
  frequency: string
  timeSchedule: string[]
  notes: string
  startDate: string
  endDate: string
  color: { bg: string; text: string } // Updated color type
  isActive: boolean
  remainingDays: number
}

const timeSlots = [
  '06:00', '07:00', '08:00', '09:00',
  '12:00', '13:00',
  '18:00', '19:00', '20:00', '21:00', '22:00'
]

export default function MedicinePage() {
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [showForm, setShowForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: 'วันละ 1 ครั้ง',
    timeSchedule: [] as string[],
    notes: '',
    startDate: '',
    endDate: '',
    color: medicineColorPalette[0] // Default to the first color object
  })

  useEffect(() => {
    const savedMedicines = localStorageService.getItem<Medicine[]>('medicines') || []
    // --- Data Migration for new color format ---
    const migratedMedicines = savedMedicines.map(med => {
      if (typeof med.color === 'string') {
        return { ...med, color: medicineColorPalette[0] }; // Migrate old string format to new object format
      }
      return med;
    });
    setMedicines(migratedMedicines)

    const today = new Date().toISOString().split('T')[0]
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)
    
    setFormData(prev => ({
      ...prev,
      startDate: today,
      endDate: futureDate.toISOString().split('T')[0]
    }))
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleTimeScheduleChange = (time: string) => {
    setFormData(prev => ({
      ...prev,
      timeSchedule: prev.timeSchedule.includes(time)
        ? prev.timeSchedule.filter(t => t !== time)
        : [...prev.timeSchedule, time].sort()
    }))
  }

  const calculateRemainingDays = (endDate: string): number => {
    const end = new Date(endDate)
    const now = new Date()
    now.setHours(0, 0, 0, 0); // Compare dates only
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.dosage || formData.timeSchedule.length === 0) {
      alert('กรุณากรอกชื่อยา, ขนาด, และเลือกเวลาทานยา')
      return
    }
    setIsLoading(true)

    const medicineData: Medicine = {
      id: editingId || Date.now().toString(),
      ...formData,
      isActive: true,
      remainingDays: calculateRemainingDays(formData.endDate)
    }

    let updatedMedicines: Medicine[]
    if (editingId) {
      updatedMedicines = medicines.map(med => med.id === editingId ? medicineData : med)
    } else {
      updatedMedicines = [...medicines, medicineData]
    }

    localStorageService.setItem('medicines', updatedMedicines)
    setMedicines(updatedMedicines)

    // Reset form and close modal
    const today = new Date().toISOString().split('T')[0]
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)
    setFormData({
      name: '',
      dosage: '',
      frequency: 'วันละ 1 ครั้ง',
      timeSchedule: [],
      notes: '',
      startDate: today,
      endDate: futureDate.toISOString().split('T')[0],
      color: medicineColorPalette[Math.floor(Math.random() * medicineColorPalette.length)]
    })
    setShowForm(false)
    setEditingId(null)
    setIsLoading(false)
    alert(editingId ? 'แก้ไขข้อมูลยาเรียบร้อยแล้ว!' : 'เพิ่มยาใหม่เรียบร้อยแล้ว!')
  }

  const handleEdit = (medicine: Medicine) => {
    setFormData({
      name: medicine.name,
      dosage: medicine.dosage,
      frequency: medicine.frequency,
      timeSchedule: medicine.timeSchedule,
      notes: medicine.notes,
      startDate: medicine.startDate,
      endDate: medicine.endDate,
      color: medicine.color
    })
    setEditingId(medicine.id)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('คุณต้องการลบข้อมูลยานี้ใช่หรือไม่?')) {
      const updatedMedicines = medicines.filter(med => med.id !== id)
      localStorageService.setItem('medicines', updatedMedicines)
      setMedicines(updatedMedicines)
    }
  }

  const toggleMedicineStatus = (id: string) => {
    const updatedMedicines = medicines.map(med =>
      med.id === id ? { ...med, isActive: !med.isActive } : med
    )
    localStorageService.setItem('medicines', updatedMedicines)
    setMedicines(updatedMedicines)
  }

  const openAddForm = () => {
    setEditingId(null);
    const today = new Date().toISOString().split('T')[0]
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)
    setFormData({
        name: '',
        dosage: '',
        frequency: 'วันละ 1 ครั้ง',
        timeSchedule: [],
        notes: '',
        startDate: today,
        endDate: futureDate.toISOString().split('T')[0],
        color: medicineColorPalette[Math.floor(Math.random() * medicineColorPalette.length)]
    });
    setShowForm(true);
  }

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
          <h1 className="text-xl font-bold" style={{ color: themeColors.textPrimary }}>ยาของคุณ</h1>
        </div>
        <div className="flex-none">
          <button onClick={openAddForm} className="btn btn-circle text-white" style={{ background: themeColors.pink, border: 'none' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {medicines.length === 0 && !showForm && (
          <div className="text-center mt-20 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full flex items-center justify-center bg-white/80 mb-4">
                <span className="text-5xl">💊</span>
            </div>
            <h2 className="text-xl font-bold text-gray-600">ยังไม่มียาในระบบ</h2>
            <p className="text-gray-500 mb-6">เพิ่มยาของคุณเพื่อเริ่มใช้งาน</p>
            <button onClick={openAddForm} className="btn text-white shadow-lg" style={{ background: themeColors.pink, border: 'none' }}>
              + เพิ่มยาใหม่
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {medicines.map(med => (
            <div key={med.id} className={`card bg-white/90 shadow-lg transition-all duration-300 ${!med.isActive ? 'opacity-60' : ''}`}>
              <div className="card-body p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: med.color.bg, color: med.color.text }}>
                    💊
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h2 className="card-title text-base font-bold" style={{ color: themeColors.textPrimary }}>{med.name}</h2>
                      <input type="checkbox" className="toggle toggle-sm" style={{'--tglbg': themeColors.lightBlue, '--handle-bg':themeColors.white, '--handle-border': '2px solid ' + themeColors.white} as React.CSSProperties} checked={med.isActive} onChange={() => toggleMedicineStatus(med.id)} />
                    </div>
                    <p className="text-sm text-gray-600">{med.dosage}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span>{med.timeSchedule.join(', ')}</span>
                    </div>
                     {med.remainingDays <= 7 && med.isActive && (
                        <div className={`mt-2 text-xs font-bold ${med.remainingDays <= 3 ? 'text-red-500' : 'text-yellow-600'}`}>
                            {med.remainingDays > 0 ? `เหลืออีก ${med.remainingDays} วัน` : 'ยาหมดแล้ว'}
                        </div>
                    )}
                  </div>
                </div>
                <div className="card-actions justify-end mt-2">
                  <button onClick={() => handleEdit(med)} className="btn btn-xs btn-ghost" style={{ color: themeColors.textSecondary }}>แก้ไข</button>
                  <button onClick={() => handleDelete(med.id)} className="btn btn-xs btn-ghost text-red-500">ลบ</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-40 flex justify-center items-end sm:items-center animate-fade-in">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 w-full max-w-md shadow-xl transform transition-all animate-slide-up">
            <h3 className="text-xl font-bold mb-4 text-center" style={{ color: themeColors.textPrimary }}>{editingId ? 'แก้ไขข้อมูลยา' : 'เพิ่มยาใหม่'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="label-text">ชื่อยา</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="เช่น พาราเซตามอล" className="input input-bordered w-full bg-gray-50" required />
              </div>
              <div>
                <label className="label-text">ขนาดรับประทาน</label>
                <input type="text" name="dosage" value={formData.dosage} onChange={handleInputChange} placeholder="เช่น 1 เม็ด" className="input input-bordered w-full bg-gray-50" required />
              </div>
              <div>
                <label className="label-text">เวลาที่ต้องทาน</label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {timeSlots.map(time => (
                    <button key={time} type="button" onClick={() => handleTimeScheduleChange(time)} className={`btn btn-sm ${formData.timeSchedule.includes(time) ? 'text-white' : 'btn-ghost'}`} style={{backgroundColor: formData.timeSchedule.includes(time) ? themeColors.pink : '#F0F0F0'}}>
                      {time}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label-text">หมายเหตุ</label>
                <textarea name="notes" value={formData.notes} onChange={handleInputChange} className="textarea textarea-bordered w-full bg-gray-50" placeholder="เช่น ทานหลังอาหารทันที"></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-text">วันเริ่มต้น</label>
                  <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className="input input-bordered w-full bg-gray-50" />
                </div>
                <div>
                  <label className="label-text">วันสิ้นสุด</label>
                  <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} className="input input-bordered w-full bg-gray-50" />
                </div>
              </div>
              <div>
                <label className="label-text">เลือกสี</label>
                <div className="flex gap-2 mt-2">
                  {medicineColorPalette.map(color => (
                    <button key={color.bg} type="button" onClick={() => setFormData(prev => ({ ...prev, color }))} className={`w-8 h-8 rounded-full transition-transform ${formData.color.bg === color.bg ? 'ring-2 ring-offset-2 ring-pink-400 scale-110' : ''}`} style={{ backgroundColor: color.bg }}></button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost w-1/2">ยกเลิก</button>
                <button type="submit" disabled={isLoading} className="btn text-white w-1/2" style={{ background: themeColors.pink, border: 'none' }}>
                  {isLoading ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
        <button className="active text-white" style={{ backgroundColor: themeColors.pink }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
          <span className="btm-nav-label text-xs">ยา</span>
        </button>
        <Link href="/notifications" className="text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="btm-nav-label text-xs">แจ้งเตือน</span>
        </Link>
        <Link href="/test" className="text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          <span className="btm-nav-label text-xs">สรุป</span>
        </Link>
      </div>
    </div>
  )
}
