import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore'
import { db, isFirebaseReady } from '../firebase'

const Ctx = createContext(null)

// ─── localStorage helpers ────────────────────────────────────────────────────
const LS_KEY = 'daily_schedules_v1'

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
}

function saveLocal(data) {
  localStorage.setItem(LS_KEY, JSON.stringify(data))
}

function genId() {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

// ─── Provider ────────────────────────────────────────────────────────────────
export function ScheduleProvider({ children }) {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    if (!isFirebaseReady) {
      setSchedules(loadLocal())
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'schedules'),
      orderBy('date'),
      orderBy('startTime'),
    )

    const unsub = onSnapshot(
      q,
      snap => {
        setSchedules(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      err => {
        console.error('Firestore error, falling back to localStorage:', err)
        setSchedules(loadLocal())
        setLoading(false)
      },
    )
    return unsub
  }, [])

  // Persist to localStorage when Firebase is not used
  useEffect(() => {
    if (!isFirebaseReady) saveLocal(schedules)
  }, [schedules])

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const addSchedule = useCallback(async (data) => {
    const payload = { ...data, completed: false }

    if (!isFirebaseReady) {
      const newItem = { ...payload, id: genId(), createdAt: Date.now() }
      setSchedules(prev => [...prev, newItem])
      return
    }

    await addDoc(collection(db, 'schedules'), { ...payload, createdAt: serverTimestamp() })
  }, [])

  const updateSchedule = useCallback(async (id, updates) => {
    if (!isFirebaseReady) {
      setSchedules(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
      return
    }
    await updateDoc(doc(db, 'schedules', id), updates)
  }, [])

  const deleteSchedule = useCallback(async (id) => {
    if (!isFirebaseReady) {
      setSchedules(prev => prev.filter(s => s.id !== id))
      return
    }
    await deleteDoc(doc(db, 'schedules', id))
  }, [])

  const toggleComplete = useCallback(async (schedule) => {
    await updateSchedule(schedule.id, { completed: !schedule.completed })
  }, [updateSchedule])

  return (
    <Ctx.Provider value={{ schedules, loading, addSchedule, updateSchedule, deleteSchedule, toggleComplete }}>
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
  const ctx = useContext(Ctx)
  const dateSet = new Set(dates)
  const filtered = ctx.schedules.filter(s => dateSet.has(s.date))
  return { ...ctx, schedules: filtered }
}

export function useScheduleMutations() {
  const { addSchedule, updateSchedule, deleteSchedule, toggleComplete } = useContext(Ctx)
  return { addSchedule, updateSchedule, deleteSchedule, toggleComplete }
}
