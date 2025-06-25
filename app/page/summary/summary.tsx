'use client'

import { useState, useEffect } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'
import { localStorageService } from '../../../lib/localStorage'

// Define interfaces
interface MedicineData {
  id: number
  medicineName: string
  medicineImageUrl?: string
  currentStock: number
  dosage: number
}

interface MedicineStatistics {
  medicine: MedicineData
  statistics: {
    taken: number
    skipped: number
    missed: number
    pending: number
    total: number
  }
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

export default function Summary() {
  const [statistics, setStatistics] = useState<MedicineStatistics[]>([])
  const [isLoadingStatistics, setIsLoadingStatistics] = useState(true)
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineStatistics | null>(null)

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    try {
      setIsLoadingStatistics(true)
      const patientData = localStorageService.getItem<PatientData>('patient-data')
      
      if (!patientData?.phoneNumber) {
        console.log('No patient data found')
        setStatistics([])
        return
      }

      const response = await fetch(`/api/medicines/consumption?phoneNumber=${patientData.phoneNumber}`)
      
      if (response.ok) {
        const result = await response.json()
        setStatistics(result.statistics || [])
      } else {
        console.error('Failed to load statistics')
        setStatistics([])
      }
    } catch (error) {
      console.error('Error loading statistics:', error)
      setStatistics([])
    } finally {
      setIsLoadingStatistics(false)
    }
  }

  const calculatePercentage = (value: number, total: number) => {
    return total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
  }

  const getComplianceRate = (statistics: MedicineStatistics['statistics']) => {
    const { taken, total } = statistics
    return calculatePercentage(taken, total)
  }

  const getComplianceColor = (percentage: number) => {
    if (percentage >= 80) return '#22c55e' // Green
    if (percentage >= 60) return '#f59e0b' // Orange
    return '#ef4444' // Red
  }

  const getTotalStatistics = () => {
    return statistics.reduce(
      (total, stat) => ({
        taken: total.taken + stat.statistics.taken,
        skipped: total.skipped + stat.statistics.skipped,
        missed: total.missed + stat.statistics.missed,
        pending: total.pending + stat.statistics.pending,
        total: total.total + stat.statistics.total,
      }),
      { taken: 0, skipped: 0, missed: 0, pending: 0, total: 0 }
    )
  }

  return (
    <div className="flex-1 px-4 pb-24 overflow-y-auto">
      <div className="container mx-auto max-w-2xl py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: themeColors.textPrimary }}>สรุปการกินยา</h1>
          <p className="text-gray-500 text-sm">สถิติและผลการปฏิบัติตามการกินยา</p>
        </div>

        {isLoadingStatistics ? (
          <div className="text-center py-12">
            <LoadingSpinner />
            <p className="text-gray-500 mt-4">กำลังโหลดข้อมูลสถิติ...</p>
          </div>
        ) : statistics.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <p className="text-gray-500">ยังไม่มีข้อมูลสถิติ</p>
            <p className="text-gray-400 text-sm">เมื่อคุณเริ่มกินยาและบันทึกข้อมูล สถิติจะแสดงที่นี่</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overall Statistics */}
            {(() => {
              const totalStats = getTotalStatistics()
              const complianceRate = parseFloat(getComplianceRate({ ...totalStats }))
              
              return (
                <div className="card bg-white/90 shadow-xl rounded-3xl border-2" style={{ borderColor: themeColors.lightPink }}>
                  <div className="card-body p-6">
                    <h2 className="text-xl font-bold mb-4" style={{ color: themeColors.textPrimary }}>
                      สถิติรวม
                    </h2>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{totalStats.taken}</div>
                        <div className="text-sm text-gray-600">กินแล้ว</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{totalStats.skipped}</div>
                        <div className="text-sm text-gray-600">ข้าม</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{totalStats.missed}</div>
                        <div className="text-sm text-gray-600">พลาด</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{totalStats.pending}</div>
                        <div className="text-sm text-gray-600">รอดำเนินการ</div>
                      </div>
                    </div>

                    {/* Compliance Rate */}
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-2">อัตราการปฏิบัติตาม</div>
                      <div 
                        className="text-4xl font-bold mb-2"
                        style={{ color: getComplianceColor(complianceRate) }}
                      >
                        {complianceRate}%
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="h-3 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${complianceRate}%`,
                            backgroundColor: getComplianceColor(complianceRate)
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Individual Medicine Statistics */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold" style={{ color: themeColors.textPrimary }}>
                สถิติแต่ละยา
              </h2>
              
              {statistics.map((medicineStat) => {
                const complianceRate = parseFloat(getComplianceRate(medicineStat.statistics))
                
                return (
                  <div 
                    key={medicineStat.medicine.id} 
                    className="card bg-white/90 shadow-xl rounded-3xl border-2 cursor-pointer hover:shadow-2xl transition-all"
                    style={{ borderColor: themeColors.lightPink }}
                    onClick={() => setSelectedMedicine(medicineStat)}
                  >
                    <div className="card-body p-6">
                      <div className="flex gap-4">
                        {/* Medicine Image */}
                        <div className="flex-shrink-0">
                          {medicineStat.medicine.medicineImageUrl ? (
                            <img 
                              src={medicineStat.medicine.medicineImageUrl} 
                              alt={medicineStat.medicine.medicineName}
                              className="w-16 h-16 rounded-xl object-cover border-2"
                              style={{ borderColor: themeColors.pink }}
                            />
                          ) : (
                            <div 
                              className="w-16 h-16 rounded-xl flex items-center justify-center border-2"
                              style={{ 
                                borderColor: themeColors.pink,
                                backgroundColor: themeColors.lightPink
                              }}
                            >
                              <span className="text-xl">💊</span>
                            </div>
                          )}
                        </div>

                        {/* Medicine Info & Statistics */}
                        <div className="flex-1">
                          <h3 className="text-lg font-bold mb-2" style={{ color: themeColors.textPrimary }}>
                            {medicineStat.medicine.medicineName}
                          </h3>
                          
                          <div className="grid grid-cols-4 gap-2 mb-3 text-sm">
                            <div className="text-center">
                              <div className="font-bold text-green-600">{medicineStat.statistics.taken}</div>
                              <div className="text-xs text-gray-600">กิน</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-orange-600">{medicineStat.statistics.skipped}</div>
                              <div className="text-xs text-gray-600">ข้าม</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-red-600">{medicineStat.statistics.missed}</div>
                              <div className="text-xs text-gray-600">พลาด</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-blue-600">{medicineStat.statistics.pending}</div>
                              <div className="text-xs text-gray-600">รอ</div>
                            </div>
                          </div>

                          {/* Compliance Rate Bar */}
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="h-2 rounded-full transition-all duration-300"
                                  style={{ 
                                    width: `${complianceRate}%`,
                                    backgroundColor: getComplianceColor(complianceRate)
                                  }}
                                ></div>
                              </div>
                            </div>
                            <div 
                              className="text-sm font-bold"
                              style={{ color: getComplianceColor(complianceRate) }}
                            >
                              {complianceRate}%
                            </div>
                          </div>

                          {/* Stock Info */}
                          <div className="mt-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${medicineStat.medicine.currentStock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              เหลือ {medicineStat.medicine.currentStock} เม็ด
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Medicine Detail Modal */}
        {selectedMedicine && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="modal-overlay absolute inset-0 bg-black bg-opacity-50" onClick={() => setSelectedMedicine(null)}></div>
            <div className="modal-container bg-white rounded-3xl shadow-xl max-w-md w-full p-6 relative z-10 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold" style={{ color: themeColors.textPrimary }}>
                  รายละเอียดสถิติ
                </h3>
                <button 
                  onClick={() => setSelectedMedicine(null)}
                  className="btn btn-ghost btn-sm"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Medicine Image & Info */}
                <div className="text-center">
                  {selectedMedicine.medicine.medicineImageUrl ? (
                    <img 
                      src={selectedMedicine.medicine.medicineImageUrl} 
                      alt={selectedMedicine.medicine.medicineName}
                      className="w-24 h-24 mx-auto rounded-xl object-cover border-2 mb-3"
                      style={{ borderColor: themeColors.pink }}
                    />
                  ) : (
                    <div 
                      className="w-24 h-24 mx-auto rounded-xl flex items-center justify-center border-2 mb-3"
                      style={{ 
                        borderColor: themeColors.pink,
                        backgroundColor: themeColors.lightPink
                      }}
                    >
                      <span className="text-2xl">💊</span>
                    </div>
                  )}
                  <h4 className="text-lg font-bold" style={{ color: themeColors.textPrimary }}>
                    {selectedMedicine.medicine.medicineName}
                  </h4>
                  <p className="text-sm text-gray-600">
                    ขนาดการกิน: {selectedMedicine.medicine.dosage} เม็ด/ครั้ง
                  </p>
                </div>

                {/* Detailed Statistics */}
                <div className="space-y-4">
                  <h5 className="font-semibold text-gray-700">สถิติการกินยา</h5>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-green-800">กินแล้ว</span>
                      </div>
                      <div className="text-green-800 font-bold">
                        {selectedMedicine.statistics.taken} ครั้ง
                        {selectedMedicine.statistics.total > 0 && (
                          <span className="text-sm ml-1">
                            ({calculatePercentage(selectedMedicine.statistics.taken, selectedMedicine.statistics.total)}%)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span className="text-orange-800">ข้าม</span>
                      </div>
                      <div className="text-orange-800 font-bold">
                        {selectedMedicine.statistics.skipped} ครั้ง
                        {selectedMedicine.statistics.total > 0 && (
                          <span className="text-sm ml-1">
                            ({calculatePercentage(selectedMedicine.statistics.skipped, selectedMedicine.statistics.total)}%)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-red-800">พลาด</span>
                      </div>
                      <div className="text-red-800 font-bold">
                        {selectedMedicine.statistics.missed} ครั้ง
                        {selectedMedicine.statistics.total > 0 && (
                          <span className="text-sm ml-1">
                            ({calculatePercentage(selectedMedicine.statistics.missed, selectedMedicine.statistics.total)}%)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-blue-800">รอดำเนินการ</span>
                      </div>
                      <div className="text-blue-800 font-bold">
                        {selectedMedicine.statistics.pending} ครั้ง
                        {selectedMedicine.statistics.total > 0 && (
                          <span className="text-sm ml-1">
                            ({calculatePercentage(selectedMedicine.statistics.pending, selectedMedicine.statistics.total)}%)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Total & Compliance */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-semibold text-gray-700">รวมทั้งหมด:</span>
                      <span className="font-bold text-gray-900">{selectedMedicine.statistics.total} ครั้ง</span>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-2">อัตราการปฏิบัติตาม</div>
                      <div 
                        className="text-2xl font-bold mb-2"
                        style={{ color: getComplianceColor(parseFloat(getComplianceRate(selectedMedicine.statistics))) }}
                      >
                        {getComplianceRate(selectedMedicine.statistics)}%
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${getComplianceRate(selectedMedicine.statistics)}%`,
                            backgroundColor: getComplianceColor(parseFloat(getComplianceRate(selectedMedicine.statistics)))
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Stock Status */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">สต็อกยาที่เหลือ:</span>
                      <span className={`font-bold ${selectedMedicine.medicine.currentStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedMedicine.medicine.currentStock} เม็ด
                      </span>
                    </div>
                    {selectedMedicine.medicine.currentStock <= 5 && (
                      <div className="mt-2 p-2 bg-yellow-50 border-l-4 border-yellow-400">
                        <p className="text-yellow-800 text-sm">
                          ⚠️ ยาเหลือน้อย ควรเตรียมซื้อยาใหม่
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
