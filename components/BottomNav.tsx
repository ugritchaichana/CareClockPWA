'use client'

interface BottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const navItems = [
  {
    id: 'welcome',
    label: 'หน้าแรก',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },  {
    id: 'userinfo',
    label: 'ข้อมูลผู้ใช้',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  },  {
    id: 'medicine',
    label: 'ยาของคุณ',
    icon: (
      <span className="material-symbols-outlined">medication</span>
    )
  },
  {
    id: 'notification',
    label: 'การแจ้งเตือน',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    )
  },
  {
    id: 'summary',
    label: 'สรุปรายการ',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  }
]

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <div className="btm-nav bg-white/90 backdrop-blur-sm shadow-lg" style={{ borderTop: '1px solid #FFDFDF' }}>
      {navItems.map(({ id, label, icon }) => {
        const isActive = activeTab === id
        return (
          <button 
            key={id} 
            onClick={() => onTabChange(id)}
            className={`transition-colors ${isActive ? 'text-white font-medium' : 'text-gray-500 hover:text-pink-400'}`}
            style={isActive ? { backgroundColor: '#FB929E' } : {}}
          >
            {icon}
            <span className="btm-nav-label text-xs">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
