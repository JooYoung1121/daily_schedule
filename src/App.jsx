import { useState } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { ScheduleProvider, useSyncStatus } from './context/ScheduleContext'
import { hasToken } from './github'
import Today from './pages/Today'
import Week from './pages/Week'
import BottomNav from './components/BottomNav'
import ScheduleModal from './components/ScheduleModal'
import SetupScreen from './components/SetupScreen'
import { RefreshCw, AlertCircle } from 'lucide-react'

// ─── Sync status bar (shown when saving / on error) ──────────────────────────
function SyncBar() {
  const { syncing, syncError, reload } = useSyncStatus()

  if (!syncing && !syncError) return null

  if (syncing) return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[680px] z-50
                    bg-sage/90 backdrop-blur-sm text-white text-xs font-semibold
                    flex items-center justify-center gap-2 py-2">
      <RefreshCw size={12} className="animate-spin" />
      GitHub에 저장 중…
    </div>
  )

  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[680px] z-50
                    bg-red-400/90 backdrop-blur-sm text-white text-xs font-semibold
                    flex items-center justify-center gap-2 py-2 cursor-pointer"
         onClick={reload}
    >
      <AlertCircle size={12} />
      저장 실패: {syncError} — 탭하여 재시도
    </div>
  )
}

// ─── Main app routes ─────────────────────────────────────────────────────────
function AppRoutes() {
  const [modal, setModal] = useState({
    open: false,
    schedule: null,
    defaultDate: null,
    defaultStartTime: null,
  })

  const openModal  = (opts = {}) =>
    setModal({ open: true, schedule: null, defaultDate: null, defaultStartTime: null, ...opts })

  const closeModal = () =>
    setModal({ open: false, schedule: null, defaultDate: null, defaultStartTime: null })

  return (
    <div className="flex flex-col bg-warm-100" style={{ height: '100dvh' }}>
      <SyncBar />
      <div className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/"     element={<Today openModal={openModal} />} />
          <Route path="/week" element={<Week  openModal={openModal} />} />
        </Routes>
      </div>
      <BottomNav openModal={openModal} />
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

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [ready, setReady] = useState(hasToken)

  if (!ready) {
    return <SetupScreen onDone={() => setReady(true)} />
  }

  return (
    <ScheduleProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </ScheduleProvider>
  )
}
