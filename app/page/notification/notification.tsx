'use client'

export default function Notification() {
  return (
    <div className="flex-1 px-4 pb-24 overflow-y-auto">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-700 mb-2">การแจ้งเตือน</h1>
          <p className="text-gray-600">แจ้งเตือนการกินยาและนัดหมาย</p>
        </div>
        
        <div className="card bg-white/90 shadow-xl rounded-3xl" style={{ border: '2px solid #FB929E' }}>
          <div className="card-body">
            <h2 className="card-title text-gray-700 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FB929E' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              การแจ้งเตือน
            </h2>
            <p className="text-gray-600">ยังไม่มีการแจ้งเตือน</p>
            
            <div className="card-actions justify-center mt-4">
              <button className="btn gap-2 text-white shadow-lg" style={{ 
                background: 'linear-gradient(135deg, #FB929E, #AEDEFC)',
                border: 'none'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                ตั้งแจ้งเตือน
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
