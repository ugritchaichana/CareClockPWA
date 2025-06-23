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
// --- END NEW THEME COLORS ---

interface Medicine {
    id: string;
    name: string;
    dosage: string;
    timeSchedule: string[];
    remainingDays: number;
    isActive: boolean;
}

interface PatientInfo {
    name: string;
    age: string;
    gender: string;
    bloodType: string;
    weight: string;
    height: string;
    congenitalDisease: string;
    drugAllergy: string;
}

export default function SummaryPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This ensures the component only renders on the client where localStorage is available.
    setIsClient(true);
    const savedMedicines = localStorageService.getItem<Medicine[]>('medicines') || [];
    const savedPatientInfo = localStorageService.getItem<PatientInfo>('patient-info');
    setMedicines(savedMedicines);
    setPatientInfo(savedPatientInfo);
  }, []);

  const activeMedicines = medicines.filter(m => m.isActive).length;
  const inactiveMedicines = medicines.length - activeMedicines;
  const lowStockMedicines = medicines.filter(m => m.isActive && m.remainingDays <= 7).length;

  if (!isClient) {
    // Render nothing or a loading indicator on the server
    return null;
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
          <h1 className="text-xl font-bold" style={{ color: themeColors.textPrimary }}>สรุปรายการ</h1>
        </div>
        <div className="flex-none">
            <button className="btn btn-ghost btn-circle">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" /></svg>
            </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {/* Patient Info Card */}
        <div className="card bg-white/90 shadow-lg mb-4">
          <div className="card-body p-5">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg, #FB929E, #AEDEFC)' }}>
                    <span className="text-3xl">{patientInfo?.gender === 'ชาย' ? '👨' : patientInfo?.gender === 'หญิง' ? '👩' : '👤'}</span>
                </div>
                <div>
                    <h2 className="card-title font-bold text-2xl" style={{color: themeColors.textPrimary}}>{patientInfo?.name || 'ยังไม่มีข้อมูล'}</h2>
                    <p className="text-gray-500">{patientInfo ? `${patientInfo.age} ปี, ${patientInfo.bloodType}` : 'กรุณาเพิ่มข้อมูลผู้ป่วย'}</p>
                </div>
            </div>
          </div>
        </div>

        {/* Medicine Stats */}
        <div className="grid grid-cols-3 gap-3 text-center mb-4">
            <div className="card bg-white/80 p-3 shadow-md">
                <div className="text-2xl font-bold" style={{color: themeColors.pink}}>{medicines.length}</div>
                <div className="text-xs text-gray-500">ยาทั้งหมด</div>
            </div>
            <div className="card bg-white/80 p-3 shadow-md">
                <div className="text-2xl font-bold text-green-500">{activeMedicines}</div>
                <div className="text-xs text-gray-500">กำลังทาน</div>
            </div>
            <div className="card bg-white/80 p-3 shadow-md">
                <div className="text-2xl font-bold text-yellow-500">{lowStockMedicines}</div>
                <div className="text-xs text-gray-500">ยาใกล้หมด</div>
            </div>
        </div>

        {/* Medicine List */}
        <div className="card bg-white/90 shadow-lg mb-4">
            <div className="card-body p-5">
                <h3 className="card-title text-base font-bold mb-2" style={{color: themeColors.textPrimary}}>รายการยาที่กำลังทาน</h3>
                {activeMedicines > 0 ? (
                    <ul className="space-y-3">
                        {medicines.filter(m => m.isActive).map(med => (
                            <li key={med.id} className="flex justify-between items-center text-sm">
                                <span className="font-medium text-gray-700">{med.name}</span>
                                <span className="text-xs text-gray-500">เหลือ {med.remainingDays} วัน</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-gray-500 py-4">ไม่มียาที่กำลังทานในขณะนี้</p>
                )}
            </div>
        </div>

        {/* Congenital Disease & Allergy Card */}
        <div className="card bg-white/90 shadow-lg">
            <div className="card-body p-5">
                 <h3 className="card-title text-base font-bold mb-2" style={{color: themeColors.textPrimary}}>ข้อมูลสุขภาพเพิ่มเติม</h3>
                 <div className="text-sm space-y-2">
                     <div>
                         <strong className="text-gray-600">โรคประจำตัว:</strong>
                         <p className="text-gray-500 whitespace-pre-wrap">{patientInfo?.congenitalDisease || 'ไม่มีข้อมูล'}</p>
                     </div>
                     <div>
                         <strong className="text-gray-600">ยาที่แพ้:</strong>
                         <p className="text-gray-500 whitespace-pre-wrap">{patientInfo?.drugAllergy || 'ไม่มีข้อมูล'}</p>
                     </div>
                 </div>
            </div>
        </div>

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
        <Link href="/notifications" className="text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="btm-nav-label text-xs">แจ้งเตือน</span>
        </Link>
        <button className="active text-white" style={{ backgroundColor: themeColors.pink }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          <span className="btm-nav-label text-xs">สรุป</span>
        </button>
      </div>
    </div>
  )
}
