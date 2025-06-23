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
  const [customPrefix, setCustomPrefix] = useState('')
  const [customMedicalRight, setCustomMedicalRight] = useState('')
  const [dataSource, setDataSource] = useState<'database' | 'localStorage' | null>(null)
  
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
  };  useEffect(() => {
    console.log('🔄 useEffect: Loading patient data...')
    
    // Check localStorage first for display purposes only
    const savedData = localStorageService.getItem<PatientData>('patient-data')
    console.log('💾 Saved data from localStorage:', savedData)
      if (savedData) {
      console.log('✅ Patient data found in localStorage, setting states...')
      setPatientData(savedData)
      setIsRegistered(true)
      setImagePreview(savedData.profileImage || '')
      setDataSource('localStorage')
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
              setImagePreview(result.data.profileImage || '')
              setDataSource('database')
              localStorageService.setItem('patient-data', result.data)
            } else {
              setDataSource('database') // Data is same but confirmed from database
            }
          })
          .catch(error => {
            console.log('⚠️ Background database sync failed:', error)
            // Keep localStorage source indicator
          })
      }
    } else {
      console.log('❌ No saved patient data found in localStorage')
    }
  }, [])
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🔐 Login attempt started...')
    console.log('📱 Login phone:', loginPhone)
    
    if (!loginPhone) {
      console.log('❌ No phone number provided')
      alert('กรุณากรอกเบอร์มือถือ')
      return
    }

    // Remove formatting for comparison
    const phoneDigits = loginPhone.replace(/[^\d]/g, '')
    console.log('🔢 Phone digits:', phoneDigits)
    
    if (phoneDigits.length !== 10) {
      console.log('❌ Phone number not 10 digits')
      alert('กรุณากรอกเบอร์มือถือให้ครบ 10 หลัก')
      return
    }

    setIsLoading(true)
    console.log('⏳ Loading started...')
      try {
      // Query database directly (no localStorage fallback for login)
      console.log('🌐 Checking database for login...')
      const response = await fetch(`/api/data?type=patient-data&phoneNumber=${phoneDigits}`)
      
      if (response.ok) {
        const dbResult = await response.json()
        console.log('✅ Login successful - data found in database:', dbResult)
          const patientInfo = dbResult.data
        setPatientData(patientInfo)
        setIsRegistered(true)
        setShowAuthForm(false)
        setLoginPhone('')
        setImagePreview(patientInfo.profileImage || '')
        setDataSource('database')
        
        // Save to localStorage for display purposes only
        localStorageService.setItem('patient-data', patientInfo)
        
        console.log('📊 Login states set - isRegistered: true, showAuthForm: false')
        alert('เข้าสู่ระบบสำเร็จ!')
      } else if (response.status === 404) {
        console.log('❌ Login failed - user not found in database')
        alert('ไม่พบข้อมูลผู้ใช้ในระบบ กรุณาลงทะเบียนก่อน')
      } else {
        throw new Error('Database connection failed')
      }
    } catch (error) {
      console.error('❌ Login error:', error)
      alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setIsLoading(false)
      console.log('⏳ Loading finished')
    }
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
      setCustomPrefix('')
      setCustomMedicalRight('')
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
      const finalPrefix = formData.prefix === 'อื่นๆ' ? customPrefix : formData.prefix
      const finalMedicalRight = formData.medicalRight === 'อื่นๆ' ? customMedicalRight : formData.medicalRight

      // Validate required fields
      if (!finalPrefix || !formData.firstName || !formData.lastName || !formData.age || !formData.phoneNumber) {
        alert('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน')
        setIsLoading(false)
        return
      }

      const phoneDigits = formData.phoneNumber.replace(/[^\d]/g, '')
      if (phoneDigits.length !== 10) {
        alert('กรุณากรอกเบอร์มือถือให้ครบ 10 หลัก')
        setIsLoading(false)
        return
      }      // Check if this is an edit or new registration
      const isEditing = patientData !== null

      console.log('🔍 Edit detection:', { 
        isEditing, 
        patientDataExists: patientData !== null,
        patientData: patientData,
        authMode: authMode 
      })

      const patientInfo: PatientData = {
        ...formData,
        prefix: finalPrefix,
        medicalRight: finalMedicalRight,
        age: parseInt(formData.age),
        phoneNumber: phoneDigits,
        registeredAt: isEditing ? patientData.registeredAt : new Date().toISOString()
      }

      console.log('💾 Saving patient data...', { isEditing, patientInfo })      // Save to MongoDB only
      console.log('🌐 Preparing to send data to API...')
      const payload = {
        type: 'patient-data',
        action: isEditing ? 'update' : 'create',
        phoneNumber: phoneDigits, // Use as unique identifier
        data: patientInfo
      }
      console.log('📦 API Payload:', JSON.stringify(payload, null, 2))
      
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      console.log('📡 API Response status:', response.status)
      console.log('📡 API Response ok:', response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error response:', errorText)
        
        // Parse error message for better user feedback
        let errorMessage = 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
        try {
          const errorData = JSON.parse(errorText)
          if (errorData.error === 'Patient with this phone number already exists') {
            errorMessage = 'เบอร์โทรศัพท์นี้มีการลงทะเบียนแล้ว กรุณาใช้เบอร์อื่น หรือเข้าสู่ระบบด้วยเบอร์นี้'
          }
        } catch (e) {
          // Use default error message
        }
        
        alert(errorMessage)
        setIsLoading(false)
        return
      }      const dbResult = await response.json()
      console.log('✅ Data saved to MongoDB:', dbResult)
        // Update localStorage only after successful database save
      localStorageService.setItem('patient-data', patientInfo)
      console.log('✅ Data updated in localStorage after database save')
      
      setPatientData(patientInfo)
      setIsRegistered(true)
      setShowAuthForm(false)
      setDataSource('database')

      setCustomPrefix('')
      setCustomMedicalRight('')

      // Show success message
      alert(isEditing ? 'แก้ไขข้อมูลสำเร็จ!' : 'ลงทะเบียนเรียบร้อยแล้ว!')    } catch (error) {
      console.error('Registration error:', error)
      alert('เกิดข้อผิดพลาดในการลงทะเบียน')
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
        chronicDiseases: patientData.chronicDiseases,
        profileImage: patientData.profileImage
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

      console.log('🖼️ Setting image preview:', patientData.profileImage ? 'Image exists' : 'No image')
      setImagePreview(patientData.profileImage || '')
      
      console.log('🔄 Switching to register mode and showing form...')
      setAuthMode('register')
      setShowAuthForm(true)
      
      console.log('✨ Edit process completed!')
    } else {      console.log('❌ No patient data found!')
      alert('ไม่พบข้อมูลผู้ใช้ กรุณาลงทะเบียนก่อน')
    }
  }

  const handleDelete = async () => {
    if (confirm('คุณต้องการลบข้อมูลการลงทะเบียนใช่หรือไม่?')) {
      console.log('🗑️ Starting delete process...')
      
      if (patientData?.phoneNumber) {
        try {
          console.log('🌐 Attempting to delete from database...')
          const phoneDigits = patientData.phoneNumber.replace(/[^\d]/g, '')
          
          const response = await fetch(`/api/data?type=patient-data&phoneNumber=${phoneDigits}`, {
            method: 'DELETE'
          })
          
          if (response.ok) {
            const result = await response.json()
            console.log('✅ Successfully deleted from database:', result)
          } else {
            console.log('⚠️ Could not delete from database, continuing with local deletion')
          }
        } catch (error) {
          console.error('❌ Error deleting from database:', error)
          console.log('⚠️ Continuing with local deletion despite database error')
        }      }
      
      // Remove from localStorage and reset state
      localStorageService.removeItem('patient-data')
      console.log('✅ Data removed from localStorage')
      
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
      setCustomPrefix('')
      setCustomMedicalRight('')
    }
  }

  return (
    <div className="flex-1 px-4 pb-24 overflow-y-auto">
      <div className="container mx-auto max-w-2xl">
        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-2 bg-yellow-100 text-xs rounded">
            Debug: isRegistered={isRegistered.toString()}, showAuthForm={showAuthForm.toString()}, authMode={authMode}, patientData={patientData ? 'exists' : 'null'}
          </div>
        )}
        
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
                  <p className="text-lg text-gray-600">อายุ {patientData.age} ปี ✨</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="card bg-white/90 shadow-xl rounded-3xl" style={{ border: '2px solid #AEDEFC' }}>
                <div className="card-body">
                  <h2 className="card-title text-gray-700 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#AEDEFC' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    ข้อมูลการติดต่อ
                  </h2>                  <div className="space-y-2">
                    <p className="text-gray-600"><strong>📞 เบอร์โทรศัพท์:</strong> {patientData.phoneNumber ? formatPhoneNumber(patientData.phoneNumber) : 'ไม่ระบุ'}</p>
                    {dataSource && (
                      <p className="text-sm flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          dataSource === 'database' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {dataSource === 'database' ? '🌐 ข้อมูลจากเซิร์ฟเวอร์' : '💾 ข้อมูลจากเครื่อง'}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>              <div className="card bg-white/90 shadow-xl rounded-3xl border-2" style={{ borderColor: themeColors.lightPink }}>
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
              </div>              <div className="card-actions justify-center mt-6 space-x-4">
                <button 
                  onClick={() => {
                    console.log('🖱️ Edit button clicked!')
                    console.log('📊 Current state:', {
                      isRegistered,
                      patientData: patientData ? 'exists' : 'null',
                      showAuthForm,
                      authMode
                    })
                    handleEdit()
                  }} 
                  className="btn btn-lg gap-2 text-white shadow-lg hover:shadow-xl transition-all" 
                  style={{ 
                    background: `linear-gradient(135deg, ${themeColors.pink}, ${themeColors.lightBlue})`,
                    border: 'none'
                  }}
                >
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
                            <div className="flex items-center gap-2">
                              <select
                                name="prefix"
                                value={formData.prefix}
                                onChange={handleInputChange}
                                className={`select select-bordered bg-gray-50 ${formData.prefix === 'อื่นๆ' ? 'w-1/2' : 'w-full'}`}
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
                                  className="input input-bordered w-1/2 bg-gray-50"
                                  required
                                />
                              )}
                            </div>
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
                              min="0"
                              max="120"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="label">
                              <span className="label-text font-medium">ชื่อ (ภาษาไทย)</span>
                            </label>
                            <input
                              type="text"
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleInputChange}
                              placeholder="ชื่อ"
                              className="input input-bordered w-full bg-gray-50"
                              pattern="[ก-ฮะ-์\s]+"
                              title="กรุณากรอกเป็นภาษาไทยเท่านั้น"
                              required
                            />
                          </div>
                          <div>
                            <label className="label">
                              <span className="label-text font-medium">นามสกุล (ภาษาไทย)</span>
                            </label>
                            <input
                              type="text"
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleInputChange}
                              placeholder="นามสกุล"
                              className="input input-bordered w-full bg-gray-50"
                              pattern="[ก-ฮะ-์\s]+"
                              title="กรุณากรอกเป็นภาษาไทยเท่านั้น"
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
                          <div className="flex items-center gap-2">
                            <select
                              name="medicalRight"
                              value={formData.medicalRight}
                              onChange={handleInputChange}
                              className={`select select-bordered bg-gray-50 ${formData.medicalRight === 'อื่นๆ' ? 'w-1/2' : 'w-full'}`}
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
                                className="input input-bordered w-1/2 bg-gray-50"
                              />
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="label">
                            <span className="label-text font-medium">โรคประจำตัว (ถ้ามี)</span>
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
                            <span className="label-text font-medium">รูปภาพประจำตัว</span>
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
                            {isLoading ? (patientData ? 'กำลังบันทึก...' : 'กำลังลงทะเบียน...') : (patientData ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล')}
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
