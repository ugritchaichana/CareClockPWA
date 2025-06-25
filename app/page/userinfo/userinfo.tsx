'use client'

import { useEffect, useState } from 'react'
import { localStorageService } from '../../../lib/localStorage'
import { useRouter } from 'next/navigation'
import LoadingButton from '@/components/LoadingButton'

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

// Theme colors - same as notification.tsx
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
  const router = useRouter()
  const [isRegistered, setIsRegistered] = useState(false)
  const [showAuthForm, setShowAuthForm] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [patientData, setPatientData] = useState<PatientData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [rawFile, setRawFile] = useState<File | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [customPrefix, setCustomPrefix] = useState('')
  const [customMedicalRight, setCustomMedicalRight] = useState('')
  const [dataSource, setDataSource] = useState<'database' | 'loading' | 'offline' | null>(null)
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const [loginError, setLoginError] = useState('')

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
    drugAllergy: '',
  })

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
    const savedData = localStorageService.getItem<PatientData>('patient-data')
    
    if (savedData) {
      setPatientData(savedData)
      setIsRegistered(true)
      setImagePreview(savedData.profileImageUrl || '')
      setDataSource('loading')
      
      // Verify with database in background
      if (savedData.phoneNumber) {
        fetch(`/api/data?type=patient-data&phoneNumber=${savedData.phoneNumber}`)
          .then(response => {
            if (response.ok) {
              return response.json()
            }
            throw new Error('Patient not found in database')
          })
          .then(result => {
            if (JSON.stringify(result.data) !== JSON.stringify(savedData)) {
              setPatientData(result.data)
              setImagePreview(result.data.profileImageUrl || '')
              localStorageService.setItem('patient-data', result.data)
            }
            setDataSource('database')
          })
          .catch(error => {
            setDataSource('offline')
          })
      } else {
        setDataSource('offline')
      }
    }
  }, [])
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    
    if (!loginPhone) {
      return
    }

    const phoneDigits = loginPhone.replace(/[^\d]/g, '')
    
    if (phoneDigits.length !== 10) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/user/login?phoneNumber=${phoneDigits}`)

      if (response.status === 404) {
        setLoginError('ไม่พบข้อมูลผู้ใช้ กรุณาลงทะเบียนก่อน')
      } else if (!response.ok) {
        throw new Error('Login failed')
      } else {
        const result = await response.json()
        setPatientData(result.data)
        setIsRegistered(true)
        setShowAuthForm(false)
        localStorageService.setItem('patient-data', result.data)
        setDataSource('database')
        showToast('เข้าสู่ระบบสำเร็จ!', 'success')
      }
    } catch (error) {
      console.error('Login Error:', error)
      setLoginError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    setIsLogoutModalOpen(true)
  }

  const confirmLogout = () => {
    localStorageService.removeItem('patient-data')

    setPatientData(null)
    setIsRegistered(false)
    setShowAuthForm(false)
    setLoginPhone('')
    setImagePreview('')
    setRawFile(null)
    setFormData({
      prefix: '',
      firstName: '',
      lastName: '',
      age: '',
      phoneNumber: '',
      medicalRight: '',
      chronicDiseases: '',
      drugAllergy: '',
    })
    setIsLogoutModalOpen(false)
    showToast('ออกจากระบบแล้ว', 'info')
  }

  const cancelLogout = () => {
    setIsLogoutModalOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    if (name === 'phoneNumber') {
      const formattedPhone = formatPhoneNumber(value)
      setFormData(prev => ({ ...prev, [name]: formattedPhone }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    
    if (file) {
      setRawFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setImagePreview(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsLoading(true)

    try {
      const submitData = new FormData()
      
      const finalPrefix = formData.prefix === 'อื่นๆ' ? customPrefix : formData.prefix
      const finalMedicalRight = formData.medicalRight === 'อื่นๆ' ? customMedicalRight : formData.medicalRight
      
      submitData.append('prefix', finalPrefix)
      submitData.append('firstName', formData.firstName)
      submitData.append('lastName', formData.lastName)
      submitData.append('age', formData.age.toString())
      submitData.append('phoneNumber', formData.phoneNumber.replace(/[^\d]/g, ''))
      submitData.append('medicalRight', finalMedicalRight)
      submitData.append('chronicDiseases', formData.chronicDiseases)
      submitData.append('drugAllergy', formData.drugAllergy)
      
      if (rawFile) {
        submitData.append('profileImage', rawFile)
      }

      const url = isEditing ? '/api/user/update' : '/api/user/register'

      const response = await fetch(url, {
        method: 'POST',
        body: submitData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API Error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()

      const updatedPatientData = result.data
      localStorageService.setItem('patient-data', updatedPatientData)
      setPatientData(updatedPatientData)
      setRawFile(null)

      if (isEditing) {
        setIsEditing(false)
        setShowAuthForm(false)
        showToast('แก้ไขข้อมูลสำเร็จ!', 'success')
      } else {
        setShowAuthForm(false)
        setIsRegistered(true)
        showToast('ลงทะเบียนสำเร็จ!', 'success')
      }
    } catch (error) {
      console.error('An unexpected error occurred:', error)
      showToast('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    if (patientData) {
      const isCustomPrefix = !prefixOptions.includes(patientData.prefix)
      const isCustomMedicalRight = !medicalRightOptions.includes(patientData.medicalRight)
      
      const newFormData = {
        prefix: isCustomPrefix ? 'อื่นๆ' : patientData.prefix,
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        age: patientData.age.toString(),
        phoneNumber: formatPhoneNumber(patientData.phoneNumber),
        medicalRight: isCustomMedicalRight ? 'อื่นๆ' : patientData.medicalRight,
        chronicDiseases: patientData.chronicDiseases || '',
        drugAllergy: patientData.drugAllergy || '',
      }
      
      setFormData(newFormData)
      
      if (isCustomPrefix) {
        setCustomPrefix(patientData.prefix)
      } else {
        setCustomPrefix('')
      }
      
      if (isCustomMedicalRight) {
        setCustomMedicalRight(patientData.medicalRight)
      } else {
        setCustomMedicalRight('')
      }

      setImagePreview(patientData.profileImageUrl || '')
      setIsEditing(true)
      setAuthMode('register')
      setShowAuthForm(true)
    }
  }

  return (
    <div className="flex-1 px-3 pb-28 overflow-y-auto min-h-screen" style={{ background: themeColors.bgGradient }}>
      <div className="container mx-auto max-w-md py-4">
        {isRegistered && patientData && !showAuthForm ? (
          // Display Patient Data - Mobile First
          <div className="space-y-4">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold mb-1" style={{ color: themeColors.textPrimary }}>
                👤 ข้อมูลผู้ใช้
              </h1>
              <p className="text-gray-500 text-xs">ข้อมูลส่วนตัวและการรักษา</p>
            </div>

            {/* Profile Card */}
            <div 
              className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg border-2 p-6 text-center"
              style={{ borderColor: themeColors.pink }}
            >
              <div className="mb-4">
                <div 
                  className="w-20 h-20 mx-auto rounded-full shadow-lg overflow-hidden"
                  style={{ 
                    border: `3px solid ${themeColors.pink}`,
                  }}
                >
                  {patientData.profileImageUrl ? (
                    <img 
                      src={patientData.profileImageUrl} 
                      alt="Profile" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center text-white"
                      style={{ background: `linear-gradient(135deg, ${themeColors.pink}, ${themeColors.lightBlue})` }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              <h2 
                className="text-lg font-bold mb-1"
                style={{ color: themeColors.textPrimary }}
              >
                {patientData.prefix} {patientData.firstName} {patientData.lastName}
              </h2>
              <p 
                className="text-sm"
                style={{ color: themeColors.textSecondary }}
              >
                🎂 อายุ {patientData.age} ปี
              </p>
            </div>

            {/* Contact Info Card */}
            <div 
              className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg border-2 p-4"
              style={{ borderColor: themeColors.lightBlue }}
            >
              <h3 
                className="text-lg font-bold mb-3 flex items-center gap-2"
                style={{ color: themeColors.textPrimary }}
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: themeColors.lightBlue }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                ข้อมูลการติดต่อ
              </h3>
              <div className="space-y-2">
                <p 
                  className="text-sm"
                  style={{ color: themeColors.textSecondary }}
                >
                  <strong className="text-gray-700">📞 เบอร์โทรศัพท์:</strong><br />
                  <span className="font-medium">{formatPhoneNumber(patientData.phoneNumber)}</span>
                </p>
              </div>
            </div>

            {/* Medical Info Card */}
            <div 
              className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg border-2 p-4"
              style={{ borderColor: themeColors.lightPink }}
            >
              <h3 
                className="text-lg font-bold mb-3 flex items-center gap-2"
                style={{ color: themeColors.textPrimary }}
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: themeColors.pink }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 00-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                ข้อมูลการรักษา
              </h3>
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-gray-50">
                  <p className="text-xs font-medium text-gray-700 mb-1">🏥 สิทธิการรักษา</p>
                  <p 
                    className="text-sm font-semibold"
                    style={{ color: themeColors.textPrimary }}
                  >
                    {patientData.medicalRight || 'ไม่ระบุ'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50">
                  <p className="text-xs font-medium text-gray-700 mb-1">💊 โรคประจำตัว</p>
                  <p 
                    className="text-sm font-semibold"
                    style={{ color: themeColors.textPrimary }}
                  >
                    {patientData.chronicDiseases || 'ไม่มี'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50">
                  <p className="text-xs font-medium text-gray-700 mb-1">⚠️ แพ้ยา</p>
                  <p 
                    className="text-sm font-semibold"
                    style={{ color: themeColors.textPrimary }}
                  >
                    {patientData.drugAllergy || 'ไม่มี'}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 mt-6">
              <button 
                onClick={handleEdit}
                className="w-full py-4 rounded-2xl text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: `linear-gradient(135deg, ${themeColors.pink}, ${themeColors.lightBlue})`,
                  border: 'none',
                  minHeight: '56px'
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  ✏️ แก้ไขข้อมูล
                </span>
              </button>
              
              <button 
                onClick={handleLogout}
                className="w-full py-3 rounded-2xl font-semibold text-base border-2 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                style={{ 
                  borderColor: themeColors.textSecondary,
                  color: themeColors.textSecondary,
                  backgroundColor: 'transparent',
                  minHeight: '48px'
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  🚪 ออกจากระบบ
                </span>
              </button>
            </div>
          </div>
        ) : (
          !showAuthForm ? (
            // Welcome Screen
            <div className="flex flex-col justify-center items-center min-h-[80vh]">
              <div className="w-full">
                <div className="text-center mb-8">
                  <h1 
                    className="text-2xl font-bold mb-2"
                    style={{ color: themeColors.textPrimary }}
                  >
                    👋 ยินดีต้อนรับ
                  </h1>
                  <p 
                    className="text-sm"
                    style={{ color: themeColors.textSecondary }}
                  >
                    เข้าสู่ระบบหรือสมัครสมาชิกใหม่
                  </p>
                </div>

                <div 
                  className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg border-2 p-6 text-center"
                  style={{ borderColor: themeColors.lightPink }}
                >
                  <div 
                    className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${themeColors.pink}, ${themeColors.lightBlue})`
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  
                  <h2 
                    className="text-lg font-bold mb-2"
                    style={{ color: themeColors.textPrimary }}
                  >
                    CareClock
                  </h2>
                  <p 
                    className="text-sm mb-6"
                    style={{ color: themeColors.textSecondary }}
                  >
                    ระบบจัดการการกินยาอัจฉริยะ
                  </p>

                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        setAuthMode('login')
                        setShowAuthForm(true)
                      }}
                      className="w-full py-4 rounded-2xl text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        background: `linear-gradient(135deg, ${themeColors.pink}, ${themeColors.lightBlue})`,
                        border: 'none',
                        minHeight: '56px'
                      }}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m0 0v3a2 2 0 01-2 2H6m3-3a2 2 0 011-1h1a2 2 0 011 1h1z" />
                        </svg>
                        🔐 เข้าสู่ระบบ
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setAuthMode('register')
                        setShowAuthForm(true)
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        📝 สมัครสมาชิก
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Auth Form
            <div 
              className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg border-2 overflow-hidden"
              style={{ borderColor: themeColors.lightPink }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 
                    className="text-xl font-bold"
                    style={{ color: themeColors.textPrimary }}
                  >
                    {authMode === 'login' ? '🔐 เข้าสู่ระบบ' : (isEditing ? '✏️ แก้ไขข้อมูล' : '📝 ลงทะเบียน')}
                  </h2>
                  <button 
                    onClick={() => setShowAuthForm(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-200 hover:bg-gray-50"
                    style={{ 
                      borderColor: themeColors.lightPink,
                      color: themeColors.textSecondary
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {authMode === 'login' ? (
                  <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                      <label 
                        className="block text-sm font-semibold mb-2"
                        style={{ color: themeColors.textPrimary }}
                      >
                        📱 เบอร์โทรศัพท์
                      </label>
                      <input
                        type="tel"
                        value={loginPhone}
                        onChange={(e) => {
                          setLoginPhone(formatPhoneNumber(e.target.value))
                          if (loginError) setLoginError('')
                        }}
                        placeholder="xxx-xxx-xxxx"
                        className="w-full px-4 py-3 rounded-2xl border-2 bg-white/90 backdrop-blur-sm font-medium text-base transition-all duration-200 focus:outline-none focus:scale-[1.02] active:scale-[0.98]"
                        style={{ 
                          borderColor: themeColors.lightPink,
                          color: themeColors.textPrimary,
                          minHeight: '48px'
                        }}
                        maxLength={12}
                        required
                      />
                      {loginError && (
                        <div className="mt-2 p-3 rounded-2xl bg-red-50 border-2 border-red-200">
                          <p className="text-red-600 text-sm font-medium">❌ {loginError}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <LoadingButton
                        type="submit"
                        size="lg"
                        className="w-full py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform border-0 focus:outline-none focus:scale-[1.02] active:scale-[0.98]"
                        style={{
                          background: `linear-gradient(135deg, ${themeColors.pink}, ${themeColors.lightBlue})`,
                          color: 'white',
                          minHeight: '56px'
                        }}
                        isLoading={isLoading}
                        loadingText="🔄 กำลังเข้าสู่ระบบ..."
                      >
                        🚀 เข้าสู่ระบบ
                      </LoadingButton>
                      
                      <button
                        type="button"
                        onClick={() => setAuthMode('register')}
                        className="w-full py-3 rounded-2xl font-medium border-2 bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all duration-200 focus:outline-none focus:scale-[1.02] active:scale-[0.98]"
                        style={{ 
                          borderColor: themeColors.lightPink,
                          color: themeColors.textPrimary,
                          minHeight: '48px'
                        }}
                      >
                        📝 ยังไม่มีบัญชี? ลงทะเบียน
                      </button>
                    </div>
                  </form>
                ) : (
                  // Register Form
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label 
                          className="block text-sm font-semibold mb-2"
                          style={{ color: themeColors.textPrimary }}
                        >
                          คำนำหน้า
                        </label>
                        <div className="flex items-center gap-2">
                          <select
                            name="prefix"
                            value={formData.prefix}
                            onChange={handleInputChange}
                            className={`${formData.prefix === 'อื่นๆ' ? 'w-1/2' : 'w-full'} px-3 py-3 rounded-2xl border-2 bg-white/90 backdrop-blur-sm font-medium text-base transition-all duration-200 focus:outline-none focus:scale-[1.02] active:scale-[0.98]`}
                            style={{ 
                              borderColor: themeColors.lightPink,
                              color: themeColors.textPrimary,
                              minHeight: '48px'
                            }}
                            required
                          >
                            <option value="">เลือก</option>
                            {prefixOptions.map(prefix => (
                              <option key={prefix} value={prefix}>{prefix}</option>
                            ))}
                          </select>
                          {formData.prefix === 'อื่นๆ' && (
                            <input
                              type="text"
                              value={customPrefix}
                              onChange={(e) => setCustomPrefix(e.target.value)}
                              placeholder="ระบุ"
                              className="w-1/2 px-3 py-3 rounded-2xl border-2 bg-white/90 backdrop-blur-sm font-medium text-base transition-all duration-200 focus:outline-none focus:scale-[1.02] active:scale-[0.98]"
                              style={{ 
                                borderColor: themeColors.lightPink,
                                color: themeColors.textPrimary,
                                minHeight: '48px'
                              }}
                              required
                            />
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <label 
                          className="block text-sm font-semibold mb-2"
                          style={{ color: themeColors.textPrimary }}
                        >
                          อายุ
                        </label>
                        <input
                          type="number"
                          name="age"
                          value={formData.age}
                          onChange={handleInputChange}
                          placeholder="อายุ"
                          className="w-full px-3 py-3 rounded-2xl border-2 bg-white/90 backdrop-blur-sm font-medium text-base transition-all duration-200 focus:outline-none focus:scale-[1.02] active:scale-[0.98]"
                          style={{ 
                            borderColor: themeColors.lightPink,
                            color: themeColors.textPrimary,
                            minHeight: '48px'
                          }}
                          min="0"
                          max="120"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label 
                          className="block text-sm font-semibold mb-2"
                          style={{ color: themeColors.textPrimary }}
                        >
                          ชื่อ
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          placeholder="ชื่อ"
                          className="w-full px-3 py-3 rounded-2xl border-2 bg-white/90 backdrop-blur-sm font-medium text-base transition-all duration-200 focus:outline-none focus:scale-[1.02] active:scale-[0.98]"
                          style={{ 
                            borderColor: themeColors.lightPink,
                            color: themeColors.textPrimary,
                            minHeight: '48px'
                          }}
                          pattern="[ก-ฮะ-์\s]+"
                          title="กรุณากรอกเป็นภาษาไทยเท่านั้น"
                          required
                        />
                      </div>
                      <div>
                        <label 
                          className="block text-sm font-semibold mb-2"
                          style={{ color: themeColors.textPrimary }}
                        >
                          นามสกุล
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          placeholder="นามสกุล"
                          className="w-full px-3 py-3 rounded-2xl border-2 bg-white/90 backdrop-blur-sm font-medium text-base transition-all duration-200 focus:outline-none focus:scale-[1.02] active:scale-[0.98]"
                          style={{ 
                            borderColor: themeColors.lightPink,
                            color: themeColors.textPrimary,
                            minHeight: '48px'
                          }}
                          pattern="[ก-ฮะ-์\s]+"
                          title="กรุณากรอกเป็นภาษาไทยเท่านั้น"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label 
                        className="block text-sm font-semibold mb-2"
                        style={{ color: themeColors.textPrimary }}
                      >
                        📱 เบอร์โทรศัพท์
                      </label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        placeholder="xxx-xxx-xxxx"
                        className="w-full px-4 py-3 rounded-2xl border-2 bg-white/90 backdrop-blur-sm font-medium text-base transition-all duration-200 focus:outline-none focus:scale-[1.02] active:scale-[0.98]"
                        style={{ 
                          borderColor: themeColors.lightPink,
                          color: themeColors.textPrimary,
                          minHeight: '48px'
                        }}
                        required
                      />
                    </div>

                    <div>
                      <label 
                        className="block text-sm font-semibold mb-2"
                        style={{ color: themeColors.textPrimary }}
                      >
                        🏥 สิทธิการรักษา
                      </label>
                      <div className="flex items-center gap-2">
                        <select
                          name="medicalRight"
                          value={formData.medicalRight}
                          onChange={handleInputChange}
                          className={`${formData.medicalRight === 'อื่นๆ' ? 'w-1/2' : 'w-full'} px-3 py-3 rounded-2xl border-2 bg-white/90 backdrop-blur-sm font-medium text-base transition-all duration-200 focus:outline-none focus:scale-[1.02] active:scale-[0.98]`}
                          style={{ 
                            borderColor: themeColors.lightPink,
                            color: themeColors.textPrimary,
                            minHeight: '48px'
                          }}
                        >
                          <option value="">เลือกสิทธิ</option>
                          {medicalRightOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                        {formData.medicalRight === 'อื่นๆ' && (
                          <input
                            type="text"
                            value={customMedicalRight}
                            onChange={(e) => setCustomMedicalRight(e.target.value)}
                            placeholder="ระบุสิทธิ"
                            className="w-1/2 px-3 py-3 rounded-2xl border-2 bg-white/90 backdrop-blur-sm font-medium text-base transition-all duration-200 focus:outline-none focus:scale-[1.02] active:scale-[0.98]"
                            style={{ 
                              borderColor: themeColors.lightPink,
                              color: themeColors.textPrimary,
                              minHeight: '48px'
                            }}
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <label 
                        className="block text-sm font-semibold mb-2"
                        style={{ color: themeColors.textPrimary }}
                      >
                        💊 โรคประจำตัว (ถ้ามี)
                      </label>
                      <textarea
                        name="chronicDiseases"
                        value={formData.chronicDiseases}
                        onChange={handleInputChange}
                        placeholder="ระบุโรคประจำตัว (หากมี)"
                        className="w-full px-4 py-3 rounded-2xl border-2 bg-white/90 backdrop-blur-sm font-medium text-base transition-all duration-200 focus:outline-none focus:scale-[1.02] active:scale-[0.98] resize-none"
                        style={{ 
                          borderColor: themeColors.lightPink,
                          color: themeColors.textPrimary,
                          minHeight: '96px'
                        }}
                        rows={3}
                      />
                    </div>

                    <div>
                      <label 
                        className="block text-sm font-semibold mb-2"
                        style={{ color: themeColors.textPrimary }}
                      >
                        ⚠️ แพ้ยา (ถ้ามี)
                      </label>
                      <textarea
                        name="drugAllergy"
                        value={formData.drugAllergy}
                        onChange={handleInputChange}
                        placeholder="ระบุยาที่แพ้ (หากมี)"
                        className="w-full px-4 py-3 rounded-2xl border-2 bg-white/90 backdrop-blur-sm font-medium text-base transition-all duration-200 focus:outline-none focus:scale-[1.02] active:scale-[0.98] resize-none"
                        style={{ 
                          borderColor: themeColors.lightPink,
                          color: themeColors.textPrimary,
                          minHeight: '96px'
                        }}
                        rows={3}
                      />
                    </div>

                    <div>
                      <label 
                        className="block text-sm font-semibold mb-2"
                        style={{ color: themeColors.textPrimary }}
                      >
                        📷 รูปภาพประจำตัว
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/png, image/jpeg"
                          onChange={handleImageUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          id="file-upload"
                        />
                        <div 
                          className="flex items-center justify-between w-full p-3 border-2 border-dashed rounded-2xl bg-white/50 hover:bg-white/80 transition-all duration-200"
                          style={{ borderColor: themeColors.pink }}
                        >
                          <span 
                            className="font-medium text-sm"
                            style={{ color: themeColors.textSecondary }}
                          >
                            {rawFile ? rawFile.name : 'ยังไม่ได้เลือกไฟล์'}
                          </span>
                          <button
                            type="button"
                            className="px-4 py-2 rounded-xl text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
                            style={{ backgroundColor: themeColors.pink }}
                          >
                            เลือกไฟล์
                          </button>
                        </div>
                      </div>
                      {imagePreview && (
                        <div className="mt-2 flex justify-center">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="w-16 h-16 rounded-full object-cover border-2" 
                            style={{ borderColor: themeColors.pink }} 
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4 mt-6">
                      <LoadingButton
                        type="submit"
                        size="lg"
                        className="w-full py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform border-0 focus:outline-none focus:scale-[1.02] active:scale-[0.98]"
                        style={{
                          background: `linear-gradient(135deg, ${themeColors.pink}, ${themeColors.lightBlue})`,
                          color: 'white',
                          minHeight: '56px'
                        }}
                        isLoading={isLoading}
                        loadingText={isEditing ? "🔄 กำลังบันทึก..." : "🔄 กำลังลงทะเบียน..."}
                      >
                        {isEditing ? '💾 บันทึกการแก้ไข' : '📝 ลงทะเบียน'}
                      </LoadingButton>
                      
                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => setAuthMode('login')}
                          className="w-full py-3 rounded-2xl font-medium border-2 bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all duration-200 focus:outline-none focus:scale-[1.02] active:scale-[0.98]"
                          style={{ 
                            borderColor: themeColors.lightPink,
                            color: themeColors.textPrimary,
                            minHeight: '48px'
                          }}
                        >
                          🔐 มีบัญชีแล้ว? เข้าสู่ระบบ
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            </div>
          )
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={cancelLogout}></div>
          <div 
            className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl max-w-sm w-full p-6 relative z-10 border-2"
            style={{ borderColor: themeColors.lightPink }}
          >
            <h3 
              className="text-lg font-bold mb-4"
              style={{ color: themeColors.textPrimary }}
            >
              🚪 ยืนยันการออกจากระบบ
            </h3>
            <p 
              className="text-sm mb-6"
              style={{ color: themeColors.textSecondary }}
            >
              คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?
            </p>
            <div className="flex gap-3">
              <button 
                className="flex-1 py-3 rounded-2xl font-medium border-2 transition-all duration-200 focus:outline-none focus:scale-[1.02] active:scale-[0.98]"
                style={{ 
                  borderColor: themeColors.textSecondary,
                  color: themeColors.textSecondary,
                  backgroundColor: 'transparent'
                }}
                onClick={cancelLogout}
              >
                ยกเลิก
              </button>
              <button 
                className="flex-1 py-3 rounded-2xl text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: '#ef4444' }}
                onClick={confirmLogout}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  ออกจากระบบ
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 left-4 right-4 z-50 animate-bounce">
          <div 
            className={`shadow-xl rounded-2xl border-2 p-4 ${
              toast.type === 'success' 
                ? 'bg-gradient-to-r from-green-400 to-green-500 text-white border-green-300' 
                : toast.type === 'error'
                ? 'bg-gradient-to-r from-red-400 to-red-500 text-white border-red-300'
                : 'bg-gradient-to-r from-blue-400 to-blue-500 text-white border-blue-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="text-xl">
                {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm leading-tight">{toast.message}</p>
              </div>
              <button 
                onClick={() => setToast(prev => ({ ...prev, show: false }))}
                className="w-6 h-6 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
