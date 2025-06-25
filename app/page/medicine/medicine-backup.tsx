'use client'

import { useState, useEffect } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'
import { localStorageService } from '../../../lib/localStorage'

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

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }))
    }, 3000)
  }

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
    } catch (error) {
      console.error('Error deleting medicine:', error)
      showToast(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบข้อมูล', 'error')
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
    <div className="flex-1 px-4 pb-24 overflow-y-auto">
      <div className="container mx-auto max-w-2xl py-8">
        {showForm ? (
          // Medicine Form View - Full Screen
          <div>
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-1" style={{ color: themeColors.textPrimary }}>
                {editingMedicine ? 'แก้ไขยา' : 'เพิ่มยาใหม่'}
              </h1>
              <p className="text-gray-500 text-sm">กรอกข้อมูลยาของคุณ</p>
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
                  {/* Medicine Name */}
                  <div>
                    <label className="label">
                      <span className="label-text font-medium text-gray-800">ชื่อยา</span>
                    </label>
                    <input 
                      type="text"
                      value={medicineName} 
                      onChange={(e) => setMedicineName(e.target.value)} 
                      className="input input-bordered bg-gray-50 text-gray-800 font-medium w-full" 
                      style={{ borderColor: themeColors.pink }}
                      placeholder="เช่น พาราเซตามอล"
                      required
                    />
                  </div>

                  {/* Medicine Details */}
                  <div>
                    <label className="label">
                      <span className="label-text font-medium text-gray-800">รายละเอียดยา</span>
                    </label>
                    <textarea 
                      value={medicineDetails} 
                      onChange={(e) => setMedicineDetails(e.target.value)} 
                      className="textarea textarea-bordered bg-gray-50 text-gray-800 font-medium w-full" 
                      style={{ borderColor: themeColors.pink }}
                      placeholder="เช่น พาราเซตามอล 500 มก. สำหรับลดไข้ บรรเทาปวด"
                      rows={3}
                      required
                    />
                  </div>

                  {/* Consumption Type */}
                  <div>
                    <label className="label">
                      <span className="label-text font-medium text-gray-800">ชนิดการกินยา</span>
                    </label>
                    <select 
                      value={consumptionType} 
                      onChange={(e) => setConsumptionType(e.target.value)} 
                      className="select select-bordered bg-gray-50 text-gray-800 font-medium w-full"
                      style={{ borderColor: themeColors.pink }}
                      required
                    >
                      <option disabled value="">เลือกชนิดการกิน</option>
                      <option>ก่อนอาหาร</option>
                      <option>หลังอาหาร</option>
                      <option>พร้อมอาหาร</option>
                    </select>
                  </div>

                  {/* Quantity & Dosage */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">
                        <span className="label-text font-medium text-gray-800">จำนวนยา (เม็ด)</span>
                      </label>
                      <input 
                        type="number" 
                        value={quantity} 
                        onChange={(e) => setQuantity(e.target.value)} 
                        className="input input-bordered bg-gray-50 text-gray-800 font-medium w-full" 
                        style={{ borderColor: themeColors.pink }}
                        placeholder="เช่น 30"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">
                        <span className="label-text font-medium text-gray-800">ขนาดการกิน (เม็ด/ครั้ง)</span>
                      </label>
                      <input 
                        type="number" 
                        value={dosage} 
                        onChange={(e) => setDosage(e.target.value)} 
                        className="input input-bordered bg-gray-50 text-gray-800 font-medium w-full" 
                        style={{ borderColor: themeColors.pink }}
                        placeholder="เช่น 1"
                        required
                      />
                    </div>
                  </div>

                  {/* Consumption Time */}
                  <div>
                    <label className="label">
                      <span className="label-text font-medium text-gray-800">ช่วงเวลาของการกินยา</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 p-3 rounded-lg bg-gray-50" style={{ border: '1px solid #FFDFDF' }}>
                      {Object.keys(consumptionTimes).map((time) => (
                        <label key={time} className="label cursor-pointer justify-start gap-3">
                          <input 
                            type="checkbox" 
                            name={time}
                            checked={consumptionTimes[time as keyof ConsumptionTimes]} 
                            onChange={handleTimeChange} 
                            className="checkbox"
                            style={{ 
                              accentColor: themeColors.pink,
                              borderColor: themeColors.pink
                            }}
                          />
                          <span className="label-text text-gray-700 font-medium">
                            {
                              {
                                morning: 'เช้า',
                                afternoon: 'กลางวัน',
                                evening: 'เย็น',
                                beforeBed: 'ก่อนนอน'
                              }[time]
                            }
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Medicine Image */}
                  <div>
                    <label className="label">
                      <span className="label-text font-medium text-gray-800">รูปภาพยา</span>
                    </label>
                    <div className="flex gap-4">
                      {/* Image Preview */}
                      {imagePreview && (
                        <div className="flex-shrink-0">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="w-20 h-20 rounded-xl object-cover border-2" 
                            style={{ borderColor: themeColors.pink }} 
                          />
                        </div>
                      )}
                      
                      {/* File Input */}
                      <div className="flex-1">
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/png, image/jpeg"
                            onChange={handleImageChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            id="medicine-image-upload"
                          />
                          <div className="flex items-center justify-center w-full p-6 border-2 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                               style={{ borderColor: themeColors.pink }}>
                            <div className="text-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              <p className="text-gray-500 text-sm">คลิกเพื่อเลือกรูปภาพ</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mt-6">
                    <button 
                      type="submit" 
                      className="btn btn-lg w-full text-white shadow-lg hover:shadow-xl transition-all"
                      style={{
                        background: `linear-gradient(135deg, ${themeColors.pink}, ${themeColors.lightBlue})`,
                        border: 'none',
                      }}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <LoadingSpinner />
                          กำลังบันทึก...
                        </div>
                      ) : (
                        editingMedicine ? 'บันทึกการแก้ไข' : 'เพิ่มยา'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : (
          // Medicine List View
          // Medicine List View
          <div className="space-y-6">            {/* Add Medicine Button */}
            <div className="flex justify-center">
              <button                onClick={() => {
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
                className="btn btn-lg text-white shadow-lg hover:shadow-xl transition-all"
                style={{
                  background: `linear-gradient(135deg, ${themeColors.pink}, ${themeColors.lightBlue})`,
                  border: 'none',
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                เพิ่มยา
              </button>
            </div>            {/* Medicine Cards */}
            <div className="space-y-4">
              {isLoadingMedicines ? (
                <div className="text-center py-12">
                  <LoadingSpinner />
                  <p className="text-gray-500 mt-4">กำลังโหลดข้อมูลยา...</p>
                </div>
              ) : medicines.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">💊</div>
                  <p className="text-gray-500">ยังไม่มีข้อมูลยา</p>
                  <p className="text-gray-400 text-sm">กดปุ่ม "เพิ่มยา" เพื่อเพิ่มข้อมูลยา</p>
                </div>
              ) : (
                medicines.map((medicine) => (
                  <div key={medicine.id} className="card bg-white/90 shadow-xl rounded-3xl border-2" style={{ borderColor: themeColors.lightPink }}>
                    <div className="card-body p-6">
                      <div className="flex gap-4">
                        {/* Medicine Image */}
                        <div className="flex-shrink-0">
                          {medicine.medicineImageUrl ? (
                            <img 
                              src={medicine.medicineImageUrl} 
                              alt={medicine.medicineName}
                              className="w-20 h-20 rounded-xl object-cover border-2"
                              style={{ borderColor: themeColors.pink }}
                            />
                          ) : (
                            <div 
                              className="w-20 h-20 rounded-xl flex items-center justify-center border-2"
                              style={{ 
                                borderColor: themeColors.pink,
                                backgroundColor: themeColors.lightPink
                              }}
                            >
                              <span className="text-2xl">💊</span>
                            </div>
                          )}
                        </div>

                        {/* Medicine Info */}
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-2" style={{ color: themeColors.textPrimary }}>
                            {medicine.medicineName}
                          </h3>
                          <p className="text-gray-600 text-sm mb-3">{medicine.medicineDetails}</p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">ชนิดการกิน:</span>
                              <p className="text-gray-600">{medicine.consumptionType}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">ช่วงเวลา:</span>
                              <p className="text-gray-600">{formatConsumptionTimes(medicine.consumptionTimes)}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">จำนวนทั้งหมด:</span>
                              <p className="text-gray-600">{medicine.quantity} เม็ด</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">ขนาดการกิน:</span>
                              <p className="text-gray-600">{medicine.dosage} เม็ด/ครั้ง</p>
                            </div>
                          </div>
                          
                          {/* Stock Status */}
                          <div className="mt-3">
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                              medicine.currentStock > 10 
                                ? 'bg-green-100 text-green-800' 
                                : medicine.currentStock > 0 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              เหลือ {medicine.currentStock} เม็ด
                            </span>
                            {medicine.currentStock <= 5 && medicine.currentStock > 0 && (
                              <span className="ml-2 text-xs text-yellow-600">⚠️ ยาเหลือน้อย</span>
                            )}
                            {medicine.currentStock === 0 && (
                              <span className="ml-2 text-xs text-red-600">❌ หมดยา</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4">
                        <button 
                          onClick={() => handleEditMedicine(medicine)}
                          className="btn btn-sm text-white shadow-md hover:shadow-lg transition-all"
                          style={{ backgroundColor: themeColors.pink }}
                        >
                          แก้ไข
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm(medicine.id)}
                          className="btn btn-sm btn-ghost text-red-600 shadow-md hover:shadow-lg transition-all"
                        >
                          ลบ
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          // Medicine Form View
          <div>
            {/* Back Button */}            <div className="mb-6">
              <button                onClick={() => {
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
            </div>            <div className="card bg-white/90 shadow-xl rounded-3xl border-2" style={{ borderColor: themeColors.lightPink }}>
              <div className="card-body p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Medicine Name */}
                  <div>
                    <label className="label">
                      <span className="label-text font-medium text-gray-800">ชื่อยา</span>
                    </label>
                    <input 
                      type="text"
                      value={medicineName} 
                      onChange={(e) => setMedicineName(e.target.value)} 
                      className="input input-bordered bg-gray-50 text-gray-800 font-medium w-full" 
                      style={{ borderColor: themeColors.pink }}
                      placeholder="เช่น พาราเซตามอล"
                      required
                    />
                  </div>

                  {/* Medicine Details */}
                  <div>
                    <label className="label">
                      <span className="label-text font-medium text-gray-800">รายละเอียดยา</span>
                    </label>
                    <textarea 
                      value={medicineDetails} 
                      onChange={(e) => setMedicineDetails(e.target.value)} 
                      className="textarea textarea-bordered bg-gray-50 text-gray-800 font-medium w-full" 
                      style={{ borderColor: themeColors.pink }}
                      placeholder="เช่น พาราเซตามอล 500 มก. สำหรับลดไข้ บรรเทาปวด"
                      rows={3}
                      required
                    />
                  </div>

                  {/* Consumption Type */}
                  <div>
                    <label className="label">
                      <span className="label-text font-medium text-gray-800">ชนิดการกินยา</span>
                    </label>
                    <select 
                      value={consumptionType} 
                      onChange={(e) => setConsumptionType(e.target.value)} 
                      className="select select-bordered bg-gray-50 text-gray-800 font-medium w-full"
                      style={{ borderColor: themeColors.pink }}
                      required
                    >
                      <option disabled value="">เลือกชนิดการกิน</option>
                      <option>ก่อนอาหาร</option>
                      <option>หลังอาหาร</option>
                      <option>พร้อมอาหาร</option>
                    </select>
                  </div>

                  {/* Quantity & Dosage */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">
                        <span className="label-text font-medium text-gray-800">จำนวนยา (เม็ด)</span>
                      </label>
                      <input 
                        type="number" 
                        value={quantity} 
                        onChange={(e) => setQuantity(e.target.value)} 
                        className="input input-bordered bg-gray-50 text-gray-800 font-medium w-full" 
                        style={{ borderColor: themeColors.pink }}
                        placeholder="เช่น 30"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">
                        <span className="label-text font-medium text-gray-800">ขนาดการกิน (เม็ด/ครั้ง)</span>
                      </label>
                      <input 
                        type="number" 
                        value={dosage} 
                        onChange={(e) => setDosage(e.target.value)} 
                        className="input input-bordered bg-gray-50 text-gray-800 font-medium w-full" 
                        style={{ borderColor: themeColors.pink }}
                        placeholder="เช่น 1"
                        required
                      />
                    </div>
                  </div>

                  {/* Consumption Time */}
                  <div>
                    <label className="label">
                      <span className="label-text font-medium text-gray-800">ช่วงเวลาของการกินยา</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 p-3 rounded-lg bg-gray-50" style={{ border: '1px solid #FFDFDF' }}>
                      {Object.keys(consumptionTimes).map((time) => (
                        <label key={time} className="label cursor-pointer justify-start gap-3">
                          <input 
                            type="checkbox" 
                            name={time}
                            checked={consumptionTimes[time as keyof ConsumptionTimes]} 
                            onChange={handleTimeChange} 
                            className="checkbox"
                            style={{ 
                              accentColor: themeColors.pink,
                              borderColor: themeColors.pink
                            }}
                          />
                          <span className="label-text text-gray-700 font-medium">
                            {
                              {
                                morning: 'เช้า',
                                afternoon: 'กลางวัน',
                                evening: 'เย็น',
                                beforeBed: 'ก่อนนอน'
                              }[time]
                            }
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Medicine Image */}
                  <div>
                    <label className="label">
                      <span className="label-text font-medium text-gray-800">รูปภาพยา</span>
                    </label>
                    <div className="flex gap-4">
                      {/* Image Preview */}
                      {imagePreview && (
                        <div className="flex-shrink-0">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="w-20 h-20 rounded-xl object-cover border-2" 
                            style={{ borderColor: themeColors.pink }} 
                          />
                        </div>
                      )}
                      
                      {/* File Input */}
                      <div className="flex-1">
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/png, image/jpeg"
                            onChange={handleImageChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            id="medicine-image-upload"
                          />
                          <div className="flex items-center justify-between w-full p-3 border-2 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                               style={{ borderColor: themeColors.pink }}>
                            <span className="text-gray-600 font-medium">
                              {medicineImage ? medicineImage.name : 'ยังไม่ได้เลือกไฟล์'}
                            </span>
                            <button
                              type="button"
                              className="px-4 py-2 rounded-lg text-white font-medium shadow-sm hover:shadow-md transition-all"
                              style={{ backgroundColor: themeColors.pink }}
                            >
                              เลือกไฟล์
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mt-6">
                    <button 
                      type="submit" 
                      className="btn btn-lg w-full text-white shadow-lg hover:shadow-xl transition-all"
                      style={{
                        background: `linear-gradient(135deg, ${themeColors.pink}, ${themeColors.lightBlue})`,
                        border: 'none',
                      }}                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <LoadingSpinner />
                          <span>{editingMedicine ? 'กำลังแก้ไข...' : 'กำลังเพิ่มยา...'}</span>
                        </div>
                      ) : (
                        editingMedicine ? 'บันทึกการแก้ไข' : 'เพิ่มยา'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="modal-overlay absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowDeleteConfirm(null)}></div>
            <div className="modal-container bg-white rounded-3xl shadow-xl max-w-sm w-full p-6 relative z-10">
              <h3 className="text-lg font-semibold mb-4" style={{ color: themeColors.textPrimary }}>
                ยืนยันการลบยา
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                คุณแน่ใจหรือว่าต้องการลบยานี้? ข้อมูลยาจะถูกลบอย่างถาวร
              </p>
              <div className="flex justify-end gap-4">
                <button 
                  onClick={() => setShowDeleteConfirm(null)}
                  className="btn btn-ghost"
                  style={{ color: themeColors.textPrimary }}
                >
                  ยกเลิก
                </button>
                <button 
                  onClick={() => handleDeleteMedicine(showDeleteConfirm!)}
                  className="btn text-white"
                  style={{ backgroundColor: '#ef4444' }}
                >
                  ลบยา
                </button>
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
