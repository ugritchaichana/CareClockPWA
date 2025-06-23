'use client'

import { useEffect, useState } from 'react'
import { localStorageService } from '../../lib/localStorage'
import Link from 'next/link'

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

const prefixOptions = [
  'นาย',
  'นาง', 
  'นางสาว',
  'เด็กชาย',
  'เด็กหญิง',
  'อื่นๆ'
]

const medicalRightOptions = [
  'บัตรทอง (UC)',
  'ประกันสังคม (SSS)',
  'ข้าราชการ',
  'จ่ายเอง',
  'อื่นๆ'
]

export default function PatientInfoPage() {
  const [isRegistered, setIsRegistered] = useState(false)
  const [patientData, setPatientData] = useState<PatientData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>('')
  
  // Form state
  const [formData, setFormData] = useState({
    prefix: '',
    firstName: '',
    lastName: '',
    age: '',
    phoneNumber: '',
    medicalRight: '',
    chronicDiseases: '',
    profileImage: ''
  })

  const formatPhoneNumber = (value: string) => {
    if (!value) return value;
    const digits = value.replace(/[^\d]/g, '').slice(0, 10);
    const length = digits.length;

    if (length > 6) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    if (length > 3) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }
    return digits;
  };

  useEffect(() => {
    // Load existing patient data
    const savedData = localStorageService.getItem<PatientData>('patient-data')
    if (savedData) {
      setPatientData(savedData)
      setIsRegistered(true)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'phoneNumber') {
      setFormData(prev => ({
        ...prev,
        [name]: formatPhoneNumber(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64String = event.target?.result as string
        setImagePreview(base64String)
        setFormData(prev => ({
          ...prev,
          profileImage: base64String
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate required fields
      if (!formData.prefix || !formData.firstName || !formData.lastName || !formData.age) {
        alert('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน')
        return
      }

      const patientInfo: PatientData = {
        ...formData,
        age: parseInt(formData.age),
        phoneNumber: formData.phoneNumber.replace(/-/g, ''),
        registeredAt: new Date().toISOString()
      }

      // Save to localStorage
      localStorageService.setItem('patient-data', patientInfo)
      
      // Try to save to database
      try {
        const response = await fetch('/api/data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'patient-registration',
            data: patientInfo
          }),
        })

        if (response.ok) {
          console.log('Data saved to database successfully')
        }
      } catch (error) {
        console.log('Database save failed, but local storage is working:', error)
      }

      setPatientData(patientInfo)
      setIsRegistered(true)

      // Show success message
      alert('ลงทะเบียนเรียบร้อยแล้ว!')

    } catch (error) {
      console.error('Error saving patient data:', error)
      alert('เกิดข้อผิดพลาดในการลงทะเบียน')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    if (patientData) {
      setFormData({
        prefix: patientData.prefix,
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        age: patientData.age.toString(),
        phoneNumber: formatPhoneNumber(patientData.phoneNumber),
        medicalRight: patientData.medicalRight,
        chronicDiseases: patientData.chronicDiseases,
        profileImage: patientData.profileImage
      })
      setImagePreview(patientData.profileImage)
      setIsRegistered(false)
    }
  }

  const handleDelete = () => {
    if (confirm('คุณต้องการลบข้อมูลการลงทะเบียนใช่หรือไม่?')) {
      localStorageService.removeItem('patient-data')
      setPatientData(null)
      setIsRegistered(false)
      setFormData({
        prefix: '',
        firstName: '',
        lastName: '',
        age: '',
        phoneNumber: '',
        medicalRight: '',
        chronicDiseases: '',
        profileImage: ''
      })
      setImagePreview('')
    }
  }
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #FFF6F6 0%, #FFDFDF 50%, #AEDEFC 100%)' }}>
      {/* Header */}
      <div className="navbar bg-white/90 backdrop-blur-sm shadow-lg" style={{ borderBottom: '2px solid #FB929E' }}>
        <div className="flex-1">
          <Link href="/" className="btn btn-ghost normal-case text-xl gap-2 text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#FB929E' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            ข้อมูลทั่วไป
          </Link>
        </div>
        <div className="flex-none">
          {isRegistered && (
            <button onClick={handleEdit} className="btn btn-ghost btn-sm gap-2 text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#FB929E' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              แก้ไข
            </button>
          )}
        </div>
      </div>

      <div className="container mx-auto p-4 max-w-2xl">        {isRegistered && patientData ? (
          // Display Patient Data
          <div className="space-y-6">
            <div className="hero rounded-3xl shadow-lg" style={{ 
              background: 'linear-gradient(135deg, #FFF6F6 0%, #FFDFDF 50%, #AEDEFC 100%)',
              border: '2px solid #FB929E'
            }}>
              <div className="hero-content text-center">
                <div className="max-w-md">
                  <div className="avatar mb-4">
                    <div className="w-24 rounded-full shadow-xl" style={{ 
                      border: '4px solid #FB929E',
                      boxShadow: '0 10px 30px rgba(251, 146, 158, 0.3)'
                    }}>
                      {patientData.profileImage ? (
                        <img src={patientData.profileImage} alt="Profile" />
                      ) : (
                        <div className="flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #FB929E, #AEDEFC)' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-700 mb-2">
                    {patientData.prefix} {patientData.firstName} {patientData.lastName}
                  </h1>
                  <p className="text-lg text-gray-600">อายุ {patientData.age} ปี</p>
                </div>
              </div>
            </div>            <div className="grid gap-4">
              <div className="card bg-white/90 shadow-xl rounded-3xl" style={{ border: '2px solid #AEDEFC' }}>
                <div className="card-body">
                  <h2 className="card-title text-gray-700 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#AEDEFC' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 002-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    ข้อมูลการติดต่อ
                  </h2>
                  <div className="space-y-2">
                    <p className="text-gray-600"><strong>📞 เบอร์โทรศัพท์:</strong> {patientData.phoneNumber ? formatPhoneNumber(patientData.phoneNumber) : 'ไม่ระบุ'}</p>
                  </div>
                </div>
              </div>

              <div className="card bg-white/90 shadow-xl rounded-3xl" style={{ border: '2px solid #FB929E' }}>
                <div className="card-body">
                  <h2 className="card-title text-gray-700 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FB929E' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    ข้อมูลการรักษา
                  </h2>
                  <div className="space-y-2">
                    <p className="text-gray-600"><strong>🏥 สิทธิ์การรักษา:</strong> {patientData.medicalRight || 'ไม่ระบุ'}</p>
                    <p className="text-gray-600"><strong>💊 โรคประจำตัว:</strong> {patientData.chronicDiseases || 'ไม่มี'}</p>
                  </div>
                </div>
              </div>

              <div className="card bg-white/90 shadow-xl rounded-3xl" style={{ border: '2px solid #FFDFDF' }}>
                <div className="card-body">
                  <h2 className="card-title text-gray-700 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFDFDF' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    ข้อมูลการลงทะเบียน
                  </h2>
                  <p className="text-gray-600">📅 ลงทะเบียนเมื่อ: {new Date(patientData.registeredAt).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                </div>
              </div>              <div className="card-actions justify-center mt-6 space-x-4">
                <button onClick={handleEdit} className="btn btn-lg gap-2 text-white shadow-lg hover:shadow-xl transition-all" style={{ 
                  background: 'linear-gradient(135deg, #FB929E, #AEDEFC)',
                  border: 'none'
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  แก้ไขข้อมูล
                </button>
                <button onClick={handleDelete} className="btn btn-lg btn-outline gap-2 text-red-500 border-red-300 hover:bg-red-50 hover:border-red-400 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  ลบข้อมูล
                </button>
              </div>
            </div>
          </div>        ) : (
          // Registration Form
          <div className="card bg-white/90 shadow-xl rounded-3xl" style={{ border: '2px solid #FB929E' }}>
            <div className="card-body">
              <div className="text-center mb-6">
                <div className="avatar placeholder mb-4">
                  <div className="rounded-full w-16 shadow-lg" style={{ background: 'linear-gradient(135deg, #FB929E, #AEDEFC)' }}>
                    <span className="text-2xl">👤</span>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-700">ลงทะเบียนข้อมูลผู้ป่วย</h2>
                <p className="text-gray-600">กรุณากรอกข้อมูลให้ครบถ้วน ✨</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Profile Image Upload */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">รูปภาพประจำตัว</span>
                  </label>
                  <div className="flex flex-col items-center gap-4">
                    <div className="avatar">
                      <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                        {imagePreview ? (
                          <img src={imagePreview} alt="Preview" />
                        ) : (
                          <div className="bg-base-300 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="file-input file-input-bordered file-input-primary w-full max-w-xs"
                    />
                  </div>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">คำนำหน้าชื่อ *</span>
                    </label>
                    <select
                      name="prefix"
                      value={formData.prefix}
                      onChange={handleInputChange}
                      className="select select-bordered select-primary"
                      required
                    >
                      <option value="">เลือกคำนำหน้า</option>
                      {prefixOptions.map((prefix) => (
                        <option key={prefix} value={prefix}>{prefix}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">ชื่อ (ภาษาไทย) *</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="input input-bordered input-primary"
                      placeholder="ชื่อ"
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">นามสกุล (ภาษาไทย) *</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="input input-bordered input-primary"
                      placeholder="นามสกุล"
                      required
                    />
                  </div>
                </div>

                {/* Age and Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">อายุ *</span>
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      className="input input-bordered input-primary"
                      placeholder="อายุ (ปี)"
                      min="1"
                      max="120"
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">เบอร์โทรศัพท์</span>
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="input input-bordered input-primary"
                      placeholder="0XX-XXX-XXXX"
                      maxLength={12}
                    />
                  </div>
                </div>

                {/* Medical Right */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">สิทธิ์การรักษา</span>
                  </label>
                  <select
                    name="medicalRight"
                    value={formData.medicalRight}
                    onChange={handleInputChange}
                    className="select select-bordered select-secondary"
                  >
                    <option value="">เลือกสิทธิ์การรักษา</option>
                    {medicalRightOptions.map((right) => (
                      <option key={right} value={right}>{right}</option>
                    ))}
                  </select>
                </div>

                {/* Chronic Diseases */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">โรคประจำตัว (ถ้ามี)</span>
                  </label>
                  <textarea
                    name="chronicDiseases"
                    value={formData.chronicDiseases}
                    onChange={handleInputChange}
                    className="textarea textarea-bordered textarea-secondary"
                    placeholder="ระบุโรคประจำตัว หรือข้อมูลทางการแพทย์ที่สำคัญ"
                    rows={3}
                  />
                </div>

                {/* Submit Button */}
                <div className="card-actions justify-center mt-8">
                  <button
                    type="submit"
                    className={`btn btn-primary btn-lg gap-2 ${isLoading ? 'loading' : ''}`}
                    disabled={isLoading}
                  >
                    {!isLoading && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {isLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
