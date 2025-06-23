'use client'

interface WelcomeProps {
  onTabChange?: (tab: string) => void
}

export default function Welcome({ onTabChange }: WelcomeProps) {
  return (
    <div className="flex-1 flex flex-col justify-center px-4 pb-24">
      {/* Hero Section - น่ารัก */}
      <div className="text-center mb-8">
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-xl" style={{ 
            background: 'linear-gradient(135deg, #FB929E, #AEDEFC)',
            boxShadow: '0 10px 30px rgba(251, 146, 158, 0.3)'
          }}>
            <span className="text-2xl">💊</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-700 mb-2">CareClock</h1>
        <p className="text-gray-600 leading-relaxed max-w-xs mx-auto text-xs">
          แอพนี้จะช่วยให้ผู้ป่วยและผู้ดูแลผู้ป่วยสามารถบันทึกข้อมูลและติดตามการกินยาได้อย่างมีประสิทธิภาพ
        </p>
      </div>
      
      {/* Main Menu Cards */}
      <div className="w-full max-w-sm mx-auto">
        <div className="grid grid-cols-2 gap-3">
          {/* ข้อมูลทั่วไป */}
          <button onClick={() => onTabChange?.('userinfo')} className="group">
            <div className="bg-white/90 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 group-active:scale-95" style={{ border: '2px solid #FFDFDF' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 mx-auto shadow-lg group-hover:scale-110 transition-transform" style={{ 
                background: 'linear-gradient(135deg, #FB929E, #FFDFDF)',
                boxShadow: '0 8px 20px rgba(251, 146, 158, 0.3)'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-700 text-center text-xs">ข้อมูลผู้ใช้</h3>
            </div>
          </button>

          {/* ยาของคุณ */}
          <button onClick={() => onTabChange?.('medicine')} className="group">
            <div className="bg-white/90 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 group-active:scale-95" style={{ border: '2px solid #AEDEFC' }}>              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 mx-auto shadow-lg group-hover:scale-110 transition-transform" style={{ 
                background: 'linear-gradient(135deg, #AEDEFC, #FFF6F6)',
                boxShadow: '0 8px 20px rgba(174, 222, 252, 0.3)'
              }}>
                <span className="material-symbols-outlined text-gray-600 text-3xl">medication</span>
              </div>
              <h3 className="font-bold text-gray-700 text-center text-xs">ยาของคุณ</h3>
            </div>
          </button>
          
          {/* การแจ้งเตือน */}
          <button onClick={() => onTabChange?.('notification')} className="group">
            <div className="bg-white/90 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 group-active:scale-95" style={{ border: '2px solid #FB929E' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 mx-auto shadow-lg group-hover:scale-110 transition-transform" style={{ 
                background: 'linear-gradient(135deg, #FB929E, #AEDEFC)',
                boxShadow: '0 8px 20px rgba(251, 146, 158, 0.3)'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-700 text-center text-xs">การแจ้งเตือน</h3>
            </div>
          </button>

          {/* สรุปรายการ */}
          <button onClick={() => onTabChange?.('summary')} className="group">
            <div className="bg-white/90 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 group-active:scale-95" style={{ border: '2px solid #FFDFDF' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 mx-auto shadow-lg group-hover:scale-110 transition-transform" style={{ 
                background: 'linear-gradient(135deg, #FFDFDF, #AEDEFC)',
                boxShadow: '0 8px 20px rgba(255, 223, 223, 0.3)'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-700 text-center text-xs">สรุปรายการ</h3>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
