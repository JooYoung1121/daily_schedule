import { useLocation, useNavigate } from 'react-router-dom'
import { Home, CalendarDays, Plus } from 'lucide-react'

export default function BottomNav({ openModal }) {
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
        {/* 오늘 */}
        <button
          onClick={() => navigate('/')}
          className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors
            ${path === '/' ? 'text-terra' : 'text-warm-400'}`}
        >
          <Home size={22} strokeWidth={path === '/' ? 2.5 : 1.8} />
          <span className="text-[11px] font-semibold">오늘</span>
        </button>

        {/* Add button – floating center */}
        <div className="flex-1 flex justify-center">
          <button
            onClick={() => openModal()}
            className="w-[52px] h-[52px] -mt-5 rounded-[18px] bg-terra flex items-center justify-center
                       shadow-warm-lg active:scale-95 transition-transform"
          >
            <Plus size={26} color="white" strokeWidth={2.5} />
          </button>
        </div>

        {/* 주간 */}
        <button
          onClick={() => navigate('/week')}
          className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors
            ${path === '/week' ? 'text-terra' : 'text-warm-400'}`}
        >
          <CalendarDays size={22} strokeWidth={path === '/week' ? 2.5 : 1.8} />
          <span className="text-[11px] font-semibold">주간</span>
        </button>
      </div>
    </div>
  )
}
