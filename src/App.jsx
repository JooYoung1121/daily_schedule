import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { ScheduleProvider } from './context/ScheduleContext'
import { CategoryProvider } from './context/CategoryContext'
import { SettingsProvider } from './context/SettingsContext'
import { ThemeProvider } from './context/ThemeContext'
import { hasToken } from './github'
import Today    from './pages/Today'
import Week     from './pages/Week'
import Baby     from './pages/Baby'
import Settings from './pages/Settings'
import BottomNav from './components/BottomNav'
import ScheduleModal from './components/ScheduleModal'
import SearchModal from './components/SearchModal'
import StatsModal from './components/StatsModal'
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
    open: false, schedule: null,
    defaultDate: null, defaultStartTime: null, defaultPerson: null,
    defaultTitle: null, defaultCategory: null,
  })
  const [searchOpen, setSearchOpen] = useState(false)
  const [statsOpen,  setStatsOpen]  = useState(false)

  // ── 전역 키보드 단축키 ──
  // ⌘/Ctrl+K: 검색, N: 새 일정, /: 검색
  useEffect(() => {
    const handler = (e) => {
      const ae = document.activeElement
      const tag = ae?.tagName
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || ae?.isContentEditable

      // ⌘/Ctrl+K — 검색 (input focused여도 동작)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
        return
      }
      // 모달이 열려있거나 텍스트 입력 중이면 단축키 무시
      if (modal.open || searchOpen || statsOpen || isTyping) return

      if (e.key.toLowerCase() === 'n') {
        e.preventDefault()
        openModal()
      } else if (e.key === '/') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [modal.open, searchOpen, statsOpen]) // eslint-disable-line

  const openModal  = (opts = {}) =>
    setModal({
      open: true, schedule: null,
      defaultDate: null, defaultStartTime: null, defaultPerson: null,
      defaultTitle: null, defaultCategory: null,
      ...opts,
    })
  const closeModal = () =>
    setModal({
      open: false, schedule: null,
      defaultDate: null, defaultStartTime: null, defaultPerson: null,
      defaultTitle: null, defaultCategory: null,
    })

  const openSearch  = () => setSearchOpen(true)
  const closeSearch = () => setSearchOpen(false)
  const openStats   = () => setStatsOpen(true)
  const closeStats  = () => setStatsOpen(false)

  const showFloatingBtn = ['/', '/week'].includes(location.pathname)

  return (
    <div className="flex flex-col bg-warm-100" style={{ height: '100dvh' }}>
      <SyncBar />
      <div className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/"         element={<Today openModal={openModal} onOpenSearch={openSearch} onOpenStats={openStats} />} />
          <Route path="/week"     element={<Week  openModal={openModal} onOpenSearch={openSearch} />} />
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
          defaultPerson={modal.defaultPerson}
          defaultTitle={modal.defaultTitle}
          defaultCategory={modal.defaultCategory}
          onClose={closeModal}
        />
      )}

      {searchOpen && (
        <SearchModal
          onClose={closeSearch}
          onPick={(schedule) => { closeSearch(); openModal({ schedule }) }}
        />
      )}

      {statsOpen && <StatsModal onClose={closeStats} />}
    </div>
  )
}

export default function App() {
  const [ready, setReady] = useState(hasToken)

  if (!ready) {
    return <SetupScreen onDone={() => setReady(true)} />
  }

  return (
    <ThemeProvider>
      <SettingsProvider>
        <CategoryProvider>
          <ScheduleProvider>
            <HashRouter>
              <AppRoutes />
            </HashRouter>
          </ScheduleProvider>
        </CategoryProvider>
      </SettingsProvider>
    </ThemeProvider>
  )
}
