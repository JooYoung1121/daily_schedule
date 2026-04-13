import { useLocation, useNavigate } from 'react-router-dom'
import { Home, CalendarDays, Baby, Settings } from 'lucide-react'

const TABS = [
  { path: '/',         icon: Home,         label: '오늘' },
  { path: '/week',     icon: CalendarDays, label: '주간' },
  { path: '/baby',     icon: Baby,         label: '육아' },
  { path: '/settings', icon: Settings,     label: '설정' },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const path     = location.pathname

  return (
    <div
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[680px]
                 bg-warm-50/95 backdrop-blur-md border-t border-warm-200 z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
    >
      <div className="flex items-center h-16">
        {TABS.map(tab => {
          const Icon   = tab.icon
          const active = path === tab.path
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors
                ${active ? 'text-terra' : 'text-warm-400'}`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[11px] font-semibold">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
