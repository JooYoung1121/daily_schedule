import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { fetchSchedules, saveSchedules } from '../github'

const Ctx = createContext(null)

// ─── Provider ────────────────────────────────────────────────────────────────
export function ScheduleProvider({ children }) {
  const [schedules, setSchedules] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [syncing,   setSyncing]   = useState(false)
  const [syncError, setSyncError] = useState(null)

  const stateRef  = useRef({ schedules: [], sha: null })
  const saveQueue = useRef(Promise.resolve()) // serialize saves

  // ─── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => { loadFromGitHub() }, [])

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

  // ─── Persist helper (serialized + SHA conflict retry) ─────────────────────
  function persist(newSchedules) {
    // Chain saves so they never run concurrently
    const job = saveQueue.current.then(async () => {
      const prevSchedules = stateRef.current.schedules
      const prevSha       = stateRef.current.sha

      stateRef.current.schedules = newSchedules
      setSchedules(newSchedules)
      setSyncing(true)
      setSyncError(null)

      try {
        const newSha = await saveSchedules(newSchedules, prevSha)
        stateRef.current.sha = newSha
      } catch (err) {
        // SHA conflict → fetch fresh SHA and retry once
        if (err.message && err.message.includes('does not match')) {
          try {
            const { sha: freshSha } = await fetchSchedules()
            const newSha = await saveSchedules(newSchedules, freshSha)
            stateRef.current.sha = newSha
            return // retry succeeded
          } catch {
            // retry also failed → rollback
          }
        }
        stateRef.current = { schedules: prevSchedules, sha: prevSha }
        setSchedules(prevSchedules)
        setSyncError(err.message)
      } finally {
        setSyncing(false)
      }
    })
    saveQueue.current = job
    return job
  }

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const addSchedule = useCallback(async (data) => {
    const item = {
      ...data,
      id:        `sch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      completed: false,
      createdAt: new Date().toISOString(),
    }
    await persist([...stateRef.current.schedules, item])
  }, [])

  // Batch add — single persist for multiple schedules (repeat 등)
  const addSchedules = useCallback(async (dataList) => {
    const groupId = dataList.length > 1
      ? `rpt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      : undefined
    const items = dataList.map((data, i) => ({
      ...data,
      id:            `sch_${Date.now() + i}_${Math.random().toString(36).slice(2, 8)}`,
      repeatGroupId: groupId,
      completed:     false,
      createdAt:     new Date().toISOString(),
    }))
    await persist([...stateRef.current.schedules, ...items])
  }, [])

  const updateSchedule = useCallback(async (id, updates) => {
    const next = stateRef.current.schedules.map(s => s.id === id ? { ...s, ...updates } : s)
    await persist(next)
  }, [])

  const deleteSchedule = useCallback(async (id) => {
    const next = stateRef.current.schedules.filter(s => s.id !== id)
    await persist(next)
  }, [])

  // Group operations for repeat schedules
  const updateScheduleGroup = useCallback(async (groupId, updates) => {
    // Update all in group but keep each schedule's own date
    const next = stateRef.current.schedules.map(s =>
      s.repeatGroupId === groupId ? { ...s, ...updates, date: s.date } : s
    )
    await persist(next)
  }, [])

  // Convert single schedule → repeating group (one persist)
  const convertToRepeating = useCallback(async (scheduleId, form, additionalDates) => {
    const groupId = `rpt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const current = stateRef.current.schedules

    // Update original with form + groupId
    const updated = current.map(s =>
      s.id === scheduleId ? { ...s, ...form, repeatGroupId: groupId } : s
    )

    // Create new instances for additional dates
    const newItems = additionalDates.map((date, i) => ({
      ...form,
      date,
      id:            `sch_${Date.now() + i + 1}_${Math.random().toString(36).slice(2, 8)}`,
      repeatGroupId: groupId,
      completed:     false,
      createdAt:     new Date().toISOString(),
    }))

    await persist([...updated, ...newItems])
  }, [])

  const deleteScheduleGroup = useCallback(async (groupId) => {
    const next = stateRef.current.schedules.filter(s => s.repeatGroupId !== groupId)
    await persist(next)
  }, [])

  const toggleComplete = useCallback(async (schedule) => {
    await updateSchedule(schedule.id, { completed: !schedule.completed })
  }, [updateSchedule])

  const reload = useCallback(() => loadFromGitHub(), [])

  return (
    <Ctx.Provider value={{
      schedules, loading, syncing, syncError,
      addSchedule, addSchedules, updateSchedule, deleteSchedule,
      updateScheduleGroup, deleteScheduleGroup, convertToRepeating, toggleComplete, reload,
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

export function useAllSchedules() {
  const ctx = useContext(Ctx)
  return ctx.schedules
}

export function useScheduleMutations() {
  const {
    addSchedule, addSchedules, updateSchedule, deleteSchedule,
    updateScheduleGroup, deleteScheduleGroup, convertToRepeating, toggleComplete,
  } = useContext(Ctx)
  return {
    addSchedule, addSchedules, updateSchedule, deleteSchedule,
    updateScheduleGroup, deleteScheduleGroup, convertToRepeating, toggleComplete,
  }
}

export function useSyncStatus() {
  const { syncing, syncError, reload } = useContext(Ctx)
  return { syncing, syncError, reload }
}
