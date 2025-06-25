'use client'

import { useState, useEffect } from 'react'
import LoadingButton from '@/components/LoadingButton'
import Toast, { useToast } from '@/components/Toast'
import { localStorageService } from '../../../lib/localStorage'
import LoadingSpinner from '@/components/LoadingSpinner'

// Define the shape of the consumption time state
interface ConsumptionTimes {
  morning: boolean
  afternoon: boolean
  evening: boolean
  beforeBed: boolean
}

// Define medicine data interface
interface MedicineData {
  id: string
  medicineName: string
  medicineDetails: string
  consumptionType: string
  quantity: number
  currentStock: number // Add currentStock field
  dosage: number
  consumptionTimes: ConsumptionTimes
  medicineImageUrl?: string
  createdAt: string
}

// Define patient data interface (same as userinfo)
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

// Theme colors (same as userinfo)
const themeColors = {
  bgGradient: 'linear-gradient(135deg, #FFF6F6 0%, #FFDFDF 50%, #AEDEFC 100%)',
  pink: '#FB929E',
  lightPink: '#FFDFDF',
  lightBlue: '#AEDEFC',
  white: '#FFF6F6',
  textPrimary: '#575757',
  textSecondary: '#757575',
}

export default function Medicine() {
  const [medicineImage, setMedicineImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [medicineName, setMedicineName] = useState('')
  const [medicineDetails, setMedicineDetails] = useState('')
  const [consumptionType, setConsumptionType] = useState('')
  const [quantity, setQuantity] = useState('')
  const [dosage, setDosage] = useState('')
  const [consumptionTimes, setConsumptionTimes] = useState<ConsumptionTimes>({
    morning: false,
    afternoon: false,
    evening: false,
    beforeBed: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [medicines, setMedicines] = useState<MedicineData[]>([])
  const [isLoadingMedicines, setIsLoadingMedicines] = useState(true)
  const [editingMedicine, setEditingMedicine] = useState<MedicineData | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Toast notification
  const { toast, showToast } = useToast()

  // Load medicines from database
  useEffect(() => {
    loadMedicines()
  }, [])

  const loadMedicines = async () => {
    try {
      setIsLoadingMedicines(true)
      const patientData = localStorageService.getItem<PatientData>('patient-data')
      
      if (!patientData?.phoneNumber) {
        console.log('No patient data found')
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
    } finally {
      setIsLoadingMedicines(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        e.target.value = ''; // Clear the file input
        return;
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setMedicineImage(file)
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setConsumptionTimes(prev => ({ ...prev, [name]: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const patientData = localStorageService.getItem<PatientData>('patient-data')
      if (!patientData?.phoneNumber) {
        showToast('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบก่อน', 'error')
        setIsLoading(false)
        return
      }

      // Create FormData for API submission
      const formDataPayload = new FormData()
      // Append all fields
      formDataPayload.append('phoneNumber', patientData.phoneNumber)
      formDataPayload.append('medicineName', medicineName)
      formDataPayload.append('medicineDetails', medicineDetails)
      formDataPayload.append('consumptionType', consumptionType)
      formDataPayload.append('quantity', quantity)
      formDataPayload.append('dosage', dosage)
      formDataPayload.append('consumptionTimes', JSON.stringify(consumptionTimes))
      
      // If editing, add medicine ID
      if (editingMedicine) {
        formDataPayload.append('medicineId', editingMedicine.id)
      }
      
      // Append image if exists
      if (medicineImage) {
        formDataPayload.append('medicineImage', medicineImage)
      }

      console.log(editingMedicine ? 'Updating medicine data...' : 'Submitting medicine data...')

      const response = await fetch('/api/medicines', {
        method: editingMedicine ? 'PUT' : 'POST',
        body: formDataPayload,
      })

      if (!response.ok) {
        const errorResult = await response.json()
        throw new Error(errorResult.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล')
      }

      const result = await response.json()
      console.log('Medicine saved successfully:', result)

      // Reset form after successful submission
      resetForm()
      
      // Reload medicines list
      await loadMedicines()
      
      // Go back to medicine list and scroll to top
      setShowForm(false)
      
      // Scroll to top smoothly
      window.scrollTo({ 
        top: 0, 
        behavior: 'smooth' 
      })
      
    } catch (error) {
      console.error('Error adding medicine:', error)
      showToast(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Reset form function
  const resetForm = () => {
    setMedicineImage(null)
    setImagePreview('')
    setMedicineName('')
    setMedicineDetails('')
    setConsumptionType('')
    setQuantity('')
    setDosage('')
    setConsumptionTimes({
      morning: false,
      afternoon: false,
      evening: false,
      beforeBed: false,
    })
    setEditingMedicine(null)
  }

  // Load medicine data for editing
  const handleEditMedicine = (medicine: MedicineData) => {
    setEditingMedicine(medicine)
    setMedicineName(medicine.medicineName)
    setMedicineDetails(medicine.medicineDetails)
    setConsumptionType(medicine.consumptionType)
    setQuantity(medicine.quantity.toString())
    setDosage(medicine.dosage.toString())
    setConsumptionTimes(medicine.consumptionTimes)
    if (medicine.medicineImageUrl) {
      setImagePreview(medicine.medicineImageUrl)
    }
    setShowForm(true)
    
    // Scroll to top when opening form
    setTimeout(() => {
      window.scrollTo({ 
        top: 0, 
        behavior: 'smooth' 
      })
    }, 100)
  }

  // Delete medicine
  const handleDeleteMedicine = async (medicineId: string) => {
    try {
      setIsDeleting(true) // Start loading state
      const patientData = localStorageService.getItem<PatientData>('patient-data')
      if (!patientData?.phoneNumber) {
        showToast('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบก่อน', 'error')
        return
      }

      const response = await fetch(`/api/medicines?medicineId=${medicineId}&phoneNumber=${patientData.phoneNumber}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorResult = await response.json()
        throw new Error(errorResult.message || 'เกิดข้อผิดพลาดในการลบข้อมูล')
      }

      // Reload medicines list
      await loadMedicines()
      setShowDeleteConfirm(null)
      showToast('🗑️ ลบยาสำเร็จแล้ว!', 'success')
      
    } catch (error) {
      console.error('Error deleting medicine:', error)
      showToast(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบข้อมูล', 'error')
    } finally {
      setIsDeleting(false) // End loading state
    }
  }

  const formatConsumptionTimes = (times: ConsumptionTimes) => {
    const timeLabels = {
      morning: 'เช้า',
      afternoon: 'กลางวัน', 
      evening: 'เย็น',
      beforeBed: 'ก่อนนอน'
    }
    return Object.entries(times)
      .filter(([_, checked]) => checked)
      .map(([time, _]) => timeLabels[time as keyof ConsumptionTimes])
      .join(', ')
  }
  
  return (
    <div className="flex-1 px-3 pb-28 overflow-y-auto min-h-screen" style={{ background: themeColors.bgGradient }}>
      <div className="container mx-auto max-w-md py-4">
        {showForm ? (
          // Medicine Form View - Mobile First Design
          <div className="space-y-4">
            {/* Header - Mobile Optimized */}
            <div className="sticky top-0 z-10 pb-4 mb-2" style={{ background: themeColors.bgGradient }}>
              <div className="text-center mb-4">
                <h1 className="text-xl font-bold mb-1" style={{ color: themeColors.textPrimary }}>
                  {editingMedicine ? '✏️ แก้ไขข้อมูลยา' : '💊 เพิ่มยาใหม่'}
                </h1>
                <p className="text-gray-500 text-xs">ข้อมูลยาและการใช้งาน</p>
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
            <div className="bg-white/95 shadow-lg rounded-3xl border-2 backdrop-blur-sm" style={{ borderColor: themeColors.lightPink }}>
              <div className="p-4 sm:p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Medicine Name */}
                  <div>
                    <label className="block text-sm font-semibold mb-3" style={{ color: themeColors.textPrimary }}>
                      💊 ชื่อยา
                    </label>
                    <input 
                      type="text"
                      value={medicineName} 
                      onChange={(e) => setMedicineName(e.target.value)} 
                      className="w-full px-4 py-4 rounded-2xl text-base font-medium transition-all duration-200 shadow-sm focus:shadow-md focus:outline-none active:scale-98"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: `2px solid ${themeColors.lightPink}`,
                        color: themeColors.textPrimary,
                        backdropFilter: 'blur(10px)'
                      }}
                      placeholder="เช่น พาราเซตามอล"
                      required
                    />
                  </div>

                  {/* Medicine Details */}
                  <div>
                    <label className="block text-sm font-semibold mb-3" style={{ color: themeColors.textPrimary }}>
                      📋 รายละเอียดยา
                    </label>
                    <textarea 
                      value={medicineDetails} 
                      onChange={(e) => setMedicineDetails(e.target.value)} 
                      className="w-full px-4 py-4 rounded-2xl text-base font-medium transition-all duration-200 shadow-sm focus:shadow-md focus:outline-none active:scale-98 resize-none"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: `2px solid ${themeColors.lightPink}`,
                        color: themeColors.textPrimary,
                        backdropFilter: 'blur(10px)',
                        minHeight: '100px'
                      }}
                      placeholder="เช่น พาราเซตามอล 500 มก. สำหรับลดไข้ บรรเทาปวด"
                      rows={3}
                      required
                    />
                  </div>

                  {/* Consumption Type */}
                  <div>
                    <label className="block text-sm font-semibold mb-3" style={{ color: themeColors.textPrimary }}>
                      🍽️ ชนิดการกินยา
                    </label>
                    <select 
                      value={consumptionType} 
                      onChange={(e) => setConsumptionType(e.target.value)} 
                      className="w-full px-4 py-4 rounded-2xl text-base font-medium transition-all duration-200 shadow-sm focus:shadow-md focus:outline-none active:scale-98"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: `2px solid ${themeColors.lightPink}`,
                        color: themeColors.textPrimary,
                        backdropFilter: 'blur(10px)'
                      }}
                      required
                    >
                      <option disabled value="">เลือกชนิดการกิน</option>
                      <option>ก่อนอาหาร</option>
                      <option>หลังอาหาร</option>
                      <option>พร้อมอาหาร</option>
                    </select>
                  </div>

                  {/* Quantity & Dosage */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-3" style={{ color: themeColors.textPrimary }}>
                        💊 จำนวนยา (เม็ด)
                      </label>
                      <input 
                        type="number" 
                        value={quantity} 
                        onChange={(e) => setQuantity(e.target.value)} 
                        className="w-full px-4 py-4 rounded-2xl text-base font-medium transition-all duration-200 shadow-sm focus:shadow-md focus:outline-none active:scale-98" 
                        style={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          border: `2px solid ${themeColors.lightPink}`,
                          color: themeColors.textPrimary,
                          backdropFilter: 'blur(10px)'
                        }}
                        placeholder="เช่น 30"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-3" style={{ color: themeColors.textPrimary }}>
                        ⚖️ ขนาดการกิน (เม็ด/ครั้ง)
                      </label>
                      <input 
                        type="number" 
                        value={dosage} 
                        onChange={(e) => setDosage(e.target.value)} 
                        className="w-full px-4 py-4 rounded-2xl text-base font-medium transition-all duration-200 shadow-sm focus:shadow-md focus:outline-none active:scale-98" 
                        style={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          border: `2px solid ${themeColors.lightPink}`,
                          color: themeColors.textPrimary,
                          backdropFilter: 'blur(10px)'
                        }}
                        placeholder="เช่น 1"
                        min="1"
                        required
                      />
                    </div>
                  </div>

                  {/* Consumption Time */}
                  <div>
                    <label className="block text-sm font-semibold mb-3" style={{ color: themeColors.textPrimary }}>
                      ⏰ ช่วงเวลาของการกินยา
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl shadow-sm" 
                         style={{ 
                           backgroundColor: 'rgba(255, 255, 255, 0.9)',
                           border: `2px solid ${themeColors.lightPink}`,
                           backdropFilter: 'blur(10px)'
                         }}>
                      {Object.keys(consumptionTimes).map((time) => (
                        <label key={time} className="flex items-center gap-3 cursor-pointer p-3 rounded-xl transition-all duration-200 hover:bg-white/50 active:scale-95">
                          <input 
                            type="checkbox" 
                            name={time}
                            checked={consumptionTimes[time as keyof ConsumptionTimes]} 
                            onChange={handleTimeChange} 
                            className="w-5 h-5 rounded transition-all duration-200"
                            style={{ 
                              accentColor: themeColors.pink,
                              borderColor: themeColors.pink
                            }}
                          />
                          <span className="text-base font-medium" style={{ color: themeColors.textPrimary }}>
                            {
                              {
                                morning: '🌅 เช้า',
                                afternoon: '☀️ กลางวัน',
                                evening: '🌆 เย็น',
                                beforeBed: '🌙 ก่อนนอน'
                              }[time]
                            }
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Medicine Image */}
                  <div>
                    <label className="block text-sm font-semibold mb-3" style={{ color: themeColors.textPrimary }}>
                      📸 รูปภาพยา
                    </label>
                    
                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="mb-4 text-center">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-32 h-32 rounded-2xl object-cover border-2 mx-auto shadow-lg" 
                          style={{ borderColor: themeColors.pink }} 
                        />
                      </div>
                    )}
                    
                    {/* File Input */}
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/png, image/jpeg"
                        onChange={handleImageChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        id="medicine-image-upload"
                      />
                      <div className="flex items-center justify-center w-full p-6 border-2 border-dashed rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-98"
                           style={{ 
                             borderColor: themeColors.pink,
                             backgroundColor: 'rgba(255, 255, 255, 0.9)',
                             backdropFilter: 'blur(10px)'
                           }}>
                        <div className="text-center">
                          <div className="text-4xl mb-3" style={{ color: themeColors.pink }}>📷</div>
                          <p className="font-medium text-base mb-1" style={{ color: themeColors.textPrimary }}>คลิกเพื่อเลือกรูปภาพ</p>
                          <p className="text-sm" style={{ color: themeColors.textSecondary }}>PNG, JPG (แนะนำ)</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="space-y-4 mt-8">
                    <LoadingButton
                      type="submit"
                      size="lg"
                      className="w-full py-4 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
                      style={{
                        background: `linear-gradient(135deg, ${themeColors.pink}, ${themeColors.lightBlue})`,
                        border: 'none',
                        color: 'white'
                      }}
                      isLoading={isLoading}
                      loadingText="กำลังบันทึก..."
                      icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      }
                    >
                      {editingMedicine ? '✏️ บันทึกการแก้ไข' : '💊 เพิ่มยาใหม่'}
                    </LoadingButton>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : (
          // Medicine List View - Mobile First Design
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2" style={{ color: themeColors.textPrimary }}>💊 ยาของคุณ</h1>
              <p className="text-base" style={{ color: themeColors.textSecondary }}>จัดการข้อมูลยาและรับการแจ้งเตือน</p>
            </div>

            {/* Add Medicine Button */}
            <div className="flex justify-center mb-8">
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
                className="flex items-center gap-3 px-8 py-4 rounded-2xl text-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${themeColors.pink}, ${themeColors.lightBlue})`,
                  border: 'none',
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>เพิ่มยาใหม่</span>
              </button>
            </div>

            {/* Medicine Cards */}
            <div className="space-y-4">
              {isLoadingMedicines ? (
                <div className="text-center py-16">
                  <LoadingSpinner size="lg" color="primary" />
                  <p className="font-medium text-lg mt-4" style={{ color: themeColors.textPrimary }}>กำลังโหลดข้อมูลยา...</p>
                </div>
              ) : medicines.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-8xl mb-6">💊</div>
                  <p className="text-xl font-medium mb-2" style={{ color: themeColors.textPrimary }}>ยังไม่มีข้อมูลยา</p>
                  <p className="text-base" style={{ color: themeColors.textSecondary }}>กดปุ่ม "เพิ่มยาใหม่" เพื่อเพิ่มข้อมูลยา</p>
                </div>
              ) : (
                medicines.map((medicine) => (
                  <div key={medicine.id} className="bg-white/95 shadow-lg rounded-3xl border-2 backdrop-blur-sm" style={{ borderColor: themeColors.lightPink }}>
                    <div className="p-6">
                      <div className="flex gap-4 mb-4">
                        {/* Medicine Image */}
                        <div className="flex-shrink-0">
                          {medicine.medicineImageUrl ? (
                            <img 
                              src={medicine.medicineImageUrl} 
                              alt={medicine.medicineName}
                              className="w-24 h-24 rounded-2xl object-cover border-2 shadow-md"
                              style={{ borderColor: themeColors.pink }}
                            />
                          ) : (
                            <div 
                              className="w-24 h-24 rounded-2xl flex items-center justify-center border-2 shadow-md"
                              style={{ 
                                borderColor: themeColors.pink,
                                backgroundColor: themeColors.lightPink
                              }}
                            >
                              <span className="text-3xl">💊</span>
                            </div>
                          )}
                        </div>

                        {/* Medicine Info */}
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-2" style={{ color: themeColors.textPrimary }}>
                            {medicine.medicineName}
                          </h3>
                          <p className="text-base font-medium mb-4" style={{ color: themeColors.textSecondary }}>
                            {medicine.medicineDetails}
                          </p>
                        </div>
                      </div>
                      
                      {/* Medicine Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div className="bg-white/80 p-3 rounded-xl shadow-sm">
                          <span className="text-sm font-semibold block mb-1" style={{ color: themeColors.textPrimary }}>🍽️ ชนิดการกิน:</span>
                          <p className="text-base font-medium" style={{ color: themeColors.textSecondary }}>{medicine.consumptionType}</p>
                        </div>
                        <div className="bg-white/80 p-3 rounded-xl shadow-sm">
                          <span className="text-sm font-semibold block mb-1" style={{ color: themeColors.textPrimary }}>⏰ ช่วงเวลา:</span>
                          <p className="text-base font-medium" style={{ color: themeColors.textSecondary }}>{formatConsumptionTimes(medicine.consumptionTimes)}</p>
                        </div>
                        <div className="bg-white/80 p-3 rounded-xl shadow-sm">
                          <span className="text-sm font-semibold block mb-1" style={{ color: themeColors.textPrimary }}>💊 จำนวนทั้งหมด:</span>
                          <p className="text-base font-medium" style={{ color: themeColors.textSecondary }}>{medicine.quantity} เม็ด</p>
                        </div>
                        <div className="bg-white/80 p-3 rounded-xl shadow-sm">
                          <span className="text-sm font-semibold block mb-1" style={{ color: themeColors.textPrimary }}>⚖️ ขนาดการกิน:</span>
                          <p className="text-base font-medium" style={{ color: themeColors.textSecondary }}>{medicine.dosage} เม็ด/ครั้ง</p>
                        </div>
                      </div>
                      
                      {/* Stock Status */}
                      <div className="mb-4">
                        <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                          medicine.currentStock > 10 
                            ? 'bg-green-100 text-green-800' 
                            : medicine.currentStock > 0 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          📦 เหลือ {medicine.currentStock} เม็ด
                        </span>
                        {medicine.currentStock <= 5 && medicine.currentStock > 0 && (
                          <span className="ml-2 text-sm text-yellow-600 font-medium">⚠️ ยาเหลือน้อย</span>
                        )}
                        {medicine.currentStock === 0 && (
                          <span className="ml-2 text-sm text-red-600 font-medium">❌ หมดยา</span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 mt-6">
                        <LoadingButton
                          onClick={() => handleEditMedicine(medicine)}
                          isLoading={false}
                          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
                          style={{ 
                            backgroundColor: themeColors.pink,
                            border: 'none'
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>แก้ไข</span>
                        </LoadingButton>
                        <button 
                          onClick={() => setShowDeleteConfirm(medicine.id)}
                          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
                          style={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            color: '#ef4444',
                            border: '2px solid #ef4444'
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>ลบ</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal - Mobile First Design */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="modal-overlay absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(null)}></div>
            <div className="bg-white/95 rounded-3xl shadow-2xl max-w-sm w-full p-6 relative z-10 border-2 backdrop-blur-sm" style={{ borderColor: themeColors.lightPink }}>
              {/* Modal Header */}
              <div className="text-center mb-4">
                <div className="text-4xl mb-3">🗑️</div>
                <h3 className="text-xl font-bold mb-2" style={{ color: themeColors.textPrimary }}>
                  ยืนยันการลบยา
                </h3>
                <p className="text-base font-medium" style={{ color: themeColors.textSecondary }}>
                  คุณแน่ใจหรือว่าต้องการลบยานี้?
                </p>
                <p className="text-sm mt-2" style={{ color: themeColors.textSecondary }}>
                  ข้อมูลยาจะถูกลบอย่างถาวร
                </p>
              </div>
              
              {/* Modal Actions */}
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setShowDeleteConfirm(null)}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 rounded-2xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: themeColors.textPrimary,
                    border: `2px solid ${themeColors.lightPink}`,
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  ยกเลิก
                </button>
                <LoadingButton
                  onClick={() => handleDeleteMedicine(showDeleteConfirm!)}
                  isLoading={isDeleting}
                  loadingText="กำลังลบ..."
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 rounded-2xl text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
                  style={{ 
                    backgroundColor: isDeleting ? '#9ca3af' : '#ef4444',
                    border: 'none'
                  }}
                >
                  ลบยา
                </LoadingButton>
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
