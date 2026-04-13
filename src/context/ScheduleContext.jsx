import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { fetchSchedules, saveSchedules } from '../github'

const Ctx = createContext(null)

// ─── Provider ────────────────────────────────────────────────────────────────
export function ScheduleProvider({ children }) {
  const [schedules, setSchedules] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [syncing,   setSyncing]   = useState(false)   // true while PUT is in-flight
  const [syncError, setSyncError] = useState(null)

  // Keep a ref so mutation callbacks always see fresh values without re-creating
  const stateRef = useRef({ schedules: [], sha: null })

  // ─── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    loadFromGitHub()
  }, [])

  async function loadFromGitHub() {
    setLoading(true)
    setSyncError(null)
    try {
      const { schedules: data, sha } = await fetchSchedules()
      stateRef.current = { schedules: data, sha }
      setSchedules(data)
    } catch (err) {
      setSyncError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ─── Persist helper (optimistic update + GitHub PUT) ─────────────────────
  async function persist(newSchedules) {
    const prevSchedules = stateRef.current.schedules
    const prevSha       = stateRef.current.sha

    // Optimistic: update UI immediately
    stateRef.current.schedules = newSchedules
    setSchedules(newSchedules)
    setSyncing(true)
    setSyncError(null)

    try {
      const newSha = await saveSchedules(newSchedules, prevSha)
      stateRef.current.sha = newSha
    } catch (err) {
      // Rollback on failure
      stateRef.current = { schedules: prevSchedules, sha: prevSha }
      setSchedules(prevSchedules)
      setSyncError(err.message)
    } finally {
      setSyncing(false)
    }
  }

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const addSchedule = useCallback(async (data) => {
    const item = {
      ...data,
      id:        `sch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      completed: false,
      createdAt: new Date().toISOString(),
    }
    await persist([...stateRef.current.schedules, item])
  }, [])

  const updateSchedule = useCallback(async (id, updates) => {
    const next = stateRef.current.schedules.map(s => s.id === id ? { ...s, ...updates } : s)
    await persist(next)
  }, [])

  const deleteSchedule = useCallback(async (id) => {
    const next = stateRef.current.schedules.filter(s => s.id !== id)
    await persist(next)
  }, [])

  const toggleComplete = useCallback(async (schedule) => {
    await updateSchedule(schedule.id, { completed: !schedule.completed })
  }, [updateSchedule])

  const reload = useCallback(() => loadFromGitHub(), [])

  return (
    <Ctx.Provider value={{
      schedules, loading, syncing, syncError,
      addSchedule, updateSchedule, deleteSchedule, toggleComplete, reload,
    }}>
      {children}
    </Ctx.Provider>
  )
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useSchedules(date) {
  const ctx = useContext(Ctx)
  const filtered = ctx.schedules
    .filter(s => s.date === date)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
  return { ...ctx, schedules: filtered }
}

export function useWeekSchedules(dates) {
  const ctx     = useContext(Ctx)
  const dateSet = new Set(dates)
  return { ...ctx, schedules: ctx.schedules.filter(s => dateSet.has(s.date)) }
}

export function useScheduleMutations() {
  const { addSchedule, updateSchedule, deleteSchedule, toggleComplete } = useContext(Ctx)
  return { addSchedule, updateSchedule, deleteSchedule, toggleComplete }
}

export function useSyncStatus() {
  const { syncing, syncError, reload } = useContext(Ctx)
  return { syncing, syncError, reload }
}
