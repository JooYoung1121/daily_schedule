import { useState } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { ScheduleProvider } from './context/ScheduleContext'
import Today from './pages/Today'
import Week from './pages/Week'
import BottomNav from './components/BottomNav'
import ScheduleModal from './components/ScheduleModal'

function AppRoutes() {
  const [modal, setModal] = useState({
    open: false,
    schedule: null,
    defaultDate: null,
    defaultStartTime: null,
  })

  const openModal = (opts = {}) => {
    setModal({ open: true, schedule: null, defaultDate: null, defaultStartTime: null, ...opts })
  }

  const closeModal = () => {
    setModal({ open: false, schedule: null, defaultDate: null, defaultStartTime: null })
  }

  return (
    <div className="flex flex-col bg-warm-100" style={{ height: '100dvh' }}>
      <div className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<Today openModal={openModal} />} />
          <Route path="/week" element={<Week openModal={openModal} />} />
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

export default function App() {
  return (
    <ScheduleProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </ScheduleProvider>
  )
}
