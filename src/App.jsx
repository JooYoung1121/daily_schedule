import { useState } from 'react'
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { ScheduleProvider } from './context/ScheduleContext'
import { CategoryProvider } from './context/CategoryContext'
import { SettingsProvider } from './context/SettingsContext'
import { hasToken } from './github'
import Today    from './pages/Today'
import Week     from './pages/Week'
import Baby     from './pages/Baby'
import Settings from './pages/Settings'
import BottomNav from './components/BottomNav'
import ScheduleModal from './components/ScheduleModal'
import SetupScreen from './components/SetupScreen'
import { RefreshCw, AlertCircle, Plus } from 'lucide-react'
import { useSyncStatus } from './context/ScheduleContext'

function SyncBar() {
  const { syncing, syncError, reload } = useSyncStatus()
  if (!syncing && !syncError) return null
  if (syncing) return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[680px] z-50
                    bg-sage/90 backdrop-blur-sm text-white text-xs font-semibold
                    flex items-center justify-center gap-2 py-2">
      <RefreshCw size={12} className="animate-spin" />
      엉뚱이네 데이터 저장 중…
    </div>
  )
  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[680px] z-50
                    bg-red-400/90 backdrop-blur-sm text-white text-xs font-semibold
                    flex items-center justify-center gap-2 py-2 cursor-pointer"
         onClick={reload}>
      <AlertCircle size={12} />
      저장 실패: {syncError} — 탭하여 재시도
    </div>
  )
}

function AppRoutes() {
  const location = useLocation()
  const [modal, setModal] = useState({
    open: false, schedule: null, defaultDate: null, defaultStartTime: null,
  })

  const openModal  = (opts = {}) =>
    setModal({ open: true, schedule: null, defaultDate: null, defaultStartTime: null, ...opts })
  const closeModal = () =>
    setModal({ open: false, schedule: null, defaultDate: null, defaultStartTime: null })

  const showFloatingBtn = ['/', '/week'].includes(location.pathname)

  return (
    <div className="flex flex-col bg-warm-100" style={{ height: '100dvh' }}>
      <SyncBar />
      <div className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/"         element={<Today    openModal={openModal} />} />
          <Route path="/week"     element={<Week     openModal={openModal} />} />
          <Route path="/baby"     element={<Baby />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
      <BottomNav />

      {/* Floating + button */}
      {showFloatingBtn && (
        <button
          onClick={() => openModal()}
          className="fixed bottom-[76px] right-4 w-14 h-14 rounded-[18px] bg-terra
                     flex items-center justify-center shadow-warm-lg
                     active:scale-95 transition-transform z-30"
        >
          <Plus size={26} color="white" strokeWidth={2.5} />
        </button>
      )}

      {modal.open && (
        <ScheduleModal
          schedule={modal.schedule}
          defaultDate={modal.defaultDate}
          defaultStartTime={modal.defaultStartTime}
          onClose={closeModal}
        />
      )}
    </div>
  )
}

export default function App() {
  const [ready, setReady] = useState(hasToken)

  if (!ready) {
    return <SetupScreen onDone={() => setReady(true)} />
  }

  return (
    <SettingsProvider>
    <CategoryProvider>
      <ScheduleProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </ScheduleProvider>
    </CategoryProvider>
    </SettingsProvider>
  )
}
