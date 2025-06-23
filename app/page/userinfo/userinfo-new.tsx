'use client'

import { useEffect, useState } from 'react'
import { localStorageService } from '../../../lib/localStorage'

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

export default function UserInfo() {
  const [isRegistered, setIsRegistered] = useState(false)
  const [showAuthForm, setShowAuthForm] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [patientData, setPatientData] = useState<PatientData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>('')
  
  // Login form state
  const [loginPhone, setLoginPhone] = useState('')
  
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
      setImagePreview(savedData.profileImage || '')
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginPhone) {
      alert('กรุณากรอกเบอร์มือถือ')
      return
    }

    // Remove formatting for comparison
    const phoneDigits = loginPhone.replace(/[^\d]/g, '')
    if (phoneDigits.length !== 10) {
      alert('กรุณากรอกเบอร์มือถือให้ครบ 10 หลัก')
      return
    }

    setIsLoading(true)
    
    // Simulate API call delay
    setTimeout(() => {
      const savedData = localStorageService.getItem<PatientData>('patient-data')
      if (savedData && savedData.phoneNumber.replace(/[^\d]/g, '') === phoneDigits) {
        setPatientData(savedData)
        setIsRegistered(true)
        setShowAuthForm(false)
        setLoginPhone('')
        setImagePreview(savedData.profileImage || '')
        alert('เข้าสู่ระบบสำเร็จ!')
      } else {
        alert('ไม่พบข้อมูลผู้ใช้ กรุณาลงทะเบียนก่อน')
      }
      setIsLoading(false)
    }, 1000)
  }

  const handleLogout = () => {
    if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
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
      if (!formData.firstName || !formData.lastName || !formData.phoneNumber || !formData.age) {
        alert('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน')
        return
      }

      const phoneDigits = formData.phoneNumber.replace(/[^\d]/g, '')
      if (phoneDigits.length !== 10) {
        alert('กรุณากรอกเบอร์มือถือให้ครบ 10 หลัก')
        return
      }

      const patientInfo: PatientData = {
        ...formData,
        age: parseInt(formData.age),
        phoneNumber: phoneDigits,
        registeredAt: new Date().toISOString()
      }

      // Save to localStorage
      localStorageService.setItem('patient-data', patientInfo)
      
      setPatientData(patientInfo)
      setIsRegistered(true)
      setShowAuthForm(false)

      // Show success message
      alert('ลงทะเบียนเรียบร้อยแล้ว!')

    } catch (error) {
      console.error('Registration error:', error)
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
      setAuthMode('register')
      setShowAuthForm(true)
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
    <div className="flex-1 px-4 pb-24 overflow-y-auto">
      <div className="container mx-auto max-w-2xl">
        {isRegistered && patientData ? (
          // Display Patient Data
          <div className="space-y-6">
            <div className="hero rounded-3xl shadow-lg" style={{ 
              background: themeColors.bgGradient,
              border: `2px solid ${themeColors.pink}`
            }}>
              <div className="hero-content text-center">
                <div className="max-w-md">
                  <div className="avatar mb-4">
                    <div className="w-24 rounded-full shadow-xl" style={{ 
                      border: `4px solid ${themeColors.pink}`,
                      boxShadow: '0 10px 30px rgba(251, 146, 158, 0.3)'
                    }}>
                      {imagePreview ? (
                        <img src={imagePreview} alt="Profile" />
                      ) : (
                        <div className="avatar placeholder">
                          <div className="w-24 rounded-full" style={{ backgroundColor: themeColors.lightBlue }}>
                            <span className="text-3xl">👤</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <h1 className="text-3xl font-bold mb-2" style={{ color: themeColors.textPrimary }}>
                    {patientData.prefix} {patientData.firstName} {patientData.lastName}
                  </h1>
                  <p className="text-lg" style={{ color: themeColors.textSecondary }}>อายุ {patientData.age} ปี ✨</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="card bg-white/90 shadow-xl rounded-3xl border-2" style={{ borderColor: themeColors.lightBlue }}>
                <div className="card-body">
                  <h2 className="card-title flex items-center gap-2" style={{ color: themeColors.textPrimary }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: themeColors.lightBlue }}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    ข้อมูลการติดต่อ
                  </h2>
                  <div className="space-y-2">
                    <p style={{ color: themeColors.textSecondary }}><strong>📞 เบอร์โทรศัพท์:</strong> {formatPhoneNumber(patientData.phoneNumber)}</p>
                  </div>
                </div>
              </div>

              <div className="card bg-white/90 shadow-xl rounded-3xl border-2" style={{ borderColor: themeColors.lightPink }}>
                <div className="card-body">
                  <h2 className="card-title flex items-center gap-2" style={{ color: themeColors.textPrimary }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: themeColors.pink }}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    ข้อมูลการรักษา
                  </h2>
                  <div className="space-y-2">
                    <p style={{ color: themeColors.textSecondary }}><strong>🏥 สิทธิการรักษา:</strong> {patientData.medicalRight || 'ไม่ระบุ'}</p>
                    <p style={{ color: themeColors.textSecondary }}><strong>💊 โรคประจำตัว:</strong> {patientData.chronicDiseases || 'ไม่มี'}</p>
                  </div>
                </div>
              </div>

              <div className="card-actions justify-center mt-6 space-x-4">
                <button onClick={handleEdit} className="btn btn-lg gap-2 text-white shadow-lg hover:shadow-xl transition-all" style={{ 
                  background: `linear-gradient(135deg, ${themeColors.pink}, ${themeColors.lightBlue})`,
                  border: 'none'
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  แก้ไขข้อมูล
                </button>
                
                <button onClick={handleLogout} className="btn btn-lg gap-2 btn-outline" style={{ 
                  borderColor: themeColors.textSecondary,
                  color: themeColors.textSecondary
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  ออกจากระบบ
                </button>
                
                <button onClick={handleDelete} className="btn btn-lg gap-2 btn-error text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  ลบข้อมูล
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Login/Register Options
          !showAuthForm ? (
            <div className="flex-1 flex flex-col justify-center items-center min-h-[60vh]">
              <div className="w-full max-w-sm">
                <div className="card bg-white/90 shadow-xl rounded-3xl border-2" style={{ borderColor: themeColors.lightPink }}>
                  <div className="card-body text-center p-8">
                    <div className="avatar placeholder mb-6">
                      <div className="rounded-full w-20 shadow-lg" style={{ background: `linear-gradient(135deg, ${themeColors.pink}, ${themeColors.lightBlue})` }}>
                        <span className="text-3xl">👤</span>
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold mb-2" style={{ color: themeColors.textPrimary }}>ข้อมูลผู้ใช้</h2>
                    <p className="text-gray-600 mb-8">เข้าสู่ระบบหรือลงทะเบียนใหม่</p>
                    
                    <div className="space-y-4">
                      <button 
                        onClick={() => { setAuthMode('login'); setShowAuthForm(true); }}
                        className="btn btn-lg w-full text-white shadow-lg hover:shadow-xl transition-all"
                        style={{ background: themeColors.pink, border: 'none' }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        ลงชื่อเข้าใช้
                      </button>
                      
                      <button 
                        onClick={() => { setAuthMode('register'); setShowAuthForm(true); }}
                        className="btn btn-lg w-full btn-outline hover:text-white"
                        style={{ borderColor: themeColors.lightBlue, color: themeColors.textPrimary }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        ลงทะเบียนใหม่
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Show Login or Register Form
            <div className="flex-1 overflow-y-auto">
              <div className="w-full max-w-md mx-auto mt-8">
                <div className="card bg-white/90 shadow-xl rounded-3xl border-2" style={{ borderColor: themeColors.lightPink }}>
                  <div className="card-body p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold" style={{ color: themeColors.textPrimary }}>
                        {authMode === 'login' ? 'ลงชื่อเข้าใช้' : 'ลงทะเบียนใหม่'}
                      </h2>
                      <button 
                        onClick={() => setShowAuthForm(false)}
                        className="btn btn-sm btn-ghost btn-circle"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {authMode === 'login' ? (
                      // Login Form
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                          <label className="label">
                            <span className="label-text font-medium">เบอร์มือถือ</span>
                          </label>
                          <input
                            type="tel"
                            value={loginPhone}
                            onChange={(e) => setLoginPhone(formatPhoneNumber(e.target.value))}
                            placeholder="xxx-xxx-xxxx"
                            className="input input-bordered w-full bg-gray-50"
                            required
                          />
                        </div>
                        
                        <div className="space-y-4 mt-6">
                          <button
                            type="submit"
                            className={`btn btn-lg w-full text-white ${isLoading ? 'loading' : ''}`}
                            style={{ background: themeColors.pink, border: 'none' }}
                            disabled={isLoading}
                          >
                            {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => setAuthMode('register')}
                            className="btn btn-ghost w-full"
                          >
                            ยังไม่มีบัญชี? ลงทะเบียนที่นี่
                          </button>
                        </div>
                      </form>
                    ) : (
                      // Register Form
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="label">
                              <span className="label-text font-medium">คำนำหน้า</span>
                            </label>
                            <select
                              name="prefix"
                              value={formData.prefix}
                              onChange={handleInputChange}
                              className="select select-bordered w-full bg-gray-50"
                              required
                            >
                              <option value="">เลือกคำนำหน้า</option>
                              {prefixOptions.map(prefix => (
                                <option key={prefix} value={prefix}>{prefix}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="label">
                              <span className="label-text font-medium">อายุ</span>
                            </label>
                            <input
                              type="number"
                              name="age"
                              value={formData.age}
                              onChange={handleInputChange}
                              placeholder="อายุ"
                              className="input input-bordered w-full bg-gray-50"
                              min="1"
                              max="150"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="label">
                              <span className="label-text font-medium">ชื่อ</span>
                            </label>
                            <input
                              type="text"
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleInputChange}
                              placeholder="ชื่อ"
                              className="input input-bordered w-full bg-gray-50"
                              required
                            />
                          </div>
                          <div>
                            <label className="label">
                              <span className="label-text font-medium">นามสกุล</span>
                            </label>
                            <input
                              type="text"
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleInputChange}
                              placeholder="นามสกุล"
                              className="input input-bordered w-full bg-gray-50"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="label">
                            <span className="label-text font-medium">เบอร์โทรศัพท์</span>
                          </label>
                          <input
                            type="tel"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleInputChange}
                            placeholder="xxx-xxx-xxxx"
                            className="input input-bordered w-full bg-gray-50"
                            required
                          />
                        </div>

                        <div>
                          <label className="label">
                            <span className="label-text font-medium">สิทธิการรักษา</span>
                          </label>
                          <select
                            name="medicalRight"
                            value={formData.medicalRight}
                            onChange={handleInputChange}
                            className="select select-bordered w-full bg-gray-50"
                          >
                            <option value="">เลือกสิทธิการรักษา</option>
                            {medicalRightOptions.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="label">
                            <span className="label-text font-medium">โรคประจำตัว</span>
                          </label>
                          <textarea
                            name="chronicDiseases"
                            value={formData.chronicDiseases}
                            onChange={handleInputChange}
                            placeholder="ระบุโรคประจำตัว (หากมี)"
                            className="textarea textarea-bordered w-full bg-gray-50"
                            rows={3}
                          />
                        </div>

                        <div>
                          <label className="label">
                            <span className="label-text font-medium">รูปโปรไฟล์</span>
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="file-input file-input-bordered w-full bg-gray-50"
                          />
                          {imagePreview && (
                            <div className="mt-2 flex justify-center">
                              <img src={imagePreview} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2" style={{ borderColor: themeColors.pink }} />
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-4 mt-6">
                          <button
                            type="submit"
                            className={`btn btn-lg w-full text-white ${isLoading ? 'loading' : ''}`}
                            style={{ background: themeColors.pink, border: 'none' }}
                            disabled={isLoading}
                          >
                            {isLoading ? 'กำลังลงทะเบียน...' : 'ลงทะเบียน'}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => setAuthMode('login')}
                            className="btn btn-ghost w-full"
                          >
                            มีบัญชีแล้ว? เข้าสู่ระบบ
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}
