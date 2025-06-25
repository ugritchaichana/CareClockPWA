'use client'

import { useEffect, useState } from 'react'
import { localStorageService } from '../../../lib/localStorage'
import { useRouter } from 'next/navigation'
import LoadingButton from '@/components/LoadingButton'

// Corrected PatientData interface
interface PatientData {
  prefix: string
  firstName: string
  lastName: string
  age: number
  phoneNumber: string
  medicalRight: string
  chronicDiseases: string | null
  drugAllergy: string | null
  profileImageUrl: string | null // Corrected field name
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
  const router = useRouter()
  const [isRegistered, setIsRegistered] = useState(false)
  const [showAuthForm, setShowAuthForm] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [patientData, setPatientData] = useState<PatientData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [rawFile, setRawFile] = useState<File | null>(null) // State for the actual file
  const [isEditing, setIsEditing] = useState(false) // State to track editing mode
  const [customPrefix, setCustomPrefix] = useState('')
  const [customMedicalRight, setCustomMedicalRight] = useState('')
  const [dataSource, setDataSource] = useState<'database' | 'loading' | 'offline' | null>(null)
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const [loginError, setLoginError] = useState('')

  // Login form state
  const [loginPhone, setLoginPhone] = useState('')
  
  // Updated form state
  const [formData, setFormData] = useState({
    prefix: '',
    firstName: '',
    lastName: '',
    age: '',
    phoneNumber: '',
    medicalRight: '',
    chronicDiseases: '',
    drugAllergy: '', // Added drugAllergy
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
  };  useEffect(() => {
    console.log('🔄 useEffect: Loading patient data...')
    
    // Check localStorage first for display purposes only
    const savedData = localStorageService.getItem<PatientData>('patient-data')
    console.log('💾 Saved data from localStorage:', savedData)
      if (savedData) {
      console.log('✅ Patient data found in localStorage, setting states...')
      setPatientData(savedData)
      setIsRegistered(true)
      setImagePreview(savedData.profileImageUrl || '') // Use profileImageUrl
      setDataSource('loading') // Set loading state initially
      console.log('📊 States set from localStorage - isRegistered: true')
      
      // Also verify with database in background and update if different
      if (savedData.phoneNumber) {
        fetch(`/api/data?type=patient-data&phoneNumber=${savedData.phoneNumber}`)
          .then(response => {
            if (response.ok) {
              return response.json()
            }
            throw new Error('Patient not found in database')
          })
          .then(result => {
            console.log('🔄 Background sync: Database data:', result.data)
            // Only update if data is different
            if (JSON.stringify(result.data) !== JSON.stringify(savedData)) {
              console.log('🔄 Data differs, updating from database...')
              setPatientData(result.data)
              setImagePreview(result.data.profileImageUrl || '') // Use profileImageUrl
              localStorageService.setItem('patient-data', result.data)
            }
            setDataSource('database') // Successfully synced with database
          })
          .catch(error => {
            console.log('⚠️ Background database sync failed:', error)
            setDataSource('offline') // Failed to sync or offline
          })
      } else {
        setDataSource('offline') // No phone number to verify
      }
    } else {
      console.log('❌ No saved patient data found in localStorage')
    }
  }, [])
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault() // Prevent form from reloading the page
    setLoginError('')
    console.log('🔐 Login attempt started...')
    console.log('📱 Login phone:', loginPhone)
    
    if (!loginPhone) {
      return
    }

    const phoneDigits = loginPhone.replace(/[^\d]/g, '')
    console.log('🔢 Phone digits:', phoneDigits)
    
    if (phoneDigits.length !== 10) {
      return
    }

    setIsLoading(true)
    console.log('⏳ Loading started...')
    try {
      const response = await fetch(`/api/user/login?phoneNumber=${phoneDigits}`)

      if (response.status === 404) {
        setLoginError('ไม่พบข้อมูลผู้ใช้ กรุณาลงทะเบียนก่อน')
      } else if (!response.ok) {
        throw new Error('Login failed')
      } else {
        const result = await response.json()
        console.log('✅ Login success:', result)
        setPatientData(result.data)
        setIsRegistered(true)
        setShowAuthForm(false)
        localStorageService.setItem('patient-data', result.data)
        setDataSource('database')
      }
    } catch (error) {
      console.error('Login Error:', error)
      setLoginError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ')
    } finally {
      setIsLoading(false)
      console.log('🏁 Loading finished.')
    }
  }

  const handleLogout = () => {
    setIsLogoutModalOpen(true)
  }

  const confirmLogout = () => {
    localStorageService.removeItem('patient-data')
    console.log('✅ Data removed from localStorage')

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
    setCustomPrefix('')
    setCustomMedicalRight('')
    setIsLogoutModalOpen(false)
  }

  const cancelLogout = () => {
    setIsLogoutModalOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'phoneNumber') {
      setFormData({ ...formData, phoneNumber: formatPhoneNumber(value) })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        // alert('กรุณาอัปโหลดไฟล์รูปภาพนามสกุล .png, .jpg หรือ .jpeg เท่านั้น');
        e.target.value = ''; // Clear the file input
        return;
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setRawFile(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const finalPrefix = formData.prefix === 'อื่นๆ' ? customPrefix : formData.prefix
      const finalMedicalRight = formData.medicalRight === 'อื่นๆ' ? customMedicalRight : formData.medicalRight

      if (!finalPrefix || !formData.firstName || !formData.lastName || !formData.age || !formData.phoneNumber) {
        setIsLoading(false)
        return
      }

      const phoneDigits = formData.phoneNumber.replace(/[^\d]/g, '')
      if (phoneDigits.length !== 10) {
        setIsLoading(false)
        return
      }

      const formDataPayload = new FormData()

      // Append all text fields
      formDataPayload.append('prefix', finalPrefix)
      formDataPayload.append('firstName', formData.firstName)
      formDataPayload.append('lastName', formData.lastName)
      formDataPayload.append('age', formData.age)
      formDataPayload.append('phoneNumber', phoneDigits)
      formDataPayload.append('medicalRight', finalMedicalRight)
      formDataPayload.append('chronicDiseases', formData.chronicDiseases || '')
      formDataPayload.append('drugAllergy', formData.drugAllergy || '')

      // Append the file if it exists
      if (rawFile) {
        formDataPayload.append('profileImg', rawFile)
      }

      const apiEndpoint = isEditing ? '/api/user/update' : '/api/user/register'
      const apiMethod = isEditing ? 'PUT' : 'POST'

      console.log(`Sending data to ${apiEndpoint} via ${apiMethod}`)

      const response = await fetch(apiEndpoint, {
        method: apiMethod,
        body: formDataPayload, // Browser will set Content-Type to multipart/form-data
      })

      console.log('📡 API Response status:', response.status)
      console.log('📡 API Response ok:', response.ok)

      if (!response.ok) {
        const errorResult = await response.json()
        console.error('❌ API Error response:', errorResult)
        throw new Error(errorResult.message || 'An error occurred while saving data.')
      }

      const result = await response.json()
      console.log('✅ API Success response:', result)

      const updatedPatientData = result.data
      localStorageService.setItem('patient-data', updatedPatientData) // Corrected key
      setPatientData(updatedPatientData)
      setRawFile(null)


      if (isEditing) {
        setIsEditing(false)
        setShowAuthForm(false)
      } else {
        // This is a new registration, so we can clear the form
        // and switch to the "registered" view.
        setShowAuthForm(false)
        setIsRegistered(true)
      }
    } catch (error) {
      console.error('An unexpected error occurred:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    console.log('🔧 handleEdit clicked!')
    console.log('📋 Current patientData:', patientData)
    
    if (patientData) {
      console.log('✅ Patient data exists, processing edit...')
      
      const isCustomPrefix = !prefixOptions.includes(patientData.prefix)
      const isCustomMedicalRight = !medicalRightOptions.includes(patientData.medicalRight)
      
      console.log('🏷️ Prefix check:', { 
        prefix: patientData.prefix, 
        isCustom: isCustomPrefix 
      })
      console.log('🏥 Medical right check:', { 
        medicalRight: patientData.medicalRight, 
        isCustom: isCustomMedicalRight 
      })

      const newFormData = {
        prefix: isCustomPrefix ? 'อื่นๆ' : patientData.prefix,
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        age: patientData.age.toString(),
        phoneNumber: formatPhoneNumber(patientData.phoneNumber),
        medicalRight: isCustomMedicalRight ? 'อื่นๆ' : patientData.medicalRight,
        chronicDiseases: patientData.chronicDiseases || '',
        drugAllergy: patientData.drugAllergy || '', // Add drugAllergy
      }
      
      console.log('📝 Setting form data:', newFormData)
      setFormData(newFormData)
      
      if (isCustomPrefix) {
        console.log('🎯 Setting custom prefix:', patientData.prefix)
        setCustomPrefix(patientData.prefix)
      } else {
        setCustomPrefix('')
      }
      
      if (isCustomMedicalRight) {
        console.log('🎯 Setting custom medical right:', patientData.medicalRight)
        setCustomMedicalRight(patientData.medicalRight)
      } else {
        setCustomMedicalRight('')
      }

      console.log('🖼️ Setting image preview:', patientData.profileImageUrl ? 'Image exists' : 'No image')
      setImagePreview(patientData.profileImageUrl || '') // Use profileImageUrl
      
      console.log('🔄 Switching to register mode and showing form...')
      setIsEditing(true) // Set editing mode
      setAuthMode('register')
      setShowAuthForm(true)
      
      console.log('✨ Edit process completed!')
    } else {      console.log('❌ No patient data found!')
    }
  }

  return (
    <div className="flex-1 px-4 pb-24 overflow-y-auto">
      <div className="container mx-auto max-w-2xl">
        {isRegistered && patientData && !showAuthForm ? (
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
                      {patientData.profileImageUrl ? (
                        <img src={patientData.profileImageUrl} alt="Profile" />
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
                  <p className="text-lg text-gray-600">อายุ {patientData.age} ปี ✨</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="card bg-white/90 shadow-xl rounded-3xl" style={{ border: '2px solid #AEDEFC' }}>
                <div className="card-body">                  <h2 className="card-title text-gray-700 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#AEDEFC' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    ข้อมูลการติดต่อ
                  </h2>                <div className="space-y-2">
                    <p className="text-gray-600"><strong>📞 เบอร์โทรศัพท์:</strong> {patientData.phoneNumber ? formatPhoneNumber(patientData.phoneNumber) : 'ไม่ระบุ'}</p>
                  </div>
                </div>
              </div>              <div className="card bg-white/90 shadow-xl rounded-3xl border-2" style={{ borderColor: themeColors.lightPink }}>
                <div className="card-body">
                  <h2 className="card-title flex items-center gap-2" style={{ color: themeColors.textPrimary }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: themeColors.pink }}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 00-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    ข้อมูลการรักษา
                  </h2>
                  <div className="space-y-2">
                    <p style={{ color: themeColors.textSecondary }}><strong>🏥 สิทธิการรักษา:</strong> {patientData.medicalRight || 'ไม่ระบุ'}</p>
                    <p style={{ color: themeColors.textSecondary }}><strong>💊 โรคประจำตัว:</strong> {patientData.chronicDiseases || 'ไม่มี'}</p>
                    <p style={{ color: themeColors.textSecondary }}><strong>⚠️ แพ้ยา:</strong> {patientData.drugAllergy || 'ไม่มี'}</p>
                  </div>
                </div>
              </div>              <div className="card-actions justify-center mt-6">
                <div className="flex flex-row gap-4 w-full max-w-md mx-auto">                  <button 
                    onClick={() => {
                      console.log('🖱️ Edit button clicked!')
                      console.log('📊 Current state:', {
                        isRegistered,
                        patientData: patientData ? 'exists' : 'null',
                        showAuthForm,
                        authMode,
                      })
                      handleEdit()
                    }}
                    className="btn btn-lg text-white shadow-lg hover:shadow-xl transition-all flex-1 flex-nowrap border-2"
                    style={{
                      background: `linear-gradient(135deg, ${themeColors.pink}, ${themeColors.lightBlue})`,
                      borderColor: themeColors.pink,
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span className="whitespace-nowrap">แก้ไขข้อมูล</span>
                  </button>
                  
                  <button onClick={handleLogout} className="btn btn-lg btn-outline flex-1 flex-nowrap" style={{ 
                    borderColor: themeColors.textSecondary,
                    color: themeColors.textSecondary
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="whitespace-nowrap">ออกจากระบบ</span>
                  </button>
                </div>
              </div>
            </div>
          </div>        ) : (
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
                    <div className="flex items-center justify-between mb-6">                      <h2 className="text-xl font-bold" style={{ color: themeColors.textPrimary }}>
                        {authMode === 'login' ? 'ลงชื่อเข้าใช้' : (patientData ? 'แก้ไขข้อมูล' : 'ลงทะเบียนใหม่')}
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
                      <form onSubmit={handleLogin} className="space-y-4">                        <div>
                          <label className="label">
                            <span className="label-text font-medium text-gray-800">เบอร์มือถือ</span>
                          </label>
                          <input
                            type="tel"
                            value={loginPhone}
                            onChange={(e) => {
                              setLoginPhone(formatPhoneNumber(e.target.value))
                              if (loginError) setLoginError('')
                            }}
                            placeholder="xxx-xxx-xxxx"
                            className="input input-bordered w-full bg-gray-50 text-gray-800 font-medium"
                            required
                          />
                        </div>
                        
                        {loginError && (
                          <div role="alert" className="alert alert-error text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span>{loginError}</span>
                          </div>
                        )}

                        <div className="space-y-4 mt-6">
                          <LoadingButton
                            type="submit"
                            size="lg"
                            className="w-full"
                            style={{ background: themeColors.pink, border: 'none' }}
                            isLoading={isLoading}
                            loadingText="กำลังเข้าสู่ระบบ..."
                          >
                            เข้าสู่ระบบ
                          </LoadingButton>
                          
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
                        <div className="grid grid-cols-2 gap-4">                        <div>
                          <label className="label">
                            <span className="label-text font-medium text-gray-800">คำนำหน้า</span>
                          </label>
                          <div className="flex items-center gap-2">
                            <select
                              name="prefix"
                              value={formData.prefix}
                              onChange={handleInputChange}
                              className={`select select-bordered bg-gray-50 text-gray-800 font-medium ${formData.prefix === 'อื่นๆ' ? 'w-1/2' : 'w-full'}`}
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
                                className="input input-bordered w-1/2 bg-gray-50 text-gray-800 font-medium"
                                required
                              />
                            )}
                          </div>
                        </div>                          <div>
                            <label className="label">
                              <span className="label-text font-medium text-gray-800">อายุ</span>
                            </label>
                            <input
                              type="number"
                              name="age"
                              value={formData.age}
                              onChange={handleInputChange}
                              placeholder="อายุ"
                              className="input input-bordered w-full bg-gray-50 text-gray-800 font-medium"
                              min="0"
                              max="120"
                              required
                            />
                          </div>
                        </div>                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="label">
                              <span className="label-text font-medium text-gray-800">ชื่อ (ภาษาไทย)</span>
                            </label>
                            <input
                              type="text"
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleInputChange}
                              placeholder="ชื่อ"
                              className="input input-bordered w-full bg-gray-50 text-gray-800 font-medium"
                              pattern="[ก-ฮะ-์\s]+"
                              title="กรุณากรอกเป็นภาษาไทยเท่านั้น"
                              required
                            />
                          </div>
                          <div>
                            <label className="label">
                              <span className="label-text font-medium text-gray-800">นามสกุล (ภาษาไทย)</span>
                            </label>
                            <input
                              type="text"
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleInputChange}
                              placeholder="นามสกุล"
                              className="input input-bordered w-full bg-gray-50 text-gray-800 font-medium"
                              pattern="[ก-ฮะ-์\s]+"
                              title="กรุณากรอกเป็นภาษาไทยเท่านั้น"
                              required
                            />
                          </div>
                        </div>                        <div>
                          <label className="label">
                            <span className="label-text font-medium text-gray-800">เบอร์โทรศัพท์</span>
                          </label>
                          <input
                            type="tel"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleInputChange}
                            placeholder="xxx-xxx-xxxx"
                            className="input input-bordered w-full bg-gray-50 text-gray-800 font-medium"
                            required
                          />
                        </div>                        <div>
                          <label className="label">
                            <span className="label-text font-medium text-gray-800">สิทธิการรักษา</span>
                          </label>
                          <div className="flex items-center gap-2">
                            <select
                              name="medicalRight"
                              value={formData.medicalRight}
                              onChange={handleInputChange}
                              className={`select select-bordered bg-gray-50 text-gray-800 font-medium ${formData.medicalRight === 'อื่นๆ' ? 'w-1/2' : 'w-full'}`}
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
                                className="input input-bordered w-1/2 bg-gray-50 text-gray-800 font-medium"
                              />
                            )}
                          </div>
                        </div>                        <div>
                          <label className="label">
                            <span className="label-text font-medium text-gray-800">โรคประจำตัว (ถ้ามี)</span>
                          </label>
                          <textarea
                            name="chronicDiseases"
                            value={formData.chronicDiseases}
                            onChange={handleInputChange}
                            placeholder="ระบุโรคประจำตัว (หากมี)"
                            className="textarea textarea-bordered w-full bg-gray-50 text-gray-800 font-medium"
                            rows={1}
                          />
                        </div>

                        <div>
                          <label className="label">
                            <span className="label-text font-medium text-gray-800">แพ้ยา (ถ้ามี)</span>
                          </label>
                          <textarea
                            name="drugAllergy"
                            value={formData.drugAllergy}
                            onChange={handleInputChange}
                            placeholder="ระบุยาที่แพ้ (หากมี)"
                            className="textarea textarea-bordered w-full bg-gray-50 text-gray-800 font-medium"
                            rows={1}
                          />
                        </div>                        <div>
                          <label className="label">
                            <span className="label-text font-medium text-gray-800">รูปภาพประจำตัว</span>
                          </label>
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/png, image/jpeg"
                              onChange={handleImageUpload}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              id="file-upload"
                            />
                            <div className="flex items-center justify-between w-full p-3 border-2 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                                 style={{ borderColor: themeColors.pink }}>
                              <span className="text-gray-600 font-medium">
                                {rawFile ? rawFile.name : 'ยังไม่ได้เลือกไฟล์'}
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
                          {imagePreview && (
                            <div className="mt-2 flex justify-center">
                              <img src={imagePreview} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2" style={{ borderColor: themeColors.pink }} />
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-4 mt-6">
                          <LoadingButton
                            type="submit"
                            size="lg"
                            className="w-full"
                            style={{
                              background: `linear-gradient(135deg, ${themeColors.pink}, ${themeColors.lightBlue})`,
                              border: 'none',
                            }}
                            isLoading={isLoading}
                            loadingText={isEditing ? "กำลังบันทึก..." : "กำลังลงทะเบียน..."}
                          >
                            {isEditing ? 'บันทึกการแก้ไข' : 'ลงทะเบียน'}
                          </LoadingButton>
                          
{!isEditing && (
                            <button
                              type="button"
                              onClick={() => setAuthMode('login')}
                              className="btn btn-ghost w-full"
                            >
                              มีบัญชีแล้ว? เข้าสู่ระบบ
                            </button>
                          )}
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

      {/* Logout Confirmation Modal */}
      <dialog open={isLogoutModalOpen} className="modal modal-bottom sm:modal-middle">
        <div className="modal-box bg-white rounded-2xl shadow-xl">
          <h3 className="font-bold text-lg text-gray-800">ยืนยันการออกจากระบบ</h3>
          <p className="py-4 text-gray-600">คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?</p>
          <div className="modal-action mt-4">
            <button className="btn btn-ghost" onClick={cancelLogout}>ยกเลิก</button>
            <button className="btn btn-error text-white gap-2" onClick={confirmLogout}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              ออกจากระบบ
            </button>
          </div>
        </div>
      </dialog>
    </div>
  )
}
