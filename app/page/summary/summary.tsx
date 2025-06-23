'use client'

export default function Summary() {
  return (
    <div className="flex-1 px-4 pb-24 overflow-y-auto">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-700 mb-2">สรุปรายการ</h1>
          <p className="text-gray-600">สรุปข้อมูลและสถิติการใช้ยา</p>
        </div>
        
        <div className="grid gap-4">
          <div className="card bg-white/90 shadow-xl rounded-3xl" style={{ border: '2px solid #FFDFDF' }}>
            <div className="card-body">
              <h2 className="card-title text-gray-700 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFDFDF' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                สรุปรายการ
              </h2>
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-title">ยาทั้งหมด</div>
                  <div className="stat-value">0</div>
                  <div className="stat-desc">รายการ</div>
                </div>
                
                <div className="stat">
                  <div className="stat-title">กินยาแล้ว</div>
                  <div className="stat-value">0</div>
                  <div className="stat-desc">ครั้ง</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
