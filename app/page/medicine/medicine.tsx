'use client'

export default function Medicine() {
  return (
    <div className="flex-1 px-4 pb-24 overflow-y-auto">
      <div className="container mx-auto max-w-2xl">        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-4 mx-auto shadow-lg" style={{ 
            background: 'linear-gradient(135deg, #AEDEFC, #FFF6F6)',
            boxShadow: '0 8px 20px rgba(174, 222, 252, 0.3)'
          }}>
            <span className="material-symbols-outlined text-gray-600 text-4xl">medication</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-700 mb-2">ยาของคุณ</h1>
          <p className="text-gray-600">จัดการและติดตามการใช้ยา</p>
        </div>
        
        <div className="card bg-white/90 shadow-xl rounded-3xl" style={{ border: '2px solid #AEDEFC' }}>
          <div className="card-body">
            <h2 className="card-title text-gray-700">รายการยา</h2>
            <p className="text-gray-600">ยังไม่มีข้อมูลยา กรุณาเพิ่มข้อมูลยา</p>
            
            <div className="card-actions justify-center mt-4">
              <button className="btn gap-2 text-white shadow-lg" style={{ 
                background: 'linear-gradient(135deg, #AEDEFC, #FFF6F6)',
                border: 'none'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                เพิ่มยา
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
